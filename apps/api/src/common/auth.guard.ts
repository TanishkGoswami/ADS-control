import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthPrincipal } from '@ads-control/shared';
import { createHash } from 'node:crypto';
import { PrismaService } from './prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';

export const hashBearerToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector, @Inject(PrismaService) private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;

    const request = context.switchToHttp().getRequest<any>();
    const path = String(request.path || request.url || '');
    if (path.startsWith('/api/docs')) return true;

    const header = request.headers?.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) throw new UnauthorizedException('Valid bearer token required');
    const token = header.slice(7).trim();
    if (!token) throw new UnauthorizedException('Valid bearer token required');

    const tokenHash = hashBearerToken(token);
    const now = new Date();
    const webSession = await this.prisma.webSession.findUnique({
      where: { tokenHash },
      include: { user: true, organization: true }
    });

    let actor: AuthPrincipal | undefined;
    if (webSession && !webSession.revokedAt && webSession.expiresAt > now && webSession.user.status === 'ACTIVE' && webSession.organization.status === 'ACTIVE') {
      actor = { userId: webSession.userId, organizationId: webSession.organizationId, role: webSession.user.role, sessionKind: 'WEB' };
      await this.prisma.webSession.update({ where: { id: webSession.id }, data: { lastSeenAt: now } });
    } else {
      const device = await this.prisma.extensionDevice.findUnique({
        where: { tokenHash },
        include: { user: true, organization: true }
      });
      if (device && !device.revokedAt && device.expiresAt > now && device.user.status === 'ACTIVE' && device.organization.status === 'ACTIVE') {
        actor = { userId: device.userId, organizationId: device.organizationId, role: device.user.role, sessionKind: 'EXTENSION', deviceId: device.id };
      }
    }

    if (!actor) throw new UnauthorizedException('Session is expired, revoked, or inactive');
    request.actor = actor;
    return true;
  }
}
