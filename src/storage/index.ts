import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BridgeTransfer } from './entity'
import { BridgeTransferService } from './services'

@Module({
    exports: [BridgeTransferService],
    imports: [TypeOrmModule.forFeature([BridgeTransfer])],
    providers: [BridgeTransferService],
})
export class StorageModule {}
