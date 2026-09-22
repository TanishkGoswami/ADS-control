import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { evaluateDetection, isDetectionEvidence } from '../src/detector/evaluate.ts';
import { extractUrlAccountId, isApprovedBillingUrl } from '../src/detector/url.ts';
import type { ReadableDocument, ReadableElement } from '../src/detector/types.ts';

const fixture = (name: string): string => readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');

class FixtureElement implements ReadableElement {
  private readonly html: string;
  constructor(html: string) { this.html = html; }
  get textContent(): string { return this.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  getAttribute(name: string): string | null {
    const match = new RegExp(`${name}="([^"]*)"`).exec(this.html);
    return match?.[1] ?? null;
  }
  matches(selector: string): boolean { return Boolean(select(this.html, selector)); }
  querySelector(selector: string): ReadableElement | null { return select(this.html, selector); }
}

function select(html: string, selector: string): FixtureElement | null {
  const attribute = /^\[([^=\]]+)(?:="([^"]+)")?\]$/.exec(selector);
  if (!attribute) return null;
  const [, name, value] = attribute;
  const valuePattern = value ? `\\s*=\\s*"${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"` : '(?:\\s*=\\s*"[^"]*")?';
  const open = new RegExp(`<([a-z][\\w-]*)[^>]*\\s${name}${valuePattern}[^>]*>`, 'i').exec(html);
  if (!open || open.index === undefined) return null;
  const start = open.index;
  const close = new RegExp(`</${open[1]}>`, 'i').exec(html.slice(start + open[0].length));
  const end = close ? start + open[0].length + close.index + close[0].length : start + open[0].length;
  return new FixtureElement(html.slice(start, end));
}

const documentFor = (html: string): ReadableDocument => ({ querySelector: (selector) => select(html, selector) });

test('URL parser accepts approved Meta billing routes and normalizes act', () => {
  const url = 'https://business.facebook.com/billing_hub/payment_settings?business_id=55&act=act_123456789012345';
  assert.equal(isApprovedBillingUrl(url), true);
  assert.equal(extractUrlAccountId(url), '123456789012345');
  assert.equal(isApprovedBillingUrl('https://example.com/billing?act=123456789012345'), false);
  const liveRoute = 'https://adsmanager.facebook.com/adsmanager/billing_hub/accounts/details?asset_id=25763768159980859&payment_account_id=25763768159980859';
  assert.equal(isApprovedBillingUrl(liveRoute), true);
  assert.equal(extractUrlAccountId(liveRoute), '25763768159980859');
});

test('no dialog produces no detection', () => {
  const result = evaluateDetection('https://business.facebook.com/billing?act=123456789012345', documentFor(fixture('no-payment.html')));
  assert.equal(result, null);
});

test('equal URL and visible account produce high-confidence sanitized evidence', () => {
  const result = evaluateDetection('https://business.facebook.com/billing?act=123456789012345', documentFor(fixture('qr-active.html')));
  assert.ok(result);
  assert.equal(result.confidence, 'high');
  assert.equal(result.blocked, false);
  assert.equal(result.amountMinor, '12500050');
  assert.equal(result.qrVisible, true);
  assert.equal(isDetectionEvidence(result), true);
  assert.deepEqual(Object.keys(result).sort(), [
    'amountMinor', 'amountText', 'paymentMethod', 'blocked', 'confidence', 'currencyCode', 'detectorVersion', 'dialogState',
    'pageUrl', 'qrVisible', 'requiresConfirmation', 'signalNames', 'snapshotHash', 'successVisible',
    'urlAccountId', 'visibleAccountId', 'visibleAccountName'
  ].sort());
  assert.equal(JSON.stringify(result).includes('<section'), false);
  assert.equal(JSON.stringify(result).includes('data:image'), false);
  assert.equal(JSON.stringify(result).includes('access_token'), false);
});

test('URL and visible account mismatch blocks mapping', () => {
  const result = evaluateDetection('https://www.facebook.com/ads/manager/billing?act=123456789012345', documentFor(fixture('account-mismatch.html')));
  assert.ok(result);
  assert.equal(result.confidence, 'blocked');
  assert.equal(result.blocked, true);
  assert.equal(result.requiresConfirmation, true);
});

test('evidence validator rejects extra sensitive fields', () => {
  const result = evaluateDetection('https://business.facebook.com/billing?act=123456789012345', documentFor(fixture('qr-active.html')));
  assert.ok(result);
  assert.equal(isDetectionEvidence({ ...result, rawHtml: '<body>private</body>' }), false);
  assert.equal(isDetectionEvidence({ ...result, qrPayload: 'upi://pay?secret=1' }), false);
});

test('evidence validator accepts the sanitized payment method field', () => {
  const result = evaluateDetection('https://business.facebook.com/billing?act=123456789012345', documentFor(fixture('qr-active.html')));
  assert.ok(result);
  assert.equal(result.paymentMethod, 'UPI');
  assert.equal(isDetectionEvidence(result), true);
});
