import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorInput, RecordVendorFundingBatchInput, RecordVendorRepaymentInput } from '@ads-control/shared';
import type { AuthPrincipal } from '@ads-control/shared';
import { CurrentActor } from '../../common/current-actor.decorator';

@ApiTags('Vendors & Credit')
@Controller('api/v1/vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all vendors with funding batches' })
  async getVendors(@CurrentActor() actor: AuthPrincipal) {
    return this.vendorsService.getVendors(actor.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new vendor profile' })
  async createVendor(@CurrentActor() actor: AuthPrincipal, @Body() input: CreateVendorInput) {
    return this.vendorsService.createVendor(actor.organizationId, input);
  }

  @Post('batches')
  @ApiOperation({ summary: 'Record vendor funding batch' })
  async recordBatch(@CurrentActor() actor: AuthPrincipal, @Body() input: RecordVendorFundingBatchInput) {
    return this.vendorsService.recordFundingBatch(actor.organizationId, input);
  }

  @Post('repayments')
  @ApiOperation({ summary: 'Record repayment to vendor' })
  async recordRepayment(@CurrentActor() actor: AuthPrincipal, @Body() input: RecordVendorRepaymentInput) {
    return this.vendorsService.recordRepayment(actor.organizationId, input);
  }
}
