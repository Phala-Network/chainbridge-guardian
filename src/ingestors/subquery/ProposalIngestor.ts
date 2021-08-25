import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { GraphQLClient } from 'graphql-request'
import { IngestorConfigService } from '..'
import { BridgeTransferStatusEnum } from '../../storage/entity'
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

    @OnEvent(EVENT_DEPOSIT_RECORD_CREATED, { async: true })
    public async handleDepositRecordCreated(event: IDepositRecordCreatedEvent): Promise<void> {
        const { destinationChainId, nonce, originChainId } = event

        const client = this.clients.get(destinationChainId)
        if (client === undefined) {
            return
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
        this.logger.log(
            `updated status, origin=${originChainId}, dest=${destinationChainId}, nonce=${nonce}, status=${
                status ?? 'null'
            }`
        )
    }
}
