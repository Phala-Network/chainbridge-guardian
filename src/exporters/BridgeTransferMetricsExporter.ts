import { Injectable, Logger } from '@nestjs/common'
import { Gauge } from 'prom-client'
import { PrometheusRegistry } from '../metrics/services/PrometheusRegistry.service'
import { BridgeTransferService } from '../storage/services'

const defaultExportInterval = 1

@Injectable()
export class BridgeTransferMetricsExporter {
    private readonly logger = new Logger(BridgeTransferMetricsExporter.name)

    private readonly gauge: Gauge<string>

    private stopped = true

    private timeout?: NodeJS.Timeout

    constructor(registry: PrometheusRegistry, private readonly transfers: BridgeTransferService) {
        this.gauge = new Gauge({
            help: 'ChainBridge Proposal Counts, group by status',
            labelNames: ['destinationChainId', 'originChainId', 'status'],
            name: 'chainbridge_proposal_counts',
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
        const results = await this.transfers.countNotFinalizedProposals()
        this.gauge.reset()
        results.forEach(({ count, destinationChainId, originChainId, status }) => {
            this.gauge.set(
                {
                    destinationChainId: destinationChainId.toString(),
                    originChainId: originChainId.toString(),
                    status: status?.toString(),
                },
                parseInt(count)
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
