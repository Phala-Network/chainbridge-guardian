import { Injectable, Module } from '@nestjs/common'
import { GlobalConfigModule, GlobalConfigService } from '../config'

export interface IBridgeTransferPath {
    destination: number
    origin: number
}

export interface IDepositRecordDataSource {
    endpoint: string
    type: 'subgraph'
}

export interface IProposalDataSource {
    endpoint: string
    type: 'subquery'
}

export interface IIngestorDataSources {
    depositRecords: Record<number, IDepositRecordDataSource>
    proposals: Record<number, IProposalDataSource>
}

export interface IIngestorConfiguration {
    bridgeTransferPaths: IBridgeTransferPath[]
    dataSources: IIngestorDataSources
}

@Injectable()
export class IngestorConfigService implements IIngestorConfiguration {
    public readonly bridgeTransferPaths: IBridgeTransferPath[]
    public readonly dataSources: IIngestorDataSources

    constructor(parent: GlobalConfigService) {
        const { bridgeTransferPaths, dataSources } = parent.ingestors
        this.bridgeTransferPaths = bridgeTransferPaths
        this.dataSources = dataSources
    }
}

@Module({
    exports: [IngestorConfigService],
    imports: [GlobalConfigModule],
    providers: [IngestorConfigService],
})
export class IngestorModule {}
