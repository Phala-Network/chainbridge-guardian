import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MetricsModule } from '../metrics'
import { BridgeTransfer } from '../storage/entity'
import { MetricsController } from './controllers/metrics.controller'

@Module({
    controllers: [MetricsController],
    imports: [
        MetricsModule,
        TypeOrmModule.forRoot({ ...require('../../ormconfig.json'), entities: [BridgeTransfer] }),
    ],
})
export class AppModule {}
