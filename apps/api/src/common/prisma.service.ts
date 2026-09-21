import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private cachedOrgId: string | null = null;

  async onModuleInit() {
    await this.$connect();
    // Pre-resolve organization
    await this.resolveOrgId();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Resolves the active organization ID.
   * If an ID is provided and exists, returns it; otherwise fetches or creates the primary active org.
   */
  async resolveOrgId(organizationId?: string): Promise<string> {
    if (organizationId && organizationId !== 'org-1' && organizationId.trim().length > 0) {
      // Validate provided org exists
      const existing = await this.organization.findUnique({
        where: { id: organizationId }
      });
      if (existing) {
        return existing.id;
      }
    }

    if (this.cachedOrgId) {
      return this.cachedOrgId;
    }

    // Find first active org
    const org = await this.organization.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' }
    });

    if (org) {
      this.cachedOrgId = org.id;
      return org.id;
    }

    // Auto-create default org if DB was empty
    const created = await this.organization.upsert({
      where: { slug: 'in-house-ads' },
      create: {
        name: 'In-House Ad Ops & Control',
        slug: 'in-house-ads',
        defaultCurrency: 'INR',
        timezone: 'Asia/Kolkata',
        status: 'ACTIVE'
      },
      update: {}
    });

    this.cachedOrgId = created.id;
    return created.id;
  }
}
