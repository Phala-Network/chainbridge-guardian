import { Module } from '@nestjs/common'
import { MetricsController } from './controllers/metrics.controller'
import { PrometheusRegistry } from './services/PrometheusRegistry.service'

@Module({
    controllers: [MetricsController],
    imports: [],
    providers: [PrometheusRegistry],
})
export class AppModule {}
