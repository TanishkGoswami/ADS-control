import { Module } from '@nestjs/common';
import { MetaModule } from '../meta/meta.module';
import { ReconciliationModule } from '../reconciliation/reconciliation.module';
import { MetaFundingController } from './meta-funding.controller';
import { MetaFundingService } from './meta-funding.service';

@Module({ imports: [MetaModule, ReconciliationModule], controllers: [MetaFundingController], providers: [MetaFundingService], exports: [MetaFundingService] })
export class MetaFundingModule {}
