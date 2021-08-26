import { Injectable } from '@nestjs/common'
import { typesChain } from '@phala/typedefs'
import { ApiPromise, WsProvider } from '@polkadot/api'

@Injectable()
export class ApiPromiseFactory {
    private readonly cache = new Map<string, Promise<ApiPromise>>()

    public async get(endpoint: string): Promise<ApiPromise> {
        if (!this.cache.has(endpoint)) {
            this.cache.set(endpoint, ApiPromise.create({ provider: new WsProvider(endpoint), typesChain }))
        }
        return this.cache.get(endpoint) as Promise<ApiPromise>
    }
}
