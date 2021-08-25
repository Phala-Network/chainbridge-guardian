import { Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { IngestorModule } from '../ingestors'
import { StorageModule } from '../storage'
import { BridgeTransferPatroller } from './BridgeTransferPatroller'

@Module({
    imports: [IngestorModule, StorageModule],
    providers: [BridgeTransferPatroller],
})
export class PatrolModule implements OnApplicationBootstrap, OnApplicationShutdown {
    private patroller!: BridgeTransferPatroller

    constructor(private readonly moduleRef: ModuleRef) {}

    onApplicationBootstrap(): void {
        this.patroller = this.moduleRef.get(BridgeTransferPatroller)
        this.patroller.start()
    }

    onApplicationShutdown(): void {
        this.patroller.stop()
    }
}
