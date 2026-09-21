import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MetaFundingService } from '../src/modules/meta-funding/meta-funding.service';

const testUrl = process.env.TEST_DATABASE_URL;
const suite = testUrl ? describe : describe.skip;

suite('Meta Funding PostgreSQL integration', () => {
  const prisma = new PrismaClient({ datasourceUrl: testUrl });
  const marker = randomUUID().slice(0, 8);
  const ids: Record<string, string> = {};
  const meta: any = { refreshAdAccount: async () => ({ metaAdAccountId: '123456789' }) };
  const reconciliation: any = { reconcileAdAccount: async () => ({ id: 'snapshot' }) };
  const service = new MetaFundingService(prisma as any, meta, reconciliation);

  before(async () => {
    const org = await prisma.organization.create({ data: { name: `Topup Test ${marker}`, slug: `topup-${marker}` } });
    const foreign = await prisma.organization.create({ data: { name: `Foreign ${marker}`, slug: `foreign-${marker}` } });
    const user = await prisma.userProfile.create({ data: { organizationId: org.id, authUserId: `auth-${marker}`, name: 'Operator', email: `${marker}@test.local`, role: 'ADS_MANAGER' } });
    const account = await prisma.adAccount.create({ data: { organizationId: org.id, metaAdAccountId: '123456789', name: 'Pilot Account', currencyCode: 'INR' } });
    await prisma.userAdAccountAccess.create({ data: { organizationId: org.id, userId: user.id, adAccountId: account.id } });
    const lot = await prisma.fundLot.create({ data: { organizationId: org.id, lotCode: `LOT-${marker}`, ownerType: 'AGENCY', ownerId: org.id, initialAmountMinor: 100000n, currentAmountMinor: 100000n, currencyCode: 'INR', status: 'AVAILABLE' } });
    Object.assign(ids, { org: org.id, foreign: foreign.id, user: user.id, account: account.id, lot: lot.id });
  });

  after(async () => {
    if (ids.org) await prisma.organization.delete({ where: { id: ids.org } });
    if (ids.foreign) await prisma.organization.delete({ where: { id: ids.foreign } });
    await prisma.$disconnect();
  });

  const actor = () => ({ userId: ids.user, organizationId: ids.org, role: 'ADS_MANAGER', sessionKind: 'EXTENSION' as const, deviceId: undefined });
  const mapping = (key: string, amount: string) => ({ idempotencyKey: key, selectedAdAccountId: ids.account, selectedAmountMinor: amount, currencyCode: 'INR' as const, fundingSourceType: 'FUND_LOT' as const, fundLotId: ids.lot, detectedMetaAccountId: '123456789', visibleMetaAccountId: '123456789', detectorVersion: '1.0.0' });

  it('returns exact idempotent replay and rejects a changed fingerprint', async () => {
    const first = await service.mapTopup(actor(), mapping(`replay-${marker}`, '10000'));
    const replay = await service.mapTopup(actor(), mapping(`replay-${marker}`, '10000'));
    assert.equal(first.id, replay.id);
    await assert.rejects(() => service.mapTopup(actor(), mapping(`replay-${marker}`, '10001')), ConflictException);
  });

  it('denies cross-tenant and missing account permission', async () => {
    await assert.rejects(() => service.mapTopup({ ...actor(), organizationId: ids.foreign }, mapping(`tenant-${marker}`, '1000')), NotFoundException);
    await assert.rejects(() => service.mapTopup({ ...actor(), userId: randomUUID() }, mapping(`access-${marker}`, '1000')), ForbiddenException);
  });

  it('prevents concurrent reservations from over-allocating a Fund Lot', async () => {
    const results = await Promise.allSettled([
      service.mapTopup(actor(), mapping(`race-a-${marker}`, '60000')),
      service.mapTopup(actor(), mapping(`race-b-${marker}`, '60000'))
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
    const active = await prisma.topupReservation.aggregate({ where: { fundLotId: ids.lot, status: 'ACTIVE' }, _sum: { amountMinor: true } });
    assert.ok((active._sum.amountMinor ?? 0n) <= 100000n);
  });
});

