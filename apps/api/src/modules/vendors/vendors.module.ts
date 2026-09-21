import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [LedgerModule],
  controllers: [VendorsController],
  providers: [VendorsService],
  exports: [VendorsService]
})
export class VendorsModule {}
