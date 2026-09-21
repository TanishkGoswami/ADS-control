import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FundAllocationService } from './fund-allocation.service';
import { LeftoverResolutionAction, toPaise } from '@ads-control/shared';
import type { AuthPrincipal } from '@ads-control/shared';
import { CurrentActor } from '../../common/current-actor.decorator';

@ApiTags('Fund Allocations & Lots')
@Controller('api/v1/allocations')
export class FundAllocationController {
  constructor(private readonly allocationService: FundAllocationService) {}

  @Post('allocate-job')
  @ApiOperation({ summary: 'Allocate funds from Client Wallet to an Ad Account' })
  async allocateJob(
    @CurrentActor() actor: AuthPrincipal,
    @Body()
    body: {
      clientId: string;
      clientJobId: string;
      adAccountId: string;
      amountRupees: number;
    }
  ) {
    const amountMinor = toPaise(body.amountRupees);
    return this.allocationService.allocateClientFundToJob(
      actor.organizationId,
      body.clientId,
      body.clientJobId,
      body.adAccountId,
      amountMinor
    );
  }

  @Post('allocate-job-batch')
  @ApiOperation({ summary: 'Allocate one client budget across multiple ad accounts atomically' })
  async allocateJobBatch(
    @CurrentActor() actor: AuthPrincipal,
    @Body() body: {
      clientId: string;
      jobCode: string;
      jobTitle?: string;
      allocations: Array<{ adAccountId: string; amountRupees: number }>;
    }
  ) {
    return this.allocationService.allocateClientFundBatch(
      actor.organizationId,
      body.clientId,
      body.jobCode,
      body.jobTitle || body.jobCode,
      body.allocations.map((item) => ({
        adAccountId: item.adAccountId,
        amountMinor: toPaise(item.amountRupees)
      }))
    );
  }

  @Post('leftovers/:id/resolve')
  @ApiOperation({ summary: 'Resolve unused campaign leftover funds' })
  async resolveLeftover(
    @CurrentActor() actor: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: { action: LeftoverResolutionAction; targetJobId?: string }
  ) {
    return this.allocationService.resolveLeftoverFund(
      actor.organizationId,
      id,
      body.action,
      body.targetJobId
    );
  }

  @Post('accounts/:id/handle-restriction')
  @ApiOperation({ summary: 'Trigger lock state for restricted account' })
  async handleRestriction(
    @CurrentActor() actor: AuthPrincipal,
    @Param('id') id: string,
    @Body() _body: Record<string, never>
  ) {
    return this.allocationService.handleAdAccountRestriction(actor.organizationId, id);
  }
}
