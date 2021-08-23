import { Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { IngestorModule } from '..'
import { StorageModule } from '../../storage'
import { SubgraphDepositRecordIngestorOperator } from './DepositRecordIngestor'

@Module({
    imports: [IngestorModule, StorageModule],
    providers: [SubgraphDepositRecordIngestorOperator],
})
export class SubgraphIngestorModule implements OnApplicationBootstrap, OnApplicationShutdown {
    private subgraphOperator?: SubgraphDepositRecordIngestorOperator

    constructor(private readonly moduleRef: ModuleRef) {}

    onApplicationBootstrap(): void {
        this.subgraphOperator = this.moduleRef.get(SubgraphDepositRecordIngestorOperator)
        this.subgraphOperator?.start()
    }

    onApplicationShutdown(): void {
        this.subgraphOperator?.stop()
    }
}
