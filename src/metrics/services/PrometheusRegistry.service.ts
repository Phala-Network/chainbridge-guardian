import { Injectable, Scope } from '@nestjs/common'
import { collectDefaultMetrics, Registry } from 'prom-client'

@Injectable({ scope: Scope.DEFAULT })
export class PrometheusRegistry extends Registry {
    constructor() {
        super()
        collectDefaultMetrics({ register: this })
    }
}
