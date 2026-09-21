import { Module } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';
import { LedgerModule } from '../ledger/ledger.module';
import { MetaModule } from '../meta/meta.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [LedgerModule, MetaModule, AlertsModule],
  controllers: [ReconciliationController],
  providers: [ReconciliationService],
  exports: [ReconciliationService]
})
export class ReconciliationModule {}
