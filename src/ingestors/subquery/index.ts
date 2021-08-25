import { Module } from '@nestjs/common'
import { IngestorModule } from '..'
import { StorageModule } from '../../storage'
import { SubqueryProposalIngestor } from './ProposalIngestor'

@Module({
    imports: [IngestorModule, StorageModule],
    providers: [SubqueryProposalIngestor],
})
export class SubqueryIngestorModule {}
