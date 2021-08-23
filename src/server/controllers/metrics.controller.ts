import { Controller, Get } from '@nestjs/common'
import { PrometheusRegistry } from '../../metrics/services/PrometheusRegistry.service'

@Controller('/metrics')
export class MetricsController {
    constructor(private readonly registry: PrometheusRegistry) {}

    @Get()
    async dump(): Promise<string> {
        return await this.registry.metrics()
    }
}
