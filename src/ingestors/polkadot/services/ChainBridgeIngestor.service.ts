import { Injectable, Logger } from '@nestjs/common'
import { ApiPromise } from '@polkadot/api'
import { AccountId, AccountInfo } from '@polkadot/types/interfaces'
import { Decimal } from 'decimal.js'
import { Gauge } from 'prom-client'
import { clearTimeout } from 'timers'
import { IngestorConfigService } from '../..'
import { PrometheusRegistry } from '../../../metrics/services/PrometheusRegistry.service'
import { ApiPromiseFactory } from './ApiPromiseFactory.service'

const defaultImportInterval = 60

interface ChainBridgeIngestorMetrics {
    accountBalance: Gauge<string>
    // proposalCount: Gauge<string>
}

class ChainBridgeIngestor {
    private readonly logger = new Logger(ChainBridgeIngestor.name)

    private stopped = true

    private timeout?: NodeJS.Timeout

    constructor(
        private readonly endpoint: string,
        private readonly factory: ApiPromiseFactory,
        private readonly labels: Record<string, string>,
        private readonly metrics: ChainBridgeIngestorMetrics
    ) {}

    public start(): void {
        this.stopped = false
        setImmediate(() => this.tick())
    }

    public stop(): void {
        this.stopped = true
        this.timeout !== undefined && clearTimeout(this.timeout)
    }

    private async fetch(): Promise<boolean> {
        let api: ApiPromise
        try {
            api = await this.factory.get(this.endpoint)
        } catch (error) {
            this.logger.error('failed to get ApiPromise:', error)
            return false
        }

        let bridgeAccountId: AccountId
        let bridgeAccount: AccountInfo
        try {
            bridgeAccountId = api.consts.chainBridge.bridgeAccountId
            bridgeAccount = await api.query.system.account(bridgeAccountId)
        } catch (error) {
            this.logger.error('failed to read bridge account:', error)
            return false
        }

        const decimal = api.registry.chainDecimals[0]
        if (decimal === undefined) {
            throw new Error('Chain decimal is undefined')
        }

        const free = parseFloat(
            new Decimal(bridgeAccount.data.free.toString()).div(new Decimal(10).pow(decimal)).toString()
        )
        this.metrics.accountBalance.set(this.labels, free)

        return true
    }

    private tick(): void {
        if (this.stopped) {
            return
        }

        this.fetch()
            .catch((error) => {
                this.logger.error('failed to fetch:', error)
            })
            .finally(() => {
                this.timeout = setTimeout(() => this.tick(), defaultImportInterval * 1000)
            })
    }
}

@Injectable()
export class ChainBridgeIngestorService {
    private ingestors: ChainBridgeIngestor[] = []

    private readonly logger = new Logger(ChainBridgeIngestorService.name)

    constructor(
        private readonly config: IngestorConfigService,
        factory: ApiPromiseFactory,
        registry: PrometheusRegistry
    ) {
        const metrics: ChainBridgeIngestorMetrics = {
            accountBalance: new Gauge({
                help: 'ChainBridge Bridge Account Balance',
                labelNames: ['chainId'],
                name: 'chainbridge_account_balances',
            }),
            // proposalCount: new Gauge({
            //     help: 'ChainBridge Bridge Proposal Count',
            //     labelNames: ['chainId', 'originChainId'],
            //     name: 'chainbridge_last_nonces',
            // }),
        }
        registry.registerMetric(metrics.accountBalance)
        // registry.registerMetric(metrics.proposalCount)

        this.ingestors = Object.entries(this.config.dataSources.substrates)
            .filter(([, config]) => config.chainBridge === true)
            .map(([chainId, config]) => {
                const { endpoint } = config

                const labels = { chainId }
                const ingestor = new ChainBridgeIngestor(endpoint, factory, labels, metrics)

                this.logger.debug(`configured chainId=${chainId}, endpoint=${endpoint}`)

                return ingestor
            })
    }

    public start(): void {
        this.ingestors.forEach((ingestor) => ingestor.start())
    }

    public stop(): void {
        this.ingestors.forEach((ingestor) => ingestor.stop())
    }
}
