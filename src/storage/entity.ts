import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export interface IBridgeTransfer {
    destinationChainId: number
    originChainId: number
    resourceId: string

    amount: string
    depositor: string
    destinationRecipientAddress: string
    nonce: string
    tokenAddress: string

    calculatedBalance: string
}

@Entity()
export class BridgeTransfer implements IBridgeTransfer {
    @PrimaryGeneratedColumn() public id!: number
    @Column() public amount!: string
    @Column() public calculatedBalance!: string
    @Column() public depositor!: string
    @Column() public destinationChainId!: number
    @Column() public destinationRecipientAddress!: string
    @Column({ type: 'bigint' }) public nonce!: string
    @Column() public originChainId!: number
    @Column() public resourceId!: string
    @Column() public tokenAddress!: string
}
