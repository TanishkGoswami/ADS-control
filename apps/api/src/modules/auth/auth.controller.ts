import { Body, Controller, Delete, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal, ExtensionHeartbeatInput, ExtensionPairingClaimInput } from '@ads-control/shared';
import { CurrentActor } from '../../common/current-actor.decorator';
import { Public } from '../../common/public.decorator';
import { AuthService, LoginDto } from './auth.service';

@ApiTags('Authentication')
@Controller('api/v1/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}
  @Public() @Post('login') @ApiOperation({ summary: 'Login with company email or username' })
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }
  @Get('me') getMe(@CurrentActor() actor: AuthPrincipal) { return this.authService.getCurrentUser(actor); }
  @Post('extension/pairing') createPairing(@CurrentActor() actor: AuthPrincipal) { return this.authService.createPairing(actor); }
  @Public() @Post('extension/claim') claimPairing(@Body() input: ExtensionPairingClaimInput) { return this.authService.claimPairing(input); }
  @Post('extension/heartbeat') heartbeat(@CurrentActor() actor: AuthPrincipal, @Body() input: ExtensionHeartbeatInput) { return this.authService.heartbeat(actor, input.extensionVersion); }
  @Delete('extension/devices/:deviceId') revokeDevice(@CurrentActor() actor: AuthPrincipal, @Param('deviceId') deviceId: string) { return this.authService.revokeDevice(actor, deviceId); }
}
