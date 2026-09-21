import { Module } from '@nestjs/common';
import { MetaService } from './meta.service';
import { MetaController } from './meta.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { AlertsModule } from '../alerts/alerts.module';

import { MetaSyncWorker } from './meta-sync.worker';

@Module({
  imports: [LedgerModule, AlertsModule],
  controllers: [MetaController],
  providers: [MetaService, MetaSyncWorker],
  exports: [MetaService, MetaSyncWorker]
})
export class MetaModule {}
