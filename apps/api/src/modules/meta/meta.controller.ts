import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MetaService } from './meta.service';

@ApiTags('Meta Assets')
@Controller('api/v1/meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Get('connections')
  @ApiOperation({ summary: 'Get Meta connections hierarchy' })
  async getConnections(
    @Query('organizationId') organizationId: string,
    @Query('userId') userId?: string
  ) {
    const orgId = organizationId || 'org-1';
    return this.metaService.getConnections(orgId, userId);
  }

  @Post('connections/:id/disconnect')
  @ApiOperation({ summary: 'Disconnect Meta connection and remove user account bindings' })
  async disconnectConnection(
    @Param('id') id: string,
    @Query('organizationId') organizationId?: string,
    @Query('userId') userId?: string
  ) {
    return this.metaService.disconnectConnection(id, organizationId, userId);
  }

  @Delete('connections/:id')
  @ApiOperation({ summary: 'Permanently remove Meta connection record' })
  async deleteConnection(
    @Param('id') id: string,
    @Query('organizationId') organizationId?: string
  ) {
    return this.metaService.deleteConnection(id, organizationId);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get all Ad Accounts (scoped by userId if Ads Manager, or global if Admin)' })
  async getAdAccounts(
    @Query('organizationId') organizationId: string,
    @Query('userId') userId?: string
  ) {
    const orgId = organizationId || 'org-1';
    return this.metaService.getAdAccounts(orgId, userId);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get detailed Ad Account with fund lot breakdown' })
  async getAdAccountDetails(@Param('id') id: string) {
    return this.metaService.getAdAccountDetails(id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Trigger Meta sync job for organization and user' })
  async syncMeta(
    @Query('organizationId') organizationId: string,
    @Query('userId') userId?: string
  ) {
    const orgId = organizationId || 'org-1';
    return this.metaService.syncMetaAssets(orgId, userId);
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'Meta Webhook Verification Endpoint' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string
  ) {
    const verifiedChallenge = this.metaService.verifyWebhook(mode, token, challenge);
    if (verifiedChallenge) {
      return verifiedChallenge;
    }
    return 'Invalid verification token';
  }

  @Get('oauth/url')
  @ApiOperation({ summary: 'Get Facebook Login for Business OAuth URL' })
  getOAuthUrl(
    @Query('redirectUri') redirectUri: string,
    @Query('state') state?: string
  ) {
    return this.metaService.getOAuthUrl(redirectUri || 'http://localhost:3000/auth/meta/callback', state);
  }

  @Post('oauth/exchange')
  @ApiOperation({ summary: 'Exchange Meta authorization code for 60-day token and sync' })
  async exchangeOAuthCode(
    @Query('code') code: string,
    @Query('redirectUri') redirectUri: string,
    @Query('organizationId') organizationId?: string,
    @Query('userId') userId?: string
  ) {
    return this.metaService.exchangeOAuthCode(code, redirectUri || 'http://localhost:3000/auth/meta/callback', organizationId, userId);
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Meta Webhook Ingestion Endpoint' })
  async receiveWebhook(@Query() query: any, @Param() params: any) {
    return this.metaService.processWebhookEvent({ query, params });
  }
}
