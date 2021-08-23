import { Injectable, Logger } from '@nestjs/common'
import { BN } from 'bn.js'
import { GraphQLClient } from 'graphql-request'
import { IngestorConfigService } from '..'
import { BridgeTransferService } from '../../storage/services'
import { GetDepositRecordsQuery, getSdk, Sdk } from './graphql'

const defaultBatchSize = 10
const defaultInitialBackoff = 15 // seconds
const defaultMaxBackoff = 60 // seconds

interface IDepositRecordIngestorConfiguration {
    endpoint: string

    destinationChainId: number
    originChainId: number
}

export class SubgraphDepositRecordIngestor {
    private readonly logger = new Logger(SubgraphDepositRecordIngestor.name)

    private backoff: number = defaultInitialBackoff
    private readonly sdk: Sdk
    private timeout?: NodeJS.Timeout = undefined

    constructor(
        private readonly config: IDepositRecordIngestorConfiguration,
        private readonly transfers: BridgeTransferService
    ) {
        this.sdk = getSdk(new GraphQLClient(config.endpoint))
    }

    public start(): void {
        this.backoff = 0
        setImmediate(() => this.tick())
    }

    public stop(): void {
        this.backoff = Infinity
        this.timeout !== undefined && clearTimeout(this.timeout)
    }

    private async fetch(): Promise<number> {
        const { destinationChainId, originChainId } = this.config

        const top = await this.transfers.findLastOne(destinationChainId, originChainId)

        let result: GetDepositRecordsQuery
        try {
            result = await this.sdk.getDepositRecords({
                destinationChainId,
                first: defaultBatchSize,
                nonceGreaterThan: top?.nonce ?? '0',
            })
        } catch (error) {
            this.logger.error(
                `failed to fetch deposit records, origin=${originChainId}, dest=${destinationChainId}, error:`,
                error
            )
            return 0
        }

        const records = result.depositRecords
            .map((record) => ({
                ...record,
                parsedNonce: new BN(record.nonce),
            }))
            .sort(({ parsedNonce: a }, { parsedNonce: b }) => {
                return a.sub(b).toNumber()
            })

        if (records.length !== 0) {
            for (const { amount, depositor, destinationChainId, destinationRecipient, nonce, resourceId } of records) {
                await this.transfers.insert({
                    amount,
                    depositor,
                    destinationChainId,
                    destinationRecipient,
                    nonce,
                    originChainId,
                    resourceId,
                })
            }

            const highNonce = records[records.length - 1]?.nonce ?? ''
            this.logger.log(
                `imported ${records.length} records, origin=${originChainId}, dest=${destinationChainId}, high_nonce=${highNonce}`
            )

            return records.length
        } else {
            const lastNonce = top?.nonce ?? ''
            this.logger.debug(
                `fetched ${records.length} records, origin=${originChainId}, dest=${destinationChainId}, last_nonce=${lastNonce}`
            )

            return 0
        }
    }

    private tick(): void {
        if (this.backoff === Infinity) {
            return
        }

        this.fetch()
            .then((count) => {
                this.backoff = count === 0 ? defaultInitialBackoff : 0
            })
            .catch(() => {
                this.backoff = Math.max(this.backoff + defaultInitialBackoff, defaultMaxBackoff)
            })
            .finally(() => {
                this.timeout = setTimeout(() => this.tick(), this.backoff * 1000)
            })
    }
}

@Injectable()
export class SubgraphDepositRecordIngestorOperator {
    private readonly ingestors: SubgraphDepositRecordIngestor[]

    private readonly logger: Logger = new Logger(SubgraphDepositRecordIngestorOperator.name)

    constructor(config: IngestorConfigService, transfers: BridgeTransferService) {
        const graphs = new Map(
            Object.entries(config.dataSources.depositRecords).filter(([, dataSource]) => {
                return dataSource.type === 'subgraph'
            })
        )

        this.ingestors = config.bridgeTransferPaths
            .map((path) => {
                const { destination: destinationChainId, origin: originChainId } = path
                const graph = graphs.get(originChainId.toString())

                if (graph === undefined) {
                    return undefined
                }

                this.logger.log(
                    `configured deposit record ingestor, origin=${originChainId}, destination=${destinationChainId}`
                )

                return new SubgraphDepositRecordIngestor(
                    {
                        destinationChainId,
                        endpoint: graph.endpoint,
                        originChainId,
                    },
                    transfers
                )
            })
            .filter((ingestor): ingestor is SubgraphDepositRecordIngestor => ingestor !== undefined)
    }

    public start(): void {
        this.ingestors.forEach((ingestor) => ingestor.start())
    }

    public stop(): void {
        this.ingestors?.forEach((ingestor) => ingestor.stop())
    }
}
