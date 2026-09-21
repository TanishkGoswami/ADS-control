import {
  TopupConfidence,
  TopupOperationalState
} from '../enums/index.js';
import type { MinorUnitString, TopupFundingSource } from '../types/index.js';

const terminalStates = new Set<TopupOperationalState>([
  TopupOperationalState.CANCELLED,
  TopupOperationalState.EXPIRED
]);

const transitions: Record<TopupOperationalState, readonly TopupOperationalState[]> = {
  [TopupOperationalState.DETECTED]: [
    TopupOperationalState.MAPPED,
    TopupOperationalState.REVIEW_REQUIRED,
    TopupOperationalState.CANCELLED,
    TopupOperationalState.EXPIRED
  ],
  [TopupOperationalState.MAPPED]: [
    TopupOperationalState.UI_OBSERVED,
    TopupOperationalState.REVIEW_REQUIRED,
    TopupOperationalState.CANCELLED,
    TopupOperationalState.EXPIRED
  ],
  [TopupOperationalState.UI_OBSERVED]: [
    TopupOperationalState.REVIEW_REQUIRED,
    TopupOperationalState.CANCELLED,
    TopupOperationalState.EXPIRED
  ],
  [TopupOperationalState.REVIEW_REQUIRED]: [
    TopupOperationalState.CANCELLED,
    TopupOperationalState.EXPIRED
  ],
  [TopupOperationalState.CANCELLED]: [],
  [TopupOperationalState.EXPIRED]: []
};

export interface AccountEvidenceInput {
  urlAccountId?: string;
  visibleAccountId?: string;
  visibleAccountName?: string;
}

export interface AccountEvidenceResult {
  confidence: TopupConfidence;
  blocked: boolean;
  requiresConfirmation: boolean;
  urlAccountId?: string;
  visibleAccountId?: string;
  visibleAccountName?: string;
}

export interface TopupFingerprintPayload {
  organizationId: string;
  amountMinor: MinorUnitString;
  currencyCode: 'INR';
  selectedAdAccountId: string;
  fundingSource: TopupFundingSource;
}

export function parseInrAmountToMinor(amountText: string, currencyCode: string): MinorUnitString {
  if (currencyCode !== 'INR') {
    throw new Error('Only INR is supported');
  }

  const normalized = amountText.trim().replace(/^₹\s*/, '').replace(/,/g, '');
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) {
    throw new Error('Invalid INR amount');
  }

  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? '').padEnd(2, '0') || '0');
  const minor = whole * 100n + fraction;
  if (minor <= 0n) {
    throw new Error('Amount must be greater than zero');
  }
  return minor.toString() as MinorUnitString;
}

export function normalizeMetaAccountId(value?: string): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  return /^\d{5,32}$/.test(digits) ? digits : undefined;
}

export function evaluateAccountEvidence(input: AccountEvidenceInput): AccountEvidenceResult {
  const urlAccountId = normalizeMetaAccountId(input.urlAccountId);
  const visibleAccountId = normalizeMetaAccountId(input.visibleAccountId);
  const visibleAccountName = input.visibleAccountName?.trim() || undefined;
  const evidence = {
    ...(urlAccountId ? { urlAccountId } : {}),
    ...(visibleAccountId ? { visibleAccountId } : {}),
    ...(visibleAccountName ? { visibleAccountName } : {})
  };

  if (urlAccountId && visibleAccountId && urlAccountId !== visibleAccountId) {
    return { confidence: TopupConfidence.BLOCKED, blocked: true, requiresConfirmation: true, ...evidence };
  }
  if (urlAccountId && visibleAccountId) {
    return { confidence: TopupConfidence.HIGH, blocked: false, requiresConfirmation: false, ...evidence };
  }
  if (visibleAccountId || visibleAccountName) {
    return { confidence: TopupConfidence.MEDIUM, blocked: false, requiresConfirmation: true, ...evidence };
  }
  return { confidence: TopupConfidence.LOW, blocked: false, requiresConfirmation: true, ...evidence };
}

export function canTransitionTopup(from: TopupOperationalState, to: TopupOperationalState): boolean {
  if (terminalStates.has(from)) return false;
  return transitions[from].includes(to);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)])
    );
  }
  return value;
}

export function buildTopupFingerprintInput(payload: TopupFingerprintPayload): string {
  return JSON.stringify(canonicalize(payload));
}
