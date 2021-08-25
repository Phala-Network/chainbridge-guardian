import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { BridgeTransferService } from '../storage/services'
import { EVENT_PROPOSAL_INTERMEDIATE_STATUS, IProposalIntermediateStatusEvent } from './events'

const defaultProposalPatrolInterval = 60

const defaultPatrolPageSize = 20

@Injectable()
export class BridgeTransferPatroller {
    private readonly logger: Logger = new Logger(BridgeTransferPatroller.name)

    private stopped = false
    private timeout?: NodeJS.Timeout

    constructor(private readonly events: EventEmitter2, private readonly transfers: BridgeTransferService) {}

    public start(): void {
        this.stopped = false
        setImmediate(() => this.tick())
    }

    public stop(): void {
        this.stopped = true
        this.timeout !== undefined && clearTimeout(this.timeout)
    }

    public async patrolProposals(): Promise<number> {
        let skip = 0

        while (true) {
            const result = await this.transfers.findNotFinalizedProposals(skip, defaultPatrolPageSize)

            result.forEach((transfer) => {
                const { destinationChainId, nonce, originChainId } = transfer
                this.events.emit(EVENT_PROPOSAL_INTERMEDIATE_STATUS, {
                    destinationChainId,
                    nonce,
                    originChainId,
                } as IProposalIntermediateStatusEvent)
            })

            skip += result.length

            if (result.length < defaultPatrolPageSize) {
                break
            }
        }

        return skip
    }

    private tick(): void {
        if (this.stopped) {
            return
        }

        this.patrolProposals()
            .then((count) => {
                const message = `found ${count} proposals with incomplete status`
                if (count > 0) {
                    this.logger.warn(message)
                } else {
                    this.logger.debug(message)
                }
            })
            .catch((error) => {
                this.logger.error('error during patrol:', error)
            })
            .finally(() => {
                this.timeout = setTimeout(() => this.tick(), defaultProposalPatrolInterval * 1000)
            })
    }
}
