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

function findModalDialog(doc: ReadableDocument): ReadableElement | null {
  const explicitSignal = doc.querySelector('[data-ads-control-signal="payment-dialog"]');
  if (explicitSignal) return explicitSignal;

  // 1. Try explicit modal / dialog elements
  const candidates = Array.from(doc.querySelectorAll?.('[role="dialog"], [aria-modal="true"], div[class*="dialog" i], div[class*="modal" i]') ?? []);
  for (const el of candidates) {
    const text = el.textContent?.toLowerCase() || '';
    if (text.includes('complete payment') || text.includes('add funds') || text.includes('payment request expires') || text.includes('upi') || text.includes('scan qr')) {
      return el;
    }
  }
  if (candidates.length > 0) return candidates[0];

  // 2. Fallback to elements containing payment headings
  const allDivs = Array.from(doc.querySelectorAll?.('div, section, main') ?? []);
  for (const el of allDivs) {
    const text = el.textContent?.toLowerCase() || '';
    if (text.includes('complete payment') && (text.includes('expires') || text.includes('upi') || text.includes('phonepe') || text.includes('paytm'))) {
      return el;
    }
  }

  return doc.querySelector?.('body') ?? null;
}

function extractModalAccount(root: ReadableElement): { id?: string; name?: string } {
  const explicitId = root.querySelector('[data-ads-control-signal="account-id"]');
  const explicitName = cleanText(root.querySelector('[data-ads-control-signal="account-name"]'), 120);
  const normalizedExplicitId = normalizeMetaAccountId(explicitId?.getAttribute('data-account-id') || cleanText(explicitId, 40));
  if (normalizedExplicitId || explicitName) return { id: normalizedExplicitId, name: explicitName };

  const elements = root.querySelectorAll?.('span, div, p, h1, h2, h3, h4, b, strong') ?? [];
  for (const element of elements) {
    const text = element.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (!text || text.length > 120) continue;
    // Pattern: "AdVantage Ads (916464134308495)"
    const match = /^([^(]+?)\s*\((\d{8,32})\)$/.exec(text);
    if (match) {
      const id = normalizeMetaAccountId(match[2]);
      const name = match[1].trim();
      if (id) return { id, name };
    }
  }
  for (const element of elements) {
    const text = element.textContent?.replace(/\s+/g, ' ').trim() || '';
    const match = /(?:account\s*(?:id|#)?\s*[:\s]*)?(\d{8,32})/i.exec(text);
    if (match && match[1]) {
      const id = normalizeMetaAccountId(match[1]);
      if (id) return { id, name: 'Meta Ad Account' };
    }
  }
  return {};
}

export function parseInrAmount(text?: string): { amountText: string; amountMinor: string } | undefined {
  if (!text) return undefined;
  // Normalize whitespace, non-breaking spaces, zero-width spaces
  const cleaned = text.replace(/[\s\u00A0\u200B-\u200D\uFEFF]+/g, ' ').trim();
  if (!cleaned) return undefined;

  // 1. Explicit currency prefix or suffix: ₹ 60,182.36, INR 60,182.36, Rs. 60,182.36, 60,182.36 INR
  const explicitMatch = /(?:₹|INR|Rs\.?|\u20B9)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?)/i.exec(cleaned)
    || /([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?)\s*(?:INR|₹|\u20B9)/i.exec(cleaned);

  if (explicitMatch) {
    const rawNum = explicitMatch[1].replace(/,/g, '');
    const parts = /^(\d+)(?:\.(\d{1,2}))?$/.exec(rawNum);
    if (parts) {
      const minor = BigInt(parts[1]) * 100n + BigInt((parts[2] ?? '').padEnd(2, '0').slice(0, 2) || '0');
      if (minor > 0n) {
        const formatted = `₹${Number(parts[1]).toLocaleString('en-IN')}${parts[2] ? '.' + parts[2].padEnd(2, '0').slice(0, 2) : '.00'}`;
        return { amountText: formatted, amountMinor: minor.toString() };
      }
    }
  }

  // 2. Standalone formatted amount: 60,182.36 or 5,000.00 or 1,234.50
  const standaloneMatch = /(?:^|\s)([0-9]{1,3}(?:,[0-9]{2,3})+(?:\.\d{1,2})?|[0-9]{2,8}\.\d{2})(?:\s|$)/.exec(cleaned);
  if (standaloneMatch) {
    const rawNum = standaloneMatch[1].replace(/,/g, '');
    const parts = /^(\d+)(?:\.(\d{1,2}))?$/.exec(rawNum);
    if (parts) {
      const minor = BigInt(parts[1]) * 100n + BigInt((parts[2] ?? '').padEnd(2, '0').slice(0, 2) || '0');
      if (minor > 0n && minor < 100000000000n) {
        const formatted = `₹${Number(parts[1]).toLocaleString('en-IN')}${parts[2] ? '.' + parts[2].padEnd(2, '0').slice(0, 2) : '.00'}`;
        return { amountText: formatted, amountMinor: minor.toString() };
      }
    }
  }

  return undefined;
}

function extractModalAmount(modal: ReadableElement): { amountText: string; amountMinor: string; currencyCode: 'INR' } | undefined {
  const explicitAmount = cleanText(modal.querySelector('[data-ads-control-signal="amount"]'), 80);
  const explicitParsed = parseInrAmount(explicitAmount);
  if (explicitParsed) return { ...explicitParsed, currencyCode: 'INR' };

  const candidates = modal.querySelectorAll?.('h1, h2, h3, h4, div, span, b, strong, p') ?? [];

  // Strategy 1: Look for elements with explicit ₹ or INR
  for (const el of candidates) {
    const text = el.textContent?.trim() || '';
    if (!text || text.length > 50) continue;
    // Skip account ID strings or dates/times
    if (/^\d{10,}$/.test(text) || /\b202\d\b/.test(text) || /\b\d{1,2}:\d{2}\b/.test(text)) continue;

    if (text.includes('₹') || /INR|Rs/i.test(text)) {
      const parsed = parseInrAmount(text);
      if (parsed) return { ...parsed, currencyCode: 'INR' };
    }
  }

  // Strategy 2: Look for formatted standalone numbers (e.g. 60,182.36) in short text nodes
  for (const el of candidates) {
    const text = el.textContent?.trim() || '';
    if (!text || text.length > 30 || text.length < 3) continue;
    if (/^\d{10,}$/.test(text) || /\b202\d\b/.test(text) || /\b\d{1,2}:\d{2}\b/.test(text)) continue;

    const parsed = parseInrAmount(text);
    if (parsed) return { ...parsed, currencyCode: 'INR' };
  }

  // Strategy 3: Fallback across entire modal text
  const fullText = cleanText(modal, 20000) || '';
  const parsed = parseInrAmount(fullText);
  if (parsed) return { ...parsed, currencyCode: 'INR' };

  return undefined;
}

function stateFor(dialog: ReadableElement, rules: DetectorRules): DialogState {
  if (first(dialog, rules.selectors.success)) return 'success';
  if (first(dialog, rules.selectors.failure)) return 'failure';
  if (first(dialog, rules.selectors.expired)) return 'expired';
  if (first(dialog, rules.selectors.processing)) return 'processing';

  const text = dialog.textContent?.replace(/\s+/g, ' ').toLowerCase() ?? '';

  if (text.includes('payment successful') || text.includes('funds added') || text.includes('transaction complete') || text.includes('payment complete')) {
    return 'success';
  }
  if (text.includes('payment failed') || text.includes('transaction failed') || text.includes('declined')) {
    return 'failure';
  }
  if (text.includes('qr code expired') || text.includes('payment request expired') || text.includes('session expired')) {
    return 'expired';
  }

  // Active QR indicators
  const hasQrElement = Boolean(first(dialog, rules.selectors.qr));
  const hasUpiText = text.includes('complete payment') || text.includes('payment request expires') || text.includes('upi')
    || text.includes('phonepe') || text.includes('googlepay') || text.includes('paytm') || text.includes('bhim')
    || text.includes('scan qr') || text.includes('scan the qr') || text.includes('all supported apps');

  if (hasQrElement || hasUpiText) return 'qr-active';

  return 'unknown';
}

function extractPaymentMethod(dialog: ReadableElement): string {
  const text = dialog.textContent?.toLowerCase() || '';
  if (text.includes('phonepe') || text.includes('googlepay') || text.includes('paytm') || text.includes('bhim') || text.includes('upi') || text.includes('scan qr')) {
    return 'UPI (Dynamic QR)';
  }

  const checkedRadios = Array.from(dialog.querySelectorAll?.('input[type="radio"]:checked, [role="radio"][aria-checked="true"], [aria-selected="true"]') ?? []);
  for (const radio of checkedRadios) {
    const parentText = radio.parentElement?.textContent?.replace(/\s+/g, ' ').trim() || '';
    if (parentText) return parentText.slice(0, 40);
  }

  if (text.includes('visa') || text.includes('mastercard') || text.includes('debit or credit card')) {
    return 'Credit / Debit Card';
  }
  if (text.includes('net banking') || text.includes('netbanking')) {
    return 'Net Banking';
  }

  return 'UPI';
}

export function parseDomSignals(documentLike: ReadableDocument, rules: DetectorRules): DomSignals {
  if (rules.disabled) return { qrVisible: false, dialogState: 'unknown', successVisible: false, signalNames: [] };
  const dialog = findModalDialog(documentLike);
  if (!dialog) return { qrVisible: false, dialogState: 'unknown', successVisible: false, signalNames: [] };

  const dialogState = stateFor(dialog, rules);
  const qrVisible = Boolean(first(dialog, rules.selectors.qr)) || dialogState === 'qr-active';
  const accountInfo = extractModalAccount(dialog);
  const amount = extractModalAmount(dialog);
  const paymentMethod = extractPaymentMethod(dialog);

  const signalNames = [
    'payment-dialog',
    ...(accountInfo.id ? ['visible-account-id'] : []),
    ...(accountInfo.name ? ['visible-account-name'] : []),
    ...(amount ? ['inr-amount'] : []),
    ...(qrVisible ? ['qr-present'] : []),
    ...(dialogState !== 'unknown' && dialogState !== 'qr-active' ? [`state-${dialogState}`] : [])
  ];

  return {
    ...(accountInfo.id ? { visibleAccountId: accountInfo.id } : {}),
    ...(accountInfo.name ? { visibleAccountName: accountInfo.name } : {}),
    ...(amount ? amount : {}),
    paymentMethod,
    qrVisible,
    dialogState,
    successVisible: dialogState === 'success',
    signalNames
  };
}
