import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../src/modules/auth/auth.service';
import { hashBearerToken } from '../src/common/auth.guard';
import { AuthGuard } from '../src/common/auth.guard';
import { resolveCorsOrigins } from '../src/common/cors-policy';
import { Test } from '@nestjs/testing';
import { AuthModule } from '../src/modules/auth/auth.module';
import { PrismaService } from '../src/common/prisma.service';
import { PrismaModule } from '../src/common/prisma.module';

const org = { id: 'org-a', name: 'Acme', slug: 'acme', defaultCurrency: 'INR', status: 'ACTIVE' };
const user = { id: 'user-a', organizationId: org.id, authUserId: 'auth-a', name: 'Admin', email: 'admin@acme.test', passwordHash: null, role: 'ADMIN', status: 'ACTIVE' };

function createPrismaMock() {
  const state: any = { webSessions: [], challenges: [], devices: [] };
  const prisma: any = {
    resolveOrgId: async () => org.id,
    organization: { findUnique: async () => org },
    userProfile: {
      findFirst: async ({ where }: any) => where.id && where.id !== user.id ? null : user,
      create: async () => user,
      update: async () => user
    },
    webSession: {
      create: async ({ data }: any) => { state.webSessions.push(data); return { id: 'web-1', ...data }; },
      findUnique: async ({ where }: any) => { const item = state.webSessions.find((candidate: any) => candidate.tokenHash === where.tokenHash); return item ? { id: 'web-1', ...item, user: item.user || user, organization: item.organization || org } : null; },
      update: async () => ({})
    },
    extensionPairingChallenge: {
      create: async ({ data }: any) => { const value = { id: 'challenge-1', consumedAt: null, ...data, user, organization: org }; state.challenges.push(value); return value; },
      findUnique: async ({ where }: any) => state.challenges.find((item: any) => item.codeHash === where.codeHash) || null,
      updateMany: async ({ where, data }: any) => { const value = state.challenges.find((item: any) => item.id === where.id && item.consumedAt === null); if (!value) return { count: 0 }; Object.assign(value, data); return { count: 1 }; }
    },
    extensionDevice: {
      create: async ({ data }: any) => { const value = { id: `device-${state.devices.length + 1}`, revokedAt: null, ...data, user, organization: org }; state.devices.push(value); return value; },
      update: async ({ where, data }: any) => { const value = state.devices.find((item: any) => item.id === where.id); Object.assign(value, data); return value; },
      updateMany: async ({ where, data }: any) => { const value = state.devices.find((item: any) => item.id === where.id && item.organizationId === where.organizationId && item.userId === where.userId && item.revokedAt === null); if (!value) return { count: 0 }; Object.assign(value, data); return { count: 1 }; }
    },
    auditLog: { create: async () => ({}) }
  };
  prisma.$transaction = async (input: any) => typeof input === 'function' ? input(prisma) : Promise.all(input);
  prisma.extensionDevice.findUnique = async ({ where }: any) => { const item = state.devices.find((candidate: any) => candidate.tokenHash === where.tokenHash); return item ? { ...item, user, organization: org } : null; };
  return { prisma, state };
}

