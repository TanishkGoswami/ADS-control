import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [LedgerModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService]
})
export class ClientsModule {}
