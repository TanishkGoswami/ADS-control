import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { MetaFundingService } from '../src/modules/meta-funding/meta-funding.service';

const actor = { userId: 'user-a', organizationId: 'org-a', role: 'ADS_MANAGER', sessionKind: 'EXTENSION' as const, deviceId: 'device-a' };

function observationHarness(overrides: { mismatch?: boolean; refreshFails?: boolean } = {}) {
  const events: any[] = [];
  const reservation = { status: 'ACTIVE' };
  const session: any = {
    id: 'session-a', organizationId: actor.organizationId, actorUserId: actor.userId,
    selectedAdAccountId: 'account-a', selectedAmountMinor: 10000n, operationalState: 'MAPPED',
    financialReviewState: 'UNVERIFIED', selectedAdAccount: { metaAdAccountId: '123456789' }, reservation
  };
  const tx: any = {
    metaTopupSession: {
      findFirst: async ({ where }: any) => where.id === session.id && where.organizationId === session.organizationId ? session : null,
      update: async ({ data }: any) => Object.assign(session, data)
    },
    metaTopupEvent: {
      findUnique: async ({ where }: any) => events.find((event) => event.idempotencyKey === where.organizationId_idempotencyKey.idempotencyKey) || null,
      aggregate: async () => ({ _max: { sequence: events.length || null } }),
      create: async ({ data }: any) => { events.push(data); return data; }
    },
    topupReservation: { update: async ({ data }: any) => Object.assign(reservation, data) },
    auditLog: { create: async () => ({}) }
  };
  const prisma: any = { ...tx, $transaction: async (value: any) => typeof value === 'function' ? value(tx) : Promise.all(value) };
  const meta: any = { refreshAdAccount: async () => { if (overrides.refreshFails) throw new Error('provider failed'); return { metaAdAccountId: '123456789' }; } };
  const reconciliation: any = { reconcileAdAccount: async () => ({ id: 'snapshot-a' }) };
  return { service: new MetaFundingService(prisma, meta, reconciliation), session, reservation, events };
}

describe('Meta Funding service', () => {
  it('records one success observation and makes duplicate evidence idempotent', async () => {
    const { service, session, events } = observationHarness();
    const input = { idempotencyKey: 'observe-0001', observedAmountMinor: '10000', visibleMetaAccountId: '123456789', detectorVersion: '1.0.0' };
    await service.observeSuccess(actor, session.id, input);
    assert.equal(session.operationalState, 'UI_OBSERVED');
    assert.equal(events.filter((event) => event.eventType === 'UI_SUCCESS_OBSERVED').length, 1);
    await service.observeSuccess(actor, session.id, input);
    assert.equal(events.filter((event) => event.eventType === 'UI_SUCCESS_OBSERVED').length, 1);
  });

  it('routes amount mismatch and targeted verification failure to review', async () => {
    const { service, session, events } = observationHarness({ refreshFails: true });
    await service.observeSuccess(actor, session.id, { idempotencyKey: 'observe-0002', observedAmountMinor: '9999', visibleMetaAccountId: '123456789' });
    assert.equal(session.operationalState, 'REVIEW_REQUIRED');
    assert.ok(events.some((event) => event.eventType === 'TARGETED_VERIFICATION_FAILED'));
  });

  it('confirms or rejects only through a finance reviewer and releases rejected reservations', async () => {
    const denied = observationHarness(); denied.session.operationalState = 'UI_OBSERVED';
    await assert.rejects(() => denied.service.review(actor, denied.session.id, { decision: 'CONFIRM' }), ForbiddenException);
    const allowed = observationHarness(); allowed.session.operationalState = 'UI_OBSERVED';
    await allowed.service.review({ ...actor, role: 'FINANCE', sessionKind: 'WEB' }, allowed.session.id, { decision: 'REJECT', reason: 'Amount not visible in Meta' });
    assert.equal(allowed.session.financialReviewState, 'REJECTED');
    assert.equal(allowed.reservation.status, 'RELEASED');
  });

  it('cancellation and expiry release active reservations', async () => {
    const cancelled = observationHarness();
    await cancelled.service.closeSession(actor, cancelled.session.id);
    assert.equal(cancelled.session.operationalState, 'CANCELLED');
    assert.equal(cancelled.reservation.status, 'RELEASED');
    const expired = observationHarness();
    await expired.service.closeSession(actor, expired.session.id, true);
    assert.equal(expired.session.operationalState, 'EXPIRED');
    assert.equal(expired.reservation.status, 'EXPIRED');
  });

  it('contains no ledger dependency or ledger mutation call', () => {
    const source = readFileSync(new URL('../src/modules/meta-funding/meta-funding.service.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('LedgerService'), false);
    assert.equal(source.includes('financialLedgerTransaction'), false);
    assert.equal(source.includes('postTransaction'), false);
  });
});

