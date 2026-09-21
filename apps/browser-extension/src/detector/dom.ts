import type { DetectorRules, DialogState, DomSignals, ReadableDocument, ReadableElement } from './types.ts';
import { normalizeMetaAccountId } from './url.ts';

function first(root: ReadableDocument | ReadableElement, selectors: readonly string[]): ReadableElement | null {
  for (const selector of selectors) {
    const found = root.querySelector(selector);
    if (found) return found;
  }
  return null;
}

function cleanText(element: ReadableElement | null, maxLength: number): string | undefined {
  const text = element?.textContent?.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function visibleAccountFallback(root: ReadableElement): { id?: string; name?: string } {
  const elements = root.querySelectorAll?.('span, div, p') ?? [];
  let best: { id: string; name: string; length: number } | undefined;
  for (const element of elements) {
    const text = element.textContent?.replace(/\s+/g, ' ').trim();
    if (!text || text.length > 120) continue;
    const match = /^(.{1,80}?)\s*\((\d{5,32})\)$/.exec(text);
    if (!match) continue;
    const id = normalizeMetaAccountId(match[2]);
    const name = match[1].trim();
    if (id && name && (!best || text.length < best.length)) best = { id, name, length: text.length };
  }
  return best ? { id: best.id, name: best.name } : {};
}

export function parseInrAmount(text?: string): { amountText: string; amountMinor: string } | undefined {
  if (!text) return undefined;
  const match = /₹\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?)/.exec(text);
  if (!match) return undefined;
  const normalized = match[1].replace(/,/g, '');
  const parts = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!parts) return undefined;
  const minor = BigInt(parts[1]) * 100n + BigInt((parts[2] ?? '').padEnd(2, '0') || '0');
  if (minor <= 0n) return undefined;
  return { amountText: `₹${match[1]}`, amountMinor: minor.toString() };
}

function stateFor(dialog: ReadableElement, rules: DetectorRules): DialogState {
  if (first(dialog, rules.selectors.success)) return 'success';
  if (first(dialog, rules.selectors.failure)) return 'failure';
  if (first(dialog, rules.selectors.expired)) return 'expired';
  if (first(dialog, rules.selectors.processing)) return 'processing';
  if (first(dialog, rules.selectors.qr)) return 'qr-active';
  const text = dialog.textContent?.replace(/\s+/g, ' ').toLowerCase() ?? '';
  if (text.includes('complete payment') && text.includes('payment request expires')) return 'qr-active';
  return 'unknown';
}

export function parseDomSignals(documentLike: ReadableDocument, rules: DetectorRules): DomSignals {
  if (rules.disabled) return { qrVisible: false, dialogState: 'unknown', successVisible: false, signalNames: [] };
  const dialog = first(documentLike, rules.selectors.dialog);
  if (!dialog) return { qrVisible: false, dialogState: 'unknown', successVisible: false, signalNames: [] };

  const idElement = first(dialog, rules.selectors.accountId);
  const nameElement = first(dialog, rules.selectors.accountName);
  const amountElement = first(dialog, rules.selectors.amount);
  const dialogState = stateFor(dialog, rules);
  const qrVisible = Boolean(first(dialog, rules.selectors.qr)) || dialogState === 'qr-active';
  const accountValue = idElement?.getAttribute('data-account-id') ?? cleanText(idElement, 64);
  const fallbackAccount = visibleAccountFallback(dialog);
  const visibleAccountId = normalizeMetaAccountId(accountValue) ?? fallbackAccount.id;
  const visibleAccountName = cleanText(nameElement, 160) ?? fallbackAccount.name;
  const amount = parseInrAmount(cleanText(amountElement, 64) ?? cleanText(dialog, 50000));
  const signalNames = [
    'payment-dialog',
    ...(visibleAccountId ? ['visible-account-id'] : []),
    ...(visibleAccountName ? ['visible-account-name'] : []),
    ...(amount ? ['inr-amount'] : []),
    ...(qrVisible ? ['qr-present'] : []),
    ...(dialogState !== 'unknown' && dialogState !== 'qr-active' ? [`state-${dialogState}`] : [])
  ];

  return {
    ...(visibleAccountId ? { visibleAccountId } : {}),
    ...(visibleAccountName ? { visibleAccountName } : {}),
    ...(amount ? { ...amount, currencyCode: 'INR' as const } : {}),
    qrVisible,
    dialogState,
    successVisible: dialogState === 'success',
    signalNames
  };
}
