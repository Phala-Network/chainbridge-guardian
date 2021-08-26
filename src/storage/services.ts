import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { InjectEntityManager } from '@nestjs/typeorm'
import BN from 'bn.js'
import { EntityManager, LessThan, MoreThan } from 'typeorm'
import { BridgeTransfer, BridgeTransferStatus, IBridgeTransfer } from './entity'
import { EVENT_DEPOSIT_RECORD_CREATED, IDepositRecordCreatedEvent } from './events'

type CountNotFinalizedProposalsResult = Array<{
    count: string
    destinationChainId: number
    originChainId: number
    status: BridgeTransferStatus
}>

@Injectable()
export class BridgeTransferService {
    private logger: Logger = new Logger()

    constructor(
        @InjectEntityManager() private readonly entityManager: EntityManager,
        private readonly events: EventEmitter2
    ) {}

    public async countNotFinalizedProposals(): Promise<CountNotFinalizedProposalsResult> {
        return await this.entityManager
            .getRepository(BridgeTransfer)
            .createQueryBuilder('record')
            .select('COUNT(*) as count')
            .addSelect('record.destinationChainId', 'destinationChainId')
            .addSelect('record.originChainId', 'originChainId')
            .addSelect('record.status', 'status')
            .addGroupBy('record.destinationChainId')
            .addGroupBy('record.originChainId')
            .addGroupBy('record.status')
            .getRawMany()
    }

    public async findNotFinalizedProposals(skip: number, take: number): Promise<IBridgeTransfer[]> {
        return await this.entityManager.find(BridgeTransfer, {
            order: { nonce: 'ASC' },
            skip,
            take,
            where: { status: null },
        })
    }

    public async findLastOne(destinationChainId: number, originChainId: number): Promise<IBridgeTransfer | undefined> {
        return (
            await this.entityManager.find(BridgeTransfer, {
                order: { nonce: 'DESC' },
                take: 1,
                where: { destinationChainId, originChainId },
            })
        )[0]
    }

    public async insert(insert: Omit<IBridgeTransfer, 'calculatedBalance'> & Partial<IBridgeTransfer>): Promise<void> {
        const { amount, depositor, destinationChainId, destinationRecipient, nonce, originChainId, resourceId } = insert

        await this.entityManager.transaction(async (tx) => {
            const repo = tx.getRepository(BridgeTransfer)

            this.logger.debug(
                `begin insert: from=${originChainId}, to=${destinationChainId}, nonce=${nonce}, amount=${amount}`
            )

            // lookup last record for accumulated balance

            const last = await repo.find({
                order: { nonce: 'DESC' },
                select: ['calculatedBalance', 'nonce'],
                take: 1,
                where: { destinationChainId, nonce: LessThan(nonce), resourceId, originChainId },
            })

            // calculate accumulated balance and insert records

            let calculatedBalance = new BN(last[0]?.calculatedBalance ?? '0', 10).add(new BN(amount, 10))

            const entity: IBridgeTransfer = {
                amount,
                calculatedBalance: calculatedBalance.toString(),
                depositor,
                destinationChainId,
                destinationRecipient,
                nonce,
                originChainId,
                resourceId,
                status: null,
            }

            await repo.save(entity)

            // update victim records affected by this insertion that need to have balance updated

            const victims = await repo.find({
                order: { nonce: 'ASC' },
                select: ['amount', 'calculatedBalance', 'nonce'],
                where: { destinationChainId, nonce: MoreThan(nonce), resourceId, originChainId },
            })

            const queue: Promise<unknown>[] = []

            for (const victim of victims) {
                const { amount } = victim
                calculatedBalance = calculatedBalance.add(new BN(amount, 10))
                queue.push(repo.save({ calculatedBalance: calculatedBalance.toString() }))
            }

            await Promise.all(queue)
        })

        this.events.emit(EVENT_DEPOSIT_RECORD_CREATED, {
            destinationChainId,
            nonce,
            originChainId,
        } as IDepositRecordCreatedEvent)
    }

    public async updateStatus(
        originChainId: number,
        destinationChainId: number,
        nonce: string,
        status: BridgeTransferStatus
    ): Promise<void> {
        await this.entityManager.transaction(async (tx) => {
            const records = tx.getRepository(BridgeTransfer)
            const record = (await records.find({ where: { destinationChainId, nonce, originChainId } }))[0]
            if (record !== undefined) {
                record.status = status
                await records.save(record)
            }
        })
    }
}
