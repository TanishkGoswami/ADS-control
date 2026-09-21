import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('Audit Logs')
@Controller('api/v1/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get immutable audit logs' })
  async getLogs(@Query('organizationId') organizationId?: string, @Query('limit') limit?: number) {
    return this.auditService.getLogs(organizationId, limit ? Number(limit) : 100);
  }
}
