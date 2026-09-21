import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache/cache.service';

export interface SyncJob {
  id: string;
  organizationId?: string;
  userId?: string;
  targetConnectionId?: string;
  enqueuedAt: Date;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  error?: string;
}

@Injectable()
export class MetaSyncWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetaSyncWorker.name);
  private jobQueue: SyncJob[] = [];
  private isProcessing = false;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService
  ) {}

  onModuleInit() {
    this.logger.log('🚀 Initializing Meta Background Sync Worker Queue');
    // Periodic background sync every 5 minutes (300,000 ms)
    this.syncTimer = setInterval(() => {
      this.enqueueAutoSync();
    }, 300000);
  }

  onModuleDestroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }

  private async enqueueAutoSync() {
    const activeConnections = await this.prisma.metaConnection.findMany({
      where: {
        connectionStatus: 'CONNECTED',
        tokenSecretReference: { not: null }
      },
      select: { id: true, organizationId: true, userId: true }
    });

    for (const conn of activeConnections) {
      this.enqueueJob({
        organizationId: conn.organizationId,
        userId: conn.userId || undefined,
        targetConnectionId: conn.id
      });
    }
  }

  enqueueJob(params: { organizationId?: string; userId?: string; targetConnectionId?: string }): SyncJob {
    const job: SyncJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizationId: params.organizationId,
      userId: params.userId,
      targetConnectionId: params.targetConnectionId,
      enqueuedAt: new Date(),
      status: 'PENDING'
    };

    this.jobQueue.push(job);
    this.logger.log(`Enqueued background Meta sync job: ${job.id} (target: ${job.targetConnectionId || 'ALL'})`);
    
    // Trigger queue processing asynchronously
    void this.processQueue();
    return job;
  }

  private async processQueue() {
    if (this.isProcessing || this.jobQueue.length === 0) return;

    this.isProcessing = true;
    const job = this.jobQueue.shift();

    if (!job) {
      this.isProcessing = false;
      return;
    }

    job.status = 'RUNNING';

    try {
      // Invalidate relevant cache so next UI read gets fresh data
      await this.cache.delPattern('meta:*');
      await this.cache.delPattern('reports:*');

      job.status = 'COMPLETED';
      this.logger.log(`Background Meta sync job ${job.id} completed successfully.`);
    } catch (err: any) {
      job.status = 'FAILED';
      job.error = err?.message || String(err);
      this.logger.error(`Background Meta sync job ${job.id} failed: ${job.error}`);
    } finally {
      this.isProcessing = false;
      // Continue draining queue
      if (this.jobQueue.length > 0) {
        void this.processQueue();
      }
    }
  }
}
