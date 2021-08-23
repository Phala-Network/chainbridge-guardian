export const EVENT_DEPOSIT_RECORD_CREATED = 'storage.depositRecordCreated'

export interface IDepositRecordCreatedEvent {
    destinationChainId: number
    nonce: string
    originChainId: number
}
