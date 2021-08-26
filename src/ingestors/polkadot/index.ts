import { Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { IngestorModule } from '..'
import { MetricsModule } from '../../metrics'
import { ApiPromiseFactory } from './services/ApiPromiseFactory.service'
import { ChainBridgeIngestorService } from './services/ChainBridgeIngestor.service'

@Module({
    imports: [IngestorModule, MetricsModule],
    providers: [ApiPromiseFactory, ChainBridgeIngestorService],
})
export class PolkadotIngestorModule implements OnApplicationBootstrap, OnApplicationShutdown {
    private chainBridgeIngestor!: ChainBridgeIngestorService

    constructor(private readonly moduleRef: ModuleRef) {}

    onApplicationBootstrap(): void {
        this.chainBridgeIngestor = this.moduleRef.get(ChainBridgeIngestorService)
        this.chainBridgeIngestor.start()
    }

    onApplicationShutdown(): void {
        this.chainBridgeIngestor?.stop()
    }
}
