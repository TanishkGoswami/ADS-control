import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, AssignAccountsDto } from './dto/create-user.dto';

@ApiTags('User & Team Management')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users in the organization with their assigned accounts' })
  async listUsers(@Query('organizationId') organizationId?: string) {
    return this.usersService.listUsers(organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new Ads Manager or Admin with email & password' })
  async createUser(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details with assigned accounts and connections' })
  async getUserDetails(@Param('id') id: string) {
    return this.usersService.getUserDetails(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: Toggle user status (ACTIVE / SUSPENDED)' })
  async updateUserStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.usersService.updateUserStatus(id, status);
  }

  @Post(':id/assign-accounts')
  @ApiOperation({ summary: 'Admin: Assign ad accounts to an Ads Manager' })
  async assignAdAccounts(@Param('id') id: string, @Body() dto: AssignAccountsDto) {
    return this.usersService.assignAdAccounts(id, dto);
  }

  @Delete(':id/accounts/:adAccountId')
  @ApiOperation({ summary: 'Admin: Revoke an ad account access from an Ads Manager' })
  async removeAdAccountAccess(
    @Param('id') id: string,
    @Param('adAccountId') adAccountId: string
  ) {
    return this.usersService.removeAdAccountAccess(id, adAccountId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete user and clean up associations' })
  async deleteUser(
    @Param('id') id: string,
    @Query('organizationId') organizationId?: string
  ) {
    return this.usersService.deleteUser(id, organizationId);
  }
}

