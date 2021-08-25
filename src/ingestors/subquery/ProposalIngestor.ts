import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { GraphQLClient } from 'graphql-request'
import { IngestorConfigService } from '..'
import { BridgeTransferStatus, BridgeTransferStatusEnum } from '../../storage/entity'
import { EVENT_DEPOSIT_RECORD_CREATED, IDepositRecordCreatedEvent } from '../../storage/events'
import { BridgeTransferService } from '../../storage/services'
import { getSdk, Sdk } from './graphql'

@Injectable()
export class SubqueryProposalIngestor {
    private readonly clients: Map<number, Sdk>

    private readonly logger = new Logger(SubqueryProposalIngestor.name)

    constructor(config: IngestorConfigService, private readonly transfers: BridgeTransferService) {
        this.clients = new Map(
            Object.entries(config.dataSources.proposals)
                .filter(([, dataSource]) => dataSource.type === 'subquery')
                .map(([chainId, dataSource]) => [parseInt(chainId), getSdk(new GraphQLClient(dataSource.endpoint))])
        )
    }

    /**
     * manually import a proposal status by deposit nonce
     * @returns undefined if ingestor isn't configured for such destination chain
     */
    public async importProposalStatus(
        destinationChainId: number,
        originChainId: number,
        nonce: string
    ): Promise<BridgeTransferStatus | undefined> {
        const client = this.clients.get(destinationChainId)
        if (client === undefined) {
            return undefined
        }

        const result = await client.getProposal({ depositNonce: nonce, originChainId })

        const approval = result?.chainBridgeProposalApprovals?.nodes?.[0]
        const execution = result?.chainBridgeProposalExecutions?.nodes?.[0]

        const status =
            execution !== undefined
                ? BridgeTransferStatusEnum.Succeeded
                : approval !== undefined
                ? BridgeTransferStatusEnum.Approved
                : null

        await this.transfers.updateStatus(originChainId, destinationChainId, nonce, status)

        return status
    }

    @OnEvent(EVENT_DEPOSIT_RECORD_CREATED, { async: true })
    public async handleDepositRecordCreated(event: IDepositRecordCreatedEvent): Promise<void> {
        const { destinationChainId, nonce, originChainId } = event
        const status = await this.importProposalStatus(destinationChainId, originChainId, nonce)

        if (status !== undefined) {
            this.logger.log(
                `imported proposal on creation, origin=${originChainId}, dest=${destinationChainId}, nonce=${nonce}, status=${
                    status?.toString() ?? 'null'
                }`
            )
        }
    }
}
