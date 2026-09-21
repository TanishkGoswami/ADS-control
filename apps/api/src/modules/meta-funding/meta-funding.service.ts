import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { AuthPrincipal } from '@ads-control/shared';
import { FinancialReviewState, FundingRequestStatus, TopupOperationalState, TopupReservationStatus } from '@ads-control/shared';
import { Prisma, type PrismaClient } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { MetaService } from '../meta/meta.service';
import { ReconciliationService } from '../reconciliation/reconciliation.service';
import type { ActivityQueryDto, CreateFundingRequestDto, MapTopupDto, ObserveTopupDto, ReviewTopupDto } from './dto/meta-funding.dto';

type Tx = Prisma.TransactionClient;
const ACTIVE_LOT_STATES = ['AVAILABLE', 'ALLOCATED'];
const SESSION_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class MetaFundingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meta: MetaService,
    private readonly reconciliation: ReconciliationService
  ) {}

  async listAccounts(actor: AuthPrincipal) {
    const accounts = await this.prisma.adAccount.findMany({
      where: {
        organizationId: actor.organizationId,
        currencyCode: 'INR',
        ...(['ADMIN', 'FINANCE'].includes(actor.role) ? {} : { userAccess: { some: { userId: actor.userId, organizationId: actor.organizationId } } })
      },
      select: { id: true, metaAdAccountId: true, name: true, internalAlias: true, currencyCode: true, normalizedStatus: true },
      orderBy: { name: 'asc' }
    });
    return accounts.map((account) => ({ ...account, name: account.name.trim(), metaAdAccountId: this.metaId(account.metaAdAccountId) }));
  }

  async createRequest(actor: AuthPrincipal, input: CreateFundingRequestDto) {
    const amount = this.amount(input.amountMinor);
    const lot = await this.prisma.fundLot.findFirst({ where: { id: input.fundLotId, organizationId: actor.organizationId } });
    if (!lot) throw new NotFoundException('Fund lot not found');
    this.assertEligibleLot(lot, input.currencyCode);
    if (input.targetAdAccountId) await this.assertAccountAccess(this.prisma, actor, input.targetAdAccountId);
    const request = await this.prisma.fundingRequest.create({ data: {
      organizationId: actor.organizationId, referenceCode: `FR-${Date.now()}-${randomUUID().slice(0, 6)}`,
      createdByUserId: actor.userId, fundLotId: lot.id, targetAdAccountId: input.targetAdAccountId,
      amountMinor: amount, currencyCode: 'INR', purpose: input.purpose.trim(), status: FundingRequestStatus.DRAFT
    }});
    return this.wire(request);
  }

  async listEligibility(actor: AuthPrincipal) {
    const lots = await this.prisma.fundLot.findMany({ where: { organizationId: actor.organizationId, currencyCode: 'INR', status: { in: ACTIVE_LOT_STATES } }, orderBy: { createdAt: 'desc' } });
    const reservations = await this.prisma.topupReservation.groupBy({ by: ['fundLotId'], where: { organizationId: actor.organizationId, status: TopupReservationStatus.ACTIVE }, _sum: { amountMinor: true } });
    const reserved = new Map(reservations.map((item) => [item.fundLotId, item._sum.amountMinor ?? 0n]));
    return lots.map((lot) => ({ ...this.wire(lot), availableAmountMinor: (lot.currentAmountMinor - (reserved.get(lot.id) ?? 0n)).toString() }));
  }

  async listRequests(actor: AuthPrincipal) {
    const requests = await this.prisma.fundingRequest.findMany({ where: { organizationId: actor.organizationId }, include: { fundLot: true, targetAdAccount: true }, orderBy: { createdAt: 'desc' } });
    return requests.map((request) => this.wire(request));
  }

  async listDevices(actor: AuthPrincipal) {
    const devices = await this.prisma.extensionDevice.findMany({ where: { organizationId: actor.organizationId, ...(actor.role === 'ADMIN' ? {} : { userId: actor.userId }) }, select: { id: true, userId: true, name: true, version: true, expiresAt: true, revokedAt: true, lastSeenAt: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    return devices;
  }

  async approveRequest(actor: AuthPrincipal, id: string) {
    this.assertReviewer(actor);
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.fundingRequest.findFirst({ where: { id, organizationId: actor.organizationId }, include: { fundLot: true } });
      if (!request) throw new NotFoundException('Funding request not found');
      if (request.status !== FundingRequestStatus.DRAFT) throw new ConflictException('Only draft requests can be approved');
      this.assertEligibleLot(request.fundLot, request.currencyCode);
      const aggregate = await tx.topupReservation.aggregate({ where: { fundLotId: request.fundLotId, status: TopupReservationStatus.ACTIVE }, _sum: { amountMinor: true } });
      if (request.fundLot.currentAmountMinor - (aggregate._sum.amountMinor ?? 0n) < request.amountMinor) throw new ConflictException('Insufficient available fund balance');
      const updated = await tx.fundingRequest.update({ where: { id }, data: { status: FundingRequestStatus.APPROVED, approvedByUserId: actor.userId, approvedAt: new Date() } });
      await this.audit(tx, actor, 'FUNDING_REQUEST_APPROVED', 'FUNDING_REQUEST', id, { referenceCode: request.referenceCode });
      return this.wire(updated);
    });
  }

  async cancelRequest(actor: AuthPrincipal, id: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.fundingRequest.findFirst({ where: { id, organizationId: actor.organizationId } });
      if (!request) throw new NotFoundException('Funding request not found');
      if (![FundingRequestStatus.DRAFT, FundingRequestStatus.APPROVED, FundingRequestStatus.READY].includes(request.status as FundingRequestStatus)) throw new ConflictException('Funding request cannot be cancelled');
      const active = await tx.topupReservation.count({ where: { fundingRequestId: id, status: TopupReservationStatus.ACTIVE } });
      if (active) throw new ConflictException('Funding request has an active reservation');
      const updated = await tx.fundingRequest.update({ where: { id }, data: { status: FundingRequestStatus.CANCELLED, cancelledAt: new Date() } });
      await this.audit(tx, actor, 'FUNDING_REQUEST_CANCELLED', 'FUNDING_REQUEST', id, { reason: this.clean(reason) });
      return this.wire(updated);
    });
  }

  async mapTopup(actor: AuthPrincipal, input: MapTopupDto) {
    const amount = this.amount(input.selectedAmountMinor);
    if (input.currencyCode !== 'INR') throw new BadRequestException('Only INR is supported');
    const fingerprint = this.fingerprint({ organizationId: actor.organizationId, ...input });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const replay = await tx.metaTopupSession.findUnique({ where: { organizationId_idempotencyKey: { organizationId: actor.organizationId, idempotencyKey: input.idempotencyKey } }, include: { reservation: true } });
          if (replay) {
            if (replay.idempotencyFingerprint !== fingerprint) throw new ConflictException('Idempotency key was already used for different input');
            return this.wire(replay);
          }
          const account = await this.assertAccountAccess(tx, actor, input.selectedAdAccountId);
          if (input.detectedAdAccountId && input.detectedAdAccountId !== input.selectedAdAccountId) throw new ConflictException('Detected and selected Ad Accounts do not match');
          if (input.detectedMetaAccountId && this.metaId(input.detectedMetaAccountId) !== this.metaId(account.metaAdAccountId)) throw new ConflictException('Detected Meta account does not match selected account');
          if (input.visibleMetaAccountId && this.metaId(input.visibleMetaAccountId) !== this.metaId(account.metaAdAccountId)) throw new ConflictException('Visible Meta account does not match selected account');
          let request: any = null;
          let lotId = input.fundLotId;
          if (input.fundingSourceType === 'FUNDING_REQUEST') {
            if (!input.fundingRequestId || input.fundLotId) throw new BadRequestException('A funding request source requires only fundingRequestId');
            request = await tx.fundingRequest.findFirst({ where: { id: input.fundingRequestId, organizationId: actor.organizationId }, include: { fundLot: true } });
            if (!request) throw new NotFoundException('Funding request not found');
            if (![FundingRequestStatus.APPROVED, FundingRequestStatus.READY].includes(request.status)) throw new ConflictException('Funding request is not approved');
            if (request.amountMinor !== amount) throw new ConflictException('Mapped amount does not match funding request');
            if (request.targetAdAccountId && request.targetAdAccountId !== account.id) throw new ConflictException('Funding request targets another Ad Account');
            lotId = request.fundLotId;
          } else if (!lotId || input.fundingRequestId) throw new BadRequestException('A direct Fund Lot source requires only fundLotId');
          const lot = request?.fundLot ?? await tx.fundLot.findFirst({ where: { id: lotId, organizationId: actor.organizationId } });
          if (!lot) throw new NotFoundException('Fund lot not found');
          this.assertEligibleLot(lot, input.currencyCode);
          const aggregate = await tx.topupReservation.aggregate({ where: { fundLotId: lot.id, status: TopupReservationStatus.ACTIVE }, _sum: { amountMinor: true } });
          if (lot.currentAmountMinor - (aggregate._sum.amountMinor ?? 0n) < amount) throw new ConflictException('Insufficient available fund balance');
          const session = await tx.metaTopupSession.create({ data: {
            organizationId: actor.organizationId, actorUserId: actor.userId, extensionDeviceId: actor.deviceId,
            fundingRequestId: request?.id, fundLotId: lot.id, detectedAdAccountId: input.detectedAdAccountId,
            selectedAdAccountId: account.id, detectedMetaAccountId: input.detectedMetaAccountId,
            visibleMetaAccountId: input.visibleMetaAccountId, idempotencyKey: input.idempotencyKey,
            idempotencyFingerprint: fingerprint, detectedAmountMinor: input.detectedAmountMinor ? this.amount(input.detectedAmountMinor) : undefined,
            selectedAmountMinor: amount, detectedCurrencyCode: input.currencyCode, selectedCurrencyCode: 'INR',
            fundingSourceType: input.fundingSourceType, confidence: this.confidence(input, account.metaAdAccountId),
            operationalState: TopupOperationalState.MAPPED, financialReviewState: FinancialReviewState.UNVERIFIED,
            detectorVersion: input.detectorVersion, expiresAt: new Date(Date.now() + SESSION_TTL_MS)
          }});
          await tx.topupReservation.create({ data: { organizationId: actor.organizationId, sessionId: session.id, fundLotId: lot.id, fundingRequestId: request?.id, amountMinor: amount, currencyCode: 'INR', status: TopupReservationStatus.ACTIVE, expiresAt: session.expiresAt } });
          await this.event(tx, actor, session.id, 'TOPUP_MAPPED', input.idempotencyKey, { accountId: this.metaId(account.metaAdAccountId), amountMinor: amount.toString(), confidence: session.confidence });
          await this.audit(tx, actor, 'TOPUP_MAPPED', 'META_TOPUP_SESSION', session.id, { accountId: this.metaId(account.metaAdAccountId), amountMinor: amount.toString() });
          return this.wire(session);
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error: any) {
        if (error?.code === 'P2034' && attempt < 2) continue;
        if (error?.code === 'P2002') {
          const replay = await this.prisma.metaTopupSession.findUnique({ where: { organizationId_idempotencyKey: { organizationId: actor.organizationId, idempotencyKey: input.idempotencyKey } } });
          if (replay?.idempotencyFingerprint === fingerprint) return this.wire(replay);
          throw new ConflictException('Idempotency key was already used for different input');
        }
        throw error;
      }
    }
    throw new ConflictException('Concurrent mapping conflict; retry the request');
  }

  async observeSuccess(actor: AuthPrincipal, sessionId: string, input: ObserveTopupDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const session = await tx.metaTopupSession.findFirst({ where: { id: sessionId, organizationId: actor.organizationId }, include: { selectedAdAccount: true, reservation: true } });
      if (!session) throw new NotFoundException('Top-up session not found');
      const existing = await tx.metaTopupEvent.findUnique({ where: { organizationId_idempotencyKey: { organizationId: actor.organizationId, idempotencyKey: input.idempotencyKey } } });
      if (existing) {
        if (existing.sessionId !== session.id) throw new ConflictException('Idempotency key belongs to another top-up session');
        return { session, duplicate: true };
      }
      if (session.operationalState !== TopupOperationalState.MAPPED) throw new ConflictException('Only mapped sessions can observe success');
      const mismatch = (input.observedAmountMinor && this.amount(input.observedAmountMinor) !== session.selectedAmountMinor) || (input.visibleMetaAccountId && this.metaId(input.visibleMetaAccountId) !== this.metaId(session.selectedAdAccount?.metaAdAccountId));
      const state = mismatch ? TopupOperationalState.REVIEW_REQUIRED : TopupOperationalState.UI_OBSERVED;
      const updated = await tx.metaTopupSession.update({ where: { id: session.id }, data: { operationalState: state, financialReviewState: FinancialReviewState.UNVERIFIED, uiObservedAt: new Date() } });
      await this.event(tx, actor, session.id, 'UI_SUCCESS_OBSERVED', input.idempotencyKey, { amountMinor: input.observedAmountMinor, accountId: input.visibleMetaAccountId, mismatch: Boolean(mismatch), detectorVersion: input.detectorVersion });
      await this.audit(tx, actor, 'TOPUP_UI_OBSERVED', 'META_TOPUP_SESSION', session.id, { mismatch: Boolean(mismatch) });
      return { session: { ...session, ...updated }, duplicate: false };
    });
    if (!result.duplicate && result.session.selectedAdAccountId) {
      try {
        const refreshed = await this.meta.refreshAdAccount(actor.organizationId, result.session.selectedAdAccountId);
        const snapshot = await this.reconciliation.reconcileAdAccount(actor.organizationId, result.session.selectedAdAccountId);
        await this.appendVerification(actor, sessionId, true, { accountId: refreshed.metaAdAccountId, snapshotId: snapshot.id });
      } catch {
        await this.appendVerification(actor, sessionId, false, {});
      }
    }
    return this.getSession(actor, sessionId);
  }

  async review(actor: AuthPrincipal, sessionId: string, input: ReviewTopupDto) {
    this.assertReviewer(actor);
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.metaTopupSession.findFirst({ where: { id: sessionId, organizationId: actor.organizationId }, include: { reservation: true } });
      if (!session || !session.reservation) throw new NotFoundException('Top-up session not found');
      if (![TopupOperationalState.UI_OBSERVED, TopupOperationalState.REVIEW_REQUIRED].includes(session.operationalState as TopupOperationalState)) throw new ConflictException('Session is not ready for review');
      if (session.financialReviewState !== FinancialReviewState.UNVERIFIED) throw new ConflictException('Session has already been reviewed');
      const confirmed = input.decision === 'CONFIRM';
      await tx.metaTopupSession.update({ where: { id: session.id }, data: { financialReviewState: confirmed ? FinancialReviewState.CONFIRMED : FinancialReviewState.REJECTED, reviewedAt: new Date() } });
      await tx.topupReservation.update({ where: { sessionId }, data: confirmed ? { status: TopupReservationStatus.CONFIRMED, confirmedAt: new Date() } : { status: TopupReservationStatus.RELEASED, releasedAt: new Date() } });
      await this.event(tx, actor, session.id, confirmed ? 'TOPUP_CONFIRMED' : 'TOPUP_REJECTED', `review:${session.id}:${input.decision}`, { reason: this.clean(input.reason) });
      await this.audit(tx, actor, confirmed ? 'TOPUP_CONFIRMED' : 'TOPUP_REJECTED', 'META_TOPUP_SESSION', session.id, { reason: this.clean(input.reason) });
      return this.getSession(actor, sessionId, tx);
    });
  }

  async closeSession(actor: AuthPrincipal, sessionId: string, expired = false) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.metaTopupSession.findFirst({ where: { id: sessionId, organizationId: actor.organizationId }, include: { reservation: true } });
      if (!session) throw new NotFoundException('Top-up session not found');
      if ([TopupOperationalState.CANCELLED, TopupOperationalState.EXPIRED].includes(session.operationalState as TopupOperationalState)) return this.wire(session);
      if (session.financialReviewState === FinancialReviewState.CONFIRMED) throw new ConflictException('Confirmed sessions cannot be closed');
      const state = expired ? TopupOperationalState.EXPIRED : TopupOperationalState.CANCELLED;
      await tx.metaTopupSession.update({ where: { id: session.id }, data: { operationalState: state } });
      if (session.reservation?.status === TopupReservationStatus.ACTIVE) await tx.topupReservation.update({ where: { sessionId }, data: { status: expired ? TopupReservationStatus.EXPIRED : TopupReservationStatus.RELEASED, releasedAt: new Date() } });
      await this.event(tx, actor, session.id, `TOPUP_${state}`, `${state.toLowerCase()}:${session.id}`, {});
      await this.audit(tx, actor, `TOPUP_${state}`, 'META_TOPUP_SESSION', session.id, {});
      return this.getSession(actor, sessionId, tx);
    });
  }

  async getActivity(actor: AuthPrincipal, query: ActivityQueryDto) {
    const page = Math.max(Number(query.page || 1), 1);
    const take = Math.min(Math.max(Number(query.pageSize || 25), 1), 100);
    const skip = (page - 1) * take;
    const createdAt = query.from || query.to ? {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {})
    } : undefined;
    const where: Prisma.MetaTopupSessionWhereInput = {
      organizationId: actor.organizationId,
      ...(query.status ? { operationalState: query.status } : {}),
      ...(query.reviewState ? { financialReviewState: query.reviewState } : {}),
      ...(query.accountId ? { selectedAdAccountId: query.accountId } : {}),
      ...(query.source ? { fundingSourceType: query.source } : {}),
      ...(query.readyForReview === 'true' ? { operationalState: { in: [TopupOperationalState.UI_OBSERVED, TopupOperationalState.REVIEW_REQUIRED] }, financialReviewState: FinancialReviewState.UNVERIFIED } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(query.search ? { OR: [
        { selectedAdAccount: { name: { contains: query.search, mode: 'insensitive' } } },
        { selectedAdAccount: { metaAdAccountId: { contains: query.search } } },
        { id: { contains: query.search, mode: 'insensitive' } }
      ] } : {})
    };
    const [items, total] = await this.prisma.$transaction([this.prisma.metaTopupSession.findMany({ where, include: { selectedAdAccount: true, reservation: true }, orderBy: { createdAt: 'desc' }, skip, take }), this.prisma.metaTopupSession.count({ where })]);
    return { items: items.map((item) => this.wire(item)), total, page, pageSize: take };
  }

  async getSession(actor: AuthPrincipal, id: string, db: Tx | PrismaService = this.prisma) {
    const session = await db.metaTopupSession.findFirst({ where: { id, organizationId: actor.organizationId }, include: { selectedAdAccount: true, reservation: true, events: { orderBy: { sequence: 'asc' } } } });
    if (!session) throw new NotFoundException('Top-up session not found');
    return this.wire(session);
  }

  async revokeDevice(actor: AuthPrincipal, deviceId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.extensionDevice.updateMany({ where: { id: deviceId, organizationId: actor.organizationId, ...(actor.role === 'ADMIN' ? {} : { userId: actor.userId }), revokedAt: null }, data: { revokedAt: new Date() } });
      if (!changed.count) throw new NotFoundException('Extension device not found');
      await this.audit(tx, actor, 'EXTENSION_DEVICE_REVOKED', 'EXTENSION_DEVICE', deviceId, {});
      return { revoked: true };
    });
    return result;
  }

  private async appendVerification(actor: AuthPrincipal, sessionId: string, ok: boolean, metadata: Record<string, unknown>) {
    await this.prisma.$transaction(async (tx) => {
      const session = await tx.metaTopupSession.findFirst({ where: { id: sessionId, organizationId: actor.organizationId } });
      if (!session) return;
      if (!ok) await tx.metaTopupSession.update({ where: { id: sessionId }, data: { operationalState: TopupOperationalState.REVIEW_REQUIRED } });
      await this.event(tx, actor, sessionId, ok ? 'TARGETED_VERIFICATION_COMPLETED' : 'TARGETED_VERIFICATION_FAILED', `verify:${sessionId}`, metadata);
    }).catch((error: any) => { if (error?.code !== 'P2002') throw error; });
  }

  private async assertAccountAccess(db: Tx | PrismaService, actor: AuthPrincipal, adAccountId: string) {
    const account = await db.adAccount.findFirst({ where: { id: adAccountId, organizationId: actor.organizationId } });
    if (!account) throw new NotFoundException('Ad Account not found');
    if (actor.role !== 'ADMIN' && actor.role !== 'FINANCE') {
      const access = await db.userAdAccountAccess.findFirst({ where: { organizationId: actor.organizationId, userId: actor.userId, adAccountId } });
      if (!access) throw new ForbiddenException('Ad Account access required');
    }
    if (account.currencyCode !== 'INR') throw new BadRequestException('Only INR Ad Accounts are supported');
    return account;
  }

  private assertEligibleLot(lot: { currencyCode: string; status: string }, currency: string) {
    if (lot.currencyCode !== 'INR' || currency !== 'INR') throw new BadRequestException('Only INR Fund Lots are supported');
    if (!ACTIVE_LOT_STATES.includes(lot.status)) throw new ConflictException('Fund lot is not eligible');
  }
  private assertReviewer(actor: AuthPrincipal) { if (!['ADMIN', 'FINANCE'].includes(actor.role)) throw new ForbiddenException('Finance review permission required'); }
  private amount(value: string) { try { const result = BigInt(value); if (result <= 0n) throw new Error(); return result; } catch { throw new BadRequestException('Amount must be a positive minor-unit integer'); } }
  private confidence(input: MapTopupDto, expected: string) { const canonical=this.metaId(expected); if ((input.detectedMetaAccountId && this.metaId(input.detectedMetaAccountId) !== canonical) || (input.visibleMetaAccountId && this.metaId(input.visibleMetaAccountId) !== canonical)) return 'BLOCKED'; return input.detectedMetaAccountId && input.visibleMetaAccountId ? 'HIGH' : input.detectedMetaAccountId || input.visibleMetaAccountId ? 'MEDIUM' : 'LOW'; }
  private metaId(value?: string | null) { return value?.replace(/^act_/i, '').replace(/\D/g, '') || ''; }
  private fingerprint(value: unknown) { return createHash('sha256').update(JSON.stringify(value, Object.keys(value as object).sort())).digest('hex'); }
  private clean(value?: string) { return value?.trim().slice(0, 240) || undefined; }
  private wire<T>(value: T): T { return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item)); }
  private async event(tx: Tx, actor: AuthPrincipal, sessionId: string, eventType: string, idempotencyKey: string, metadata: Record<string, unknown>) {
    const latest = await tx.metaTopupEvent.aggregate({ where: { sessionId }, _max: { sequence: true } });
    return tx.metaTopupEvent.create({ data: { organizationId: actor.organizationId, sessionId, actorUserId: actor.userId, extensionDeviceId: actor.deviceId, sequence: (latest._max.sequence ?? 0) + 1, eventType, idempotencyKey, metadataJson: metadata as Prisma.InputJsonValue } });
  }
  private audit(tx: Tx, actor: AuthPrincipal, action: string, entityType: string, entityId: string, newState: Record<string, unknown>) { return tx.auditLog.create({ data: { organizationId: actor.organizationId, actorUserId: actor.userId, action, entityType, entityId, newState: newState as Prisma.InputJsonValue } }); }
}
