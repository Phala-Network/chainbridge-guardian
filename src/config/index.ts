import { Injectable, Module, Scope } from '@nestjs/common'
import { IIngestorConfiguration } from '../ingestors'
import { IConfiguration, load } from './loader'

@Injectable({ scope: Scope.DEFAULT })
export class GlobalConfigService implements IConfiguration {
    public readonly ingestors: IIngestorConfiguration

    constructor() {
        const { ingestors } = load()
        this.ingestors = ingestors
    }
}

@Module({
    exports: [GlobalConfigService],
    providers: [GlobalConfigService],
})
export class GlobalConfigModule {}
