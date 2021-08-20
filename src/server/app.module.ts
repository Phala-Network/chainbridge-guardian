import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BridgeTransfer } from '../storage/entity'
import { MetricsController } from './controllers/metrics.controller'
import { PrometheusRegistry } from './services/PrometheusRegistry.service'

@Module({
    controllers: [MetricsController],
    imports: [TypeOrmModule.forRoot({ ...require('../../ormconfig.json'), entities: [BridgeTransfer] })],
    providers: [PrometheusRegistry],
})
export class AppModule {}
