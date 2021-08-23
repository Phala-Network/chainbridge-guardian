import { readFileSync } from 'fs'
import merge from 'lodash/merge'
import { IIngestorConfiguration } from '../ingestors'

export interface IConfiguration {
    ingestors: IIngestorConfiguration
}

export function load(): IConfiguration {
    const defaultConfig: IConfiguration = {
        ingestors: {
            bridgeTransferPaths: [],
            dataSources: {
                depositRecords: [],
                proposals: [],
            },
        },
    }

    try {
        const customConfig = JSON.parse(readFileSync('config.json').toString()) as unknown
        return merge(defaultConfig, customConfig)
    } catch {
        return defaultConfig
    }
}
