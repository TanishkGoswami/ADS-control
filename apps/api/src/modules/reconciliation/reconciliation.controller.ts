import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReconciliationService } from './reconciliation.service';

@ApiTags('Reconciliation & Truth Workbench')
@Controller('api/v1/reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get('snapshots')
  @ApiOperation({ summary: 'Get latest 3-way reconciliation snapshots' })
  async getSnapshots(@Query('organizationId') organizationId: string) {
    const orgId = organizationId || 'org-1';
    return this.reconciliationService.getLatestSnapshots(orgId);
  }

  @Post('run')
  @ApiOperation({ summary: 'Trigger fresh 3-way reconciliation comparison run' })
  async runReconciliation(@Query('organizationId') organizationId: string) {
    const orgId = organizationId || 'org-1';
    return this.reconciliationService.runReconciliation(orgId);
  }
}
