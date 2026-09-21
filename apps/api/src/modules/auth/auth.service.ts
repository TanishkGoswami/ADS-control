import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthPrincipal, ExtensionPairingClaimInput } from '@ads-control/shared';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service';
import { hashBearerToken } from '../../common/auth.guard';
import { RealtimeService } from '../realtime/realtime.service';

export interface LoginDto { emailOrUsername: string; password?: string; companySlug?: string; }
const WEB_SESSION_MS = 12 * 60 * 60 * 1000;
const DEVICE_SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const PAIRING_MS = 5 * 60 * 1000;
const opaqueToken = () => randomBytes(32).toString('base64url');

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService
  ) {}

  async login(dto: LoginDto) {
    const input = (dto.emailOrUsername || '').trim();
    const password = (dto.password || '').trim();
    if (!input) throw new UnauthorizedException('Company email or username is required');
    const orgId = await this.prisma.resolveOrgId();
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org || org.status !== 'ACTIVE') throw new UnauthorizedException('Organization is inactive');
    let user = await this.prisma.userProfile.findFirst({ where: { organizationId: orgId, OR: [{ email: { equals: input, mode: 'insensitive' } }, { name: { equals: input, mode: 'insensitive' } }] } });
    
    if (!user) {
      // Check if this is the very first user in the system (bootstrap admin)
      const totalUsers = await this.prisma.userProfile.count({ where: { organizationId: orgId } });
      if (totalUsers === 0) {
        const email = input.includes('@') ? input : `${input.toLowerCase().replace(/\s+/g, '')}@${org.slug}.com`;
        user = await this.prisma.userProfile.create({
          data: {
            organizationId: orgId,
            authUserId: `user-${randomBytes(12).toString('hex')}`,
            name: input.includes('@') ? input.split('@')[0] : input,
            email: email.toLowerCase(),
            passwordHash: password ? await bcrypt.hash(password, 10) : undefined,
            role: 'ADMIN',
            status: 'ACTIVE'
          }
        });
      } else {
        throw new UnauthorizedException('User account not found. Please check your username/email or contact the administrator.');
      }
    }

    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Your account is inactive or suspended. Please contact the administrator.');
    if (user.passwordHash && (!password || !(await bcrypt.compare(password, user.passwordHash)))) throw new UnauthorizedException('Invalid email or password');
    if (!user.passwordHash && password) user = await this.prisma.userProfile.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });

    const token = opaqueToken();
    const expiresAt = new Date(Date.now() + WEB_SESSION_MS);
    await this.prisma.$transaction([
      this.prisma.userProfile.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
      this.prisma.webSession.create({ data: { organizationId: orgId, userId: user.id, tokenHash: hashBearerToken(token), expiresAt } }),
      this.prisma.auditLog.create({ data: { organizationId: orgId, actorUserId: user.id, action: 'USER_LOGIN', entityType: 'WEB_SESSION', entityId: user.id, newState: { expiresAt } } })
    ]);

    this.realtime.broadcast('USERS_UPDATED', { organizationId: orgId, userId: user.id });

    return { token, expiresAt, user: this.toUser(user), organization: { id: org.id, name: org.name, slug: org.slug, defaultCurrency: org.defaultCurrency } };
  }

  async getCurrentUser(actor: AuthPrincipal) {
    const user = await this.prisma.userProfile.findFirst({ where: { id: actor.userId, organizationId: actor.organizationId, status: 'ACTIVE' } });
    if (!user) throw new UnauthorizedException('User session not found');
    return this.toUser(user);
  }

  async createPairing(actor: AuthPrincipal) {
    if (actor.sessionKind !== 'WEB') throw new UnauthorizedException('Web session required');
    const code = randomBytes(9).toString('base64url');
    const expiresAt = new Date(Date.now() + PAIRING_MS);
    await this.prisma.extensionPairingChallenge.create({ data: { organizationId: actor.organizationId, userId: actor.userId, codeHash: hashBearerToken(code), expiresAt } });
    return { code, expiresAt };
  }

  async claimPairing(input: ExtensionPairingClaimInput) {
    const now = new Date();
    const codeHash = hashBearerToken(input.code);
    return this.prisma.$transaction(async (tx) => {
      const challenge = await tx.extensionPairingChallenge.findUnique({ where: { codeHash }, include: { user: true, organization: true } });
      if (!challenge || challenge.expiresAt <= now) throw new UnauthorizedException('Pairing code is invalid or expired');
      if (challenge.consumedAt) throw new ConflictException('Pairing code has already been used');
      if (challenge.user.status !== 'ACTIVE' || challenge.organization.status !== 'ACTIVE') throw new UnauthorizedException('Pairing owner is inactive');
      const consumed = await tx.extensionPairingChallenge.updateMany({ where: { id: challenge.id, consumedAt: null }, data: { consumedAt: now } });
      if (consumed.count !== 1) throw new ConflictException('Pairing code has already been used');
      const token = opaqueToken();
      const expiresAt = new Date(Date.now() + DEVICE_SESSION_MS);
      const device = await tx.extensionDevice.create({ data: { organizationId: challenge.organizationId, userId: challenge.userId, tokenHash: hashBearerToken(token), name: input.deviceName, version: input.extensionVersion, expiresAt, lastSeenAt: now } });
      return { token, expiresAt, deviceId: device.id, organizationId: challenge.organizationId };
    });
  }

  async heartbeat(actor: AuthPrincipal, extensionVersion: string) {
    if (actor.sessionKind !== 'EXTENSION' || !actor.deviceId) throw new UnauthorizedException('Extension session required');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEVICE_SESSION_MS);
    const device = await this.prisma.extensionDevice.update({ where: { id: actor.deviceId }, data: { lastSeenAt: now, expiresAt, version: extensionVersion } });
    return { deviceId: device.id, status: 'ACTIVE', lastSeenAt: device.lastSeenAt, expiresAt: device.expiresAt };
  }

  async revokeDevice(actor: AuthPrincipal, deviceId: string) {
    const result = await this.prisma.extensionDevice.updateMany({ where: { id: deviceId, organizationId: actor.organizationId, userId: actor.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    if (result.count !== 1) throw new UnauthorizedException('Device not found or already revoked');
    return { revoked: true };
  }

  private toUser(user: { id: string; name: string; email: string; role: string; status: string }) { return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }; }
}
