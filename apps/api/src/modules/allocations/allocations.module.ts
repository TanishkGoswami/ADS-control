import { Module } from '@nestjs/common';
import { FundAllocationService } from './fund-allocation.service';
import { FundAllocationController } from './fund-allocation.controller';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [LedgerModule],
  controllers: [FundAllocationController],
  providers: [FundAllocationService],
  exports: [FundAllocationService]
})
export class AllocationsModule {}
