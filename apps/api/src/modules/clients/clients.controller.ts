import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientInput, UpdateClientInput, RecordClientPaymentInput } from '@ads-control/shared';
import type { AuthPrincipal } from '@ads-control/shared';
import { CurrentActor } from '../../common/current-actor.decorator';

@ApiTags('Clients & Wallets')
@Controller('api/v1/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all clients with wallets' })
  async getClients(@CurrentActor() actor: AuthPrincipal) {
    return this.clientsService.getClients(actor.organizationId, actor.userId, actor.role);
  }

  @Post()
  @ApiOperation({ summary: 'Onboard a new client' })
  async createClient(@CurrentActor() actor: AuthPrincipal, @Body() body: { client: CreateClientInput }) {
    return this.clientsService.createClient(actor.organizationId, body.client);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client details' })
  async updateClient(
    @CurrentActor() actor: AuthPrincipal,
    @Param('id') id: string,
    @Body() body: { client: UpdateClientInput } | UpdateClientInput
  ) {
    const input = 'client' in body ? (body as any).client : body;
    return this.clientsService.updateClient(actor.organizationId, id, input);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete client and its associated records' })
  async deleteClient(
    @CurrentActor() actor: AuthPrincipal,
    @Param('id') id: string
  ) {
    return this.clientsService.deleteClient(actor.organizationId, id);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Record payment and credit client wallet' })
  async recordPayment(@CurrentActor() actor: AuthPrincipal, @Body() body: { payment: RecordClientPaymentInput }) {
    return this.clientsService.recordPayment(actor.organizationId, body.payment);
  }
}
