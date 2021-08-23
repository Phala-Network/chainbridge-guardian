import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GlobalConfigModule } from '../config'
import { IngestorModule } from '../ingestors'
import { SubgraphIngestorModule } from '../ingestors/subgraph'
import { MetricsModule } from '../metrics'
import { TaskQueueModule } from '../queues'
import { StorageModule } from '../storage'
import { BridgeTransfer } from '../storage/entity'
import { MetricsController } from './controllers/metrics.controller'

@Module({
    controllers: [MetricsController],
    imports: [
        EventEmitterModule.forRoot({ wildcard: false }),
        GlobalConfigModule,
        IngestorModule,
        MetricsModule,
        StorageModule,
        SubgraphIngestorModule,
        TaskQueueModule,
        TypeOrmModule.forRoot({ ...require('../../ormconfig.json'), entities: [BridgeTransfer] }),
    ],
})
export class AppModule {}
