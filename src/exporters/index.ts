import { Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { MetricsModule } from '../metrics'
import { StorageModule } from '../storage'
import { BridgeTransferMetricsExporter } from './BridgeTransferMetricsExporter'

@Module({
    imports: [MetricsModule, StorageModule],
    providers: [BridgeTransferMetricsExporter],
})
export class ExporterModule implements OnApplicationBootstrap, OnApplicationShutdown {
    private exporter!: BridgeTransferMetricsExporter

    constructor(private readonly moduleRef: ModuleRef) {}

    onApplicationBootstrap(): void {
        this.exporter = this.moduleRef.get(BridgeTransferMetricsExporter)
        this.exporter.start()
    }

    onApplicationShutdown(): void {
        this.exporter.stop()
    }
}
