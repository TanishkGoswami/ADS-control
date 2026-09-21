import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import type { AuthPrincipal } from '@ads-control/shared';
import { CurrentActor } from '../../common/current-actor.decorator';
import { ActivityQueryDto, CancelFundingRequestDto, CreateFundingRequestDto, MapTopupDto, ObserveTopupDto, ReviewTopupDto } from './dto/meta-funding.dto';
import { MetaFundingService } from './meta-funding.service';

@Controller('api/v1/meta-funding')
export class MetaFundingController {
  constructor(private readonly service: MetaFundingService) {}
  @Get('accounts') accounts(@CurrentActor() actor: AuthPrincipal) { return this.service.listAccounts(actor); }
  @Get('eligibility') eligibility(@CurrentActor() actor: AuthPrincipal) { return this.service.listEligibility(actor); }
  @Get('requests') requests(@CurrentActor() actor: AuthPrincipal) { return this.service.listRequests(actor); }
  @Get('devices') devices(@CurrentActor() actor: AuthPrincipal) { return this.service.listDevices(actor); }
  @Post('requests') createRequest(@CurrentActor() actor: AuthPrincipal, @Body() input: CreateFundingRequestDto) { return this.service.createRequest(actor, input); }
  @Post('requests/:id/approve') approve(@CurrentActor() actor: AuthPrincipal, @Param('id') id: string) { return this.service.approveRequest(actor, id); }
  @Post('requests/:id/cancel') cancelRequest(@CurrentActor() actor: AuthPrincipal, @Param('id') id: string, @Body() input: CancelFundingRequestDto) { return this.service.cancelRequest(actor, id, input.reason); }
  @Post('sessions/map') map(@CurrentActor() actor: AuthPrincipal, @Body() input: MapTopupDto) { return this.service.mapTopup(actor, input); }
  @Post('sessions/:id/observe-success') observe(@CurrentActor() actor: AuthPrincipal, @Param('id') id: string, @Body() input: ObserveTopupDto) { return this.service.observeSuccess(actor, id, input); }
  @Post('sessions/:id/cancel') cancel(@CurrentActor() actor: AuthPrincipal, @Param('id') id: string) { return this.service.closeSession(actor, id); }
  @Post('sessions/:id/expire') expire(@CurrentActor() actor: AuthPrincipal, @Param('id') id: string) { return this.service.closeSession(actor, id, true); }
  @Patch('sessions/:id/review') review(@CurrentActor() actor: AuthPrincipal, @Param('id') id: string, @Body() input: ReviewTopupDto) { return this.service.review(actor, id, input); }
  @Get('sessions/:id') detail(@CurrentActor() actor: AuthPrincipal, @Param('id') id: string) { return this.service.getSession(actor, id); }
  @Get('activity') activity(@CurrentActor() actor: AuthPrincipal, @Query() query: ActivityQueryDto) { return this.service.getActivity(actor, query); }
  @Delete('devices/:id') revoke(@CurrentActor() actor: AuthPrincipal, @Param('id') id: string) { return this.service.revokeDevice(actor, id); }
}
