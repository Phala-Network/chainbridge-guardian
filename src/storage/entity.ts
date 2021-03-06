import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

export enum BridgeTransferStatusEnum {
    Approved = 'approved',
    Succeeded = 'succeeded',
}

export type BridgeTransferStatus = BridgeTransferStatusEnum | null

export interface IBridgeTransfer {
    destinationChainId: number
    originChainId: number
    resourceId: string

    amount: string
    depositor: string
    destinationRecipient: string
    nonce: string

    status: BridgeTransferStatus

    calculatedBalance: string
}

@Entity()
@Index(['destinationChainId', 'originChainId', 'nonce'], { unique: true })
@Index(['destinationChainId', 'originChainId', 'resourceId'])
export class BridgeTransfer implements IBridgeTransfer {
    @PrimaryGeneratedColumn() public id!: number

    @Column() public destinationChainId!: number
    @Column() public originChainId!: number
    @Column() public resourceId!: string

    @Column({ type: 'bigint' }) public nonce!: string

    @Column() public amount!: string
    @Column() public calculatedBalance!: string
    @Column() public depositor!: string
    @Column() public destinationRecipient!: string

    @Column({ default: null, enum: ['approved', 'succeeded'], nullable: true, type: 'text' })
    public status!: BridgeTransferStatus
}
