import { parseDomSignals } from './dom.ts';
import type { DetectionEvidence, DetectorConfidence, DetectorRules, ReadableDocument } from './types.ts';
import { extractUrlAccountId } from './url.ts';

export const DEFAULT_DETECTOR_RULES: DetectorRules = {
  version: 'fixture-v2',
  disabled: false,
  selectors: {
    dialog: [
      '[data-ads-control-signal="payment-dialog"]',
      '[role="dialog"][aria-modal="true"]',
      '[role="dialog"]',
      'div[aria-modal="true"]',
      'div[data-testid*="payment"]',
      'div[class*="PaymentDialog"]',
      'div[class*="Modal"]',
      'body'
    ],
    accountId: ['[data-ads-control-signal="account-id"]', '[data-testid*="account-id"]', '[data-account-id]'],
    accountName: ['[data-ads-control-signal="account-name"]', '[data-testid*="account-name"]'],
    amount: ['[data-ads-control-signal="amount"]', '[data-testid*="amount"]', 'input[name="amount"]'],
    qr: [
      '[data-ads-control-signal="qr"]',
      'canvas',
      'img[src*="qr" i]',
      'img[alt*="qr" i]',
      'img[src*="data:image"]',
      'svg[class*="qr" i]',
      '[class*="qr" i]',
      '[id*="qr" i]',
      '[data-testid*="qr" i]',
      '[aria-label*="qr" i]'
    ],
    processing: ['[data-ads-control-state="processing"]', '[data-testid*="processing"]'],
    success: ['[data-ads-control-state="success"]', '[data-testid*="success"]'],
    failure: ['[data-ads-control-state="failure"]', '[data-testid*="failure"]'],
    expired: ['[data-ads-control-state="expired"]', '[data-testid*="expired"]']
  }
};

function confidence(urlId?: string, visibleId?: string, visibleName?: string): {
  confidence: DetectorConfidence;
  blocked: boolean;
  requiresConfirmation: boolean;
} {
  if (urlId && visibleId && urlId !== visibleId) return { confidence: 'blocked', blocked: true, requiresConfirmation: true };
  if (urlId && visibleId) return { confidence: 'high', blocked: false, requiresConfirmation: false };
  if (visibleId || visibleName) return { confidence: 'medium', blocked: false, requiresConfirmation: true };
  return { confidence: 'low', blocked: false, requiresConfirmation: true };
}

function hashSnapshot(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function evaluateDetection(pageUrl: string, documentLike: ReadableDocument, rules = DEFAULT_DETECTOR_RULES): DetectionEvidence | null {
  const dom = parseDomSignals(documentLike, rules);
  if (!dom.signalNames.includes('payment-dialog')) return null;
  if (dom.dialogState === 'unknown' && !dom.qrVisible) return null;
  const urlAccountId = extractUrlAccountId(pageUrl);
  const result = confidence(urlAccountId, dom.visibleAccountId, dom.visibleAccountName);
  const safe = {
    pageUrl,
    ...(urlAccountId ? { urlAccountId } : {}),
    ...dom,
    ...result,
    detectorVersion: rules.version
  };
  return { ...safe, snapshotHash: hashSnapshot(JSON.stringify(safe)) };
}

export function isDetectionEvidence(value: unknown): value is DetectionEvidence {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  const allowed = new Set([
    'pageUrl', 'urlAccountId', 'visibleAccountId', 'visibleAccountName', 'amountText', 'amountMinor', 'paymentMethod',
    'currencyCode', 'qrVisible', 'dialogState', 'successVisible', 'signalNames', 'confidence',
    'blocked', 'requiresConfirmation', 'detectorVersion', 'snapshotHash'
  ]);
  return Object.keys(candidate).every((key) => allowed.has(key))
    && typeof candidate.pageUrl === 'string'
    && typeof candidate.qrVisible === 'boolean'
    && Array.isArray(candidate.signalNames)
    && typeof candidate.snapshotHash === 'string';
}
