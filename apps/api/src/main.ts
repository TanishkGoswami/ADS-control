import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { resolveCorsOrigins } from './common/cors-policy';

// Global BigInt serialization for JSON responses
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: resolveCorsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Authorization, Accept, X-Requested-With, Origin',
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('Meta Ads Operations & Financial Control API')
    .setDescription('Centralized double-entry ledger, Meta sync, and financial reconciliation engine')
    .setVersion('1.0.0')
    .addTag('Finance & Ledger')
    .addTag('Fund Allocations & Lots')
    .addTag('Clients & Wallets')
    .addTag('Vendors & Credit')
    .addTag('Meta Assets')
    .addTag('Reconciliation & Truth Workbench')
    .addTag('Alerts & Incidents')
    .addTag('Reporting & Dashboards')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Ads Control API running on: http://localhost:${port}`);
  console.log(`📚 Swagger Docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
