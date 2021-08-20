import { Inject, Injectable, Logger } from '@nestjs/common'
import { InjectEntityManager } from '@nestjs/typeorm'
import BN from 'bn.js'
import { EntityManager, LessThan, MoreThan } from 'typeorm'
import { BridgeTransfer, IBridgeTransfer } from './entity'

@Injectable()
export class BridgeTransferService {
    constructor(
        @InjectEntityManager() private readonly entityManager: EntityManager,
        @Inject() private readonly logger: Logger
    ) {}

    public async insert(record: IBridgeTransfer): Promise<void> {
        const { amount, destinationChainId, nonce, originChainId, resourceId } = record

        await this.entityManager.transaction(async (tx) => {
            const repo = tx.getRepository(BridgeTransfer)

            this.logger.verbose('reading record with highest nonce', {
                destinationChainId,
                nonce,
                resourceId,
                originChainId,
            })

            const prev = await repo.find({
                order: { nonce: 'DESC' },
                select: ['calculatedBalance', 'nonce'],
                take: 1,
                where: { destinationChainId, nonce: LessThan(nonce), resourceId, originChainId },
            })

            // calculate accumulated balance

            let balance = new BN(prev[0]?.calculatedBalance ?? '0').add(new BN(amount))
            record.calculatedBalance = balance.toString()

            this.logger.debug('saving record', {
                amount,
                balance,
                destinationChainId,
                nonce,
                resourceId,
                originChainId,
            })
            await repo.save(record)

            // read victim records affected by this insertion that need to have balance updated

            const next = await repo.find({
                order: { nonce: 'ASC' },
                select: ['amount', 'calculatedBalance', 'nonce'],
                where: { destinationChainId, nonce: MoreThan(nonce), resourceId, originChainId },
            })

            if (next.length === 0) {
                // no victim records of this insertion
                return
            }

            this.logger.warn(`updating ${next.length} victim records of insertion`, {
                destinationChainId,
                nonce,
                resourceId,
                originChainId,
            })

            await Promise.all(
                next.map((record) => {
                    balance = balance.add(new BN(record.amount))
                    record.calculatedBalance = balance.toString()
                    return repo.save(record)
                })
            )
        })
    }
}
