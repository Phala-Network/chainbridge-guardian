import { Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { MetricsModule } from '../metrics'
import { StorageModule } from '../storage'
import { BridgeDepositBalanceMetricsExporter } from './BridgeBalanceMetricsExporter'
import { BridgeTransferMetricsExporter } from './BridgeTransferMetricsExporter'

@Module({
    imports: [MetricsModule, StorageModule],
    providers: [BridgeDepositBalanceMetricsExporter, BridgeTransferMetricsExporter],
})
export class ExporterModule implements OnApplicationBootstrap, OnApplicationShutdown {
    private balanceExporter!: BridgeDepositBalanceMetricsExporter
    private proposalStatusExporter!: BridgeTransferMetricsExporter

    constructor(private readonly moduleRef: ModuleRef) {}

    onApplicationBootstrap(): void {
        this.balanceExporter = this.moduleRef.get(BridgeDepositBalanceMetricsExporter)
        this.proposalStatusExporter = this.moduleRef.get(BridgeTransferMetricsExporter)
        this.balanceExporter.start()
        this.proposalStatusExporter.start()
    }

    onApplicationShutdown(): void {
        this.balanceExporter.stop()
        this.proposalStatusExporter.stop()
    }
}