describe('Auth and extension pairing tracer', () => {
  it('proves login, one-time claim, heartbeat, replay rejection and revocation through real HTTP routes', async () => {
    const { prisma } = createPrismaMock();
    const moduleRef = await Test.createTestingModule({ imports: [PrismaModule, AuthModule] }).overrideProvider(PrismaService).useValue(prisma).compile();
    const app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address();
    const base = `http://127.0.0.1:${address.port}/api/v1/auth`;
    try {
      const login = await fetch(`${base}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ emailOrUsername: user.email }) });
      assert.equal(login.status, 201);
      const loginBody: any = await login.json();
      const pairing = await fetch(`${base}/extension/pairing`, { method: 'POST', headers: { authorization: `Bearer ${loginBody.token}` } });
      assert.equal(pairing.status, 201);
      const pairingBody: any = await pairing.json();
      const claimInput = { code: pairingBody.code, deviceName: 'Pilot PC', extensionVersion: '1.0.0' };
      const claim = await fetch(`${base}/extension/claim`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(claimInput) });
      assert.equal(claim.status, 201);
      const claimBody: any = await claim.json();
      const heartbeat = await fetch(`${base}/extension/heartbeat`, { method: 'POST', headers: { authorization: `Bearer ${claimBody.token}`, 'content-type': 'application/json' }, body: JSON.stringify({ extensionVersion: '1.0.0' }) });
      assert.equal(heartbeat.status, 201);
      const replay = await fetch(`${base}/extension/claim`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(claimInput) });
      assert.equal(replay.status, 409);
      const revoke = await fetch(`${base}/extension/devices/${claimBody.deviceId}`, { method: 'DELETE', headers: { authorization: `Bearer ${loginBody.token}` } });
      assert.equal(revoke.status, 200);
      const rejectedHeartbeat = await fetch(`${base}/extension/heartbeat`, { method: 'POST', headers: { authorization: `Bearer ${claimBody.token}`, 'content-type': 'application/json' }, body: JSON.stringify({ extensionVersion: '1.0.0' }) });
      assert.equal(rejectedHeartbeat.status, 401);
    } finally {
      await app.close();
    }
  });

  it('creates only hashed opaque credentials and completes login, claim, heartbeat and revoke', async () => {
    const { prisma, state } = createPrismaMock();
    const service = new AuthService(prisma);
    const login = await service.login({ emailOrUsername: user.email });
    assert.equal(login.token.startsWith('mb_token_'), false);
    assert.equal(state.webSessions[0].tokenHash, hashBearerToken(login.token));
    assert.equal(JSON.stringify(state.webSessions).includes(login.token), false);

    const actor = { userId: user.id, organizationId: org.id, role: user.role, sessionKind: 'WEB' as const };
    const pairing = await service.createPairing(actor);
    assert.equal(JSON.stringify(state.challenges).includes(pairing.code), false);
    const claim = await service.claimPairing({ code: pairing.code, deviceName: 'Pilot PC', extensionVersion: '1.0.0' });
    assert.equal(state.devices[0].tokenHash, hashBearerToken(claim.token));
    assert.equal(JSON.stringify(state.devices).includes(claim.token), false);

    const extensionActor = { ...actor, sessionKind: 'EXTENSION' as const, deviceId: claim.deviceId };
    const heartbeat = await service.heartbeat(extensionActor, '1.0.0');
    assert.equal(heartbeat.status, 'ACTIVE');
    await assert.rejects(() => service.claimPairing({ code: pairing.code, deviceName: 'Replay', extensionVersion: '1.0.0' }), ConflictException);
    assert.deepEqual(await service.revokeDevice(actor, claim.deviceId), { revoked: true });
  });

  it('rejects expired challenges and cross-organization revocation', async () => {
    const { prisma, state } = createPrismaMock();
    const service = new AuthService(prisma);
    state.challenges.push({ id: 'expired', codeHash: hashBearerToken('expired-code'), expiresAt: new Date(0), consumedAt: null, user, organization: org });
    await assert.rejects(() => service.claimPairing({ code: 'expired-code', deviceName: 'PC', extensionVersion: '1.0.0' }), UnauthorizedException);
    state.devices.push({ id: 'foreign', organizationId: 'org-b', userId: user.id, revokedAt: null });
    await assert.rejects(() => service.revokeDevice({ userId: user.id, organizationId: org.id, role: user.role, sessionKind: 'WEB' }, 'foreign'), UnauthorizedException);
  });

  it('defaults protected routes to deny and rejects expired, revoked, or inactive principals', async () => {
    const request: any = { path: '/api/v1/meta/accounts', headers: {} };
    const context: any = { getHandler: () => ({}), getClass: () => ({}), switchToHttp: () => ({ getRequest: () => request }) };
    const reflector: any = { getAllAndOverride: () => false };
    const { prisma, state } = createPrismaMock();
    prisma.extensionDevice.findUnique = async () => null;
    const guard = new AuthGuard(reflector, prisma);
    await assert.rejects(() => guard.canActivate(context), UnauthorizedException);

    const token = 'expired-web-token';
    request.headers.authorization = `Bearer ${token}`;
    state.webSessions.push({ id: 'web-expired', tokenHash: hashBearerToken(token), userId: user.id, organizationId: org.id, expiresAt: new Date(0), revokedAt: null, user, organization: org });
    await assert.rejects(() => guard.canActivate(context), UnauthorizedException);

    state.webSessions[0].expiresAt = new Date(Date.now() + 60_000);
    state.webSessions[0].revokedAt = new Date();
    await assert.rejects(() => guard.canActivate(context), UnauthorizedException);

    state.webSessions[0].revokedAt = null;
    state.webSessions[0].user = { ...user, status: 'SUSPENDED' };
    await assert.rejects(() => guard.canActivate(context), UnauthorizedException);
  });

  it('uses exact configured CORS origins and rejects wildcard or missing production configuration', () => {
    assert.deepEqual(resolveCorsOrigins({ ADS_CONTROL_WEB_ORIGINS: 'https://ads.example.com', ADS_CONTROL_EXTENSION_ORIGINS: 'chrome-extension://abc' } as NodeJS.ProcessEnv), ['https://ads.example.com', 'chrome-extension://abc']);
    assert.throws(() => resolveCorsOrigins({ ADS_CONTROL_WEB_ORIGINS: '*' } as NodeJS.ProcessEnv), /Wildcard/);
    assert.throws(() => resolveCorsOrigins({ NODE_ENV: 'production' } as NodeJS.ProcessEnv), /required/);
  });
});
