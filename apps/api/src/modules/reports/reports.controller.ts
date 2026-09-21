import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reporting & Dashboards')
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard-metrics')
  @ApiOperation({ summary: 'Get unified executive dashboard KPI metrics (scoped or global)' })
  async getDashboardMetrics(
    @Query('organizationId') organizationId: string,
    @Query('userId') userId?: string
  ) {
    const orgId = organizationId || 'org-1';
    return this.reportsService.getDashboardMetrics(orgId, userId);
  }
}
