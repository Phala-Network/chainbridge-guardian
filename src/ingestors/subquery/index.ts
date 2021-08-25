import { Module } from '@nestjs/common'
import { IngestorModule } from '..'
import { TaskQueueModule } from '../../queues'
import { StorageModule } from '../../storage'
import { SubqueryEventListener } from './listeners'
import { SubqueryProposalIngestor } from './ProposalIngestor'

@Module({
    imports: [IngestorModule, StorageModule, TaskQueueModule],
    providers: [SubqueryEventListener, SubqueryProposalIngestor],
})
export class SubqueryIngestorModule {}
