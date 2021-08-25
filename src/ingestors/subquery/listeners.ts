import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { EVENT_PROPOSAL_INTERMEDIATE_STATUS, IProposalIntermediateStatusEvent } from '../../patrollers/events'
import { TaskQueueService } from '../../queues'
import { SubqueryProposalIngestor } from './ProposalIngestor'

@Injectable()
export class SubqueryEventListener {
    private readonly logger = new Logger(SubqueryEventListener.name)

    constructor(private readonly ingestor: SubqueryProposalIngestor, private readonly queue: TaskQueueService) {}

    @OnEvent(EVENT_PROPOSAL_INTERMEDIATE_STATUS)
    public refreshProposalStatus(event: IProposalIntermediateStatusEvent): void {
        const { destinationChainId, nonce, originChainId } = event
        this.queue.push(async () => {
            const status = await this.ingestor.importProposalStatus(destinationChainId, originChainId, nonce)

            if (status === undefined) {
                return
            }

            this.logger.log(
                `imported progressing proposal, origin=${originChainId}, dest=${destinationChainId}, nonce=${nonce}, new_status=${
                    status?.toString() ?? 'undefined'
                }`
            )
        })
    }
}
