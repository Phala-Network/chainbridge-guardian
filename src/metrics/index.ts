import { Module } from '@nestjs/common'
import { PrometheusRegistry } from './services/PrometheusRegistry.service'

@Module({
    exports: [PrometheusRegistry],
    providers: [PrometheusRegistry],
})
export class MetricsModule {}
