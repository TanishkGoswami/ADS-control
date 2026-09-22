import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuditModule } from './modules/audit/audit.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { AllocationsModule } from './modules/allocations/allocations.module';
import { ClientsModule } from './modules/clients/clients.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { MetaModule } from './modules/meta/meta.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UsersModule } from './modules/users/users.module';
import { MetaFundingModule } from './modules/meta-funding/meta-funding.module';
import { AppController } from './app.controller';
import { TelemetryService } from './common/telemetry.service';

import { CacheModule } from './common/cache/cache.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CacheModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    AuditModule,
    LedgerModule,
    AllocationsModule,
    ClientsModule,
    VendorsModule,
    MetaModule,
    MetaFundingModule,
    ReconciliationModule,
    AlertsModule,
    ReportsModule
  ],
  controllers: [AppController],
  providers: [TelemetryService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TelemetryService).forRoutes('*');
  }
}

