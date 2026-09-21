import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LedgerService, PostTransactionDto } from './ledger.service';

@ApiTags('Finance & Ledger')
@Controller('api/v1/finance/ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Get chart of financial accounts' })
  async getAccounts(@Query('organizationId') organizationId?: string) {
    return this.ledgerService.getAccounts(organizationId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get posted double-entry journal transactions' })
  async getTransactions(@Query('organizationId') organizationId?: string) {
    return this.ledgerService.getTransactions(organizationId);
  }

  @Post('transaction')
  @ApiOperation({ summary: 'Post an immutable double-entry journal transaction' })
  async postTransaction(@Body() dto: PostTransactionDto) {
    return this.ledgerService.postTransaction(dto);
  }

  @Post('transaction/:id/reverse')
  @ApiOperation({ summary: 'Reverse a posted transaction with audit reason' })
  async reverseTransaction(
    @Param('id') id: string,
    @Body() body: { organizationId?: string; reason: string }
  ) {
    return this.ledgerService.reverseTransaction(body.organizationId, id, body.reason);
  }
}
