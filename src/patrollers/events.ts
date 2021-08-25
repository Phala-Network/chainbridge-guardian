export const EVENT_PROPOSAL_INTERMEDIATE_STATUS = 'patrol.intermediate_state_proposal'

export interface IProposalIntermediateStatusEvent {
    destinationChainId: number
    nonce: string
    originChainId: number
}
