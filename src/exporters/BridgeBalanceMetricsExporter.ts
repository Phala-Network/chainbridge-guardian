import { Injectable, Logger } from '@nestjs/common'
import { Gauge } from 'prom-client'
import { PrometheusRegistry } from '../metrics/services/PrometheusRegistry.service'
import { BridgeTransferService } from '../storage/services'

const defaultExportInterval = 30

@Injectable()
export class BridgeDepositBalanceMetricsExporter {
    private readonly logger = new Logger(BridgeDepositBalanceMetricsExporter.name)

    private readonly gauge: Gauge<string>

    private stopped = true

    private timeout?: NodeJS.Timeout

    constructor(registry: PrometheusRegistry, private readonly transfers: BridgeTransferService) {
        this.gauge = new Gauge({
            help: 'ChainBridge Deposit Balance',
            labelNames: ['destinationChainId', 'originChainId', 'balance'],
            name: 'chainbridge_deposit_balances',
        })
        registry.registerMetric(this.gauge)
    }

    public start(): void {
        this.stopped = false
        setImmediate(() => this.tick())
    }

    public stop(): void {
        this.stopped = true
        this.timeout !== undefined && clearTimeout(this.timeout)
    }

    private async export(): Promise<void> {
        const results = await this.transfers.findCalculatedBalance()
        this.gauge.reset()
        results.forEach(({ balance, destinationChainId, originChainId }) => {
            this.gauge.set(
                {
                    destinationChainId: destinationChainId.toString(),
                    originChainId: originChainId.toString(),
                },
                parseInt(balance)
            )
        })
    }

    private tick(): void {
        if (this.stopped) {
            return
        }

        this.export()
            .catch((error) => {
                this.logger.error('failed to export metrics:', error)
            })
            .finally(() => {
                this.timeout = setTimeout(() => this.tick(), defaultExportInterval * 1000)
            })
    }
}
