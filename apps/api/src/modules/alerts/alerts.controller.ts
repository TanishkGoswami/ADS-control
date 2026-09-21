import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';

@ApiTags('Alerts & Incidents')
@Controller('api/v1/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts with optional severity & status filtering' })
  async getAlerts(
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string
  ) {
    return this.alertsService.getAlerts(organizationId, status, severity);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Trigger on-demand automated alert health scan & evaluation' })
  async evaluateAlerts(@Query('organizationId') organizationId?: string) {
    return this.alertsService.evaluateAlerts(organizationId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update alert status (OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    return this.alertsService.updateAlertStatus(id, status);
  }

  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  async acknowledgeAlert(@Param('id') id: string) {
    return this.alertsService.updateAlertStatus(id, 'ACKNOWLEDGED');
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Mark an alert as resolved' })
  async resolveAlert(@Param('id') id: string) {
    return this.alertsService.updateAlertStatus(id, 'RESOLVED');
  }

  @Post('clear-resolved')
  @ApiOperation({ summary: 'Bulk remove all resolved & dismissed alerts' })
  async clearResolvedAlerts(@Query('organizationId') organizationId?: string) {
    return this.alertsService.clearResolvedAlerts(organizationId);
  }
}
