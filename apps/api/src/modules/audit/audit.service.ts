import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(organizationId?: string, limit = 100) {
    const orgId = organizationId || (await this.prisma.resolveOrgId());
    return this.prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}
