import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GlobalConfigModule } from '../config'
import { ExporterModule } from '../exporters'
import { IngestorModule } from '../ingestors'
import { PolkadotIngestorModule } from '../ingestors/polkadot'
import { SubgraphIngestorModule } from '../ingestors/subgraph'
import { SubqueryIngestorModule } from '../ingestors/subquery'
import { MetricsModule } from '../metrics'
import { PatrolModule } from '../patrollers'
import { TaskQueueModule } from '../queues'
import { StorageModule } from '../storage'
import { BridgeTransfer } from '../storage/entity'
import { MetricsController } from './controllers/metrics.controller'

@Module({
    controllers: [MetricsController],
    imports: [
        EventEmitterModule.forRoot(),
        ExporterModule,
        GlobalConfigModule,
        IngestorModule,
        MetricsModule,
        PatrolModule,
        PolkadotIngestorModule,
        StorageModule,
        SubgraphIngestorModule,
        SubqueryIngestorModule,
        TaskQueueModule,
        TypeOrmModule.forRoot({ ...require('../../ormconfig.json'), entities: [BridgeTransfer] }),
    ],
})
export class AppModule {}
