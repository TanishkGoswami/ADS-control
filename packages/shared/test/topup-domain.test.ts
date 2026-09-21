import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FinancialReviewState,
  TopupConfidence,
  TopupOperationalState
} from '../src/enums/index.js';
import { TopupDetectionSchema } from '../src/schemas/index.js';
import {
  buildTopupFingerprintInput,
  canTransitionTopup,
  evaluateAccountEvidence,
  normalizeMetaAccountId,
  parseInrAmountToMinor
} from '../src/topup/domain.js';

test('INR parser converts formatted rupees to exact paise without floating point', () => {
  assert.equal(parseInrAmountToMinor('₹1,23,456.78', 'INR'), '12345678');
  assert.equal(parseInrAmountToMinor('100', 'INR'), '10000');
  assert.equal(parseInrAmountToMinor('0.05', 'INR'), '5');
});

test('INR parser rejects unsupported currency and ambiguous amounts', () => {
  assert.throws(() => parseInrAmountToMinor('$100.00', 'USD'), /INR/);
  assert.throws(() => parseInrAmountToMinor('1.234', 'INR'), /amount/);
  assert.throws(() => parseInrAmountToMinor('0', 'INR'), /greater than zero/);
});

test('Meta account IDs normalize to digits while evidence remains independent', () => {
  assert.equal(normalizeMetaAccountId('act_1430414528592618'), '1430414528592618');
  assert.equal(normalizeMetaAccountId(' 1430-4145-2859-2618 '), '1430414528592618');
  assert.equal(normalizeMetaAccountId('not-an-account'), undefined);

  assert.deepEqual(
    evaluateAccountEvidence({
      urlAccountId: 'act_1430414528592618',
      visibleAccountId: '1430414528592618'
    }),
    {
      confidence: TopupConfidence.HIGH,
      blocked: false,
      requiresConfirmation: false,
      urlAccountId: '1430414528592618',
      visibleAccountId: '1430414528592618'
    }
  );
});

test('account mismatch blocks mapping and name-only evidence requires confirmation', () => {
  const mismatch = evaluateAccountEvidence({
    urlAccountId: 'act_111111111111111',
    visibleAccountId: '222222222222222'
  });
  assert.equal(mismatch.confidence, TopupConfidence.BLOCKED);
  assert.equal(mismatch.blocked, true);

  const nameOnly = evaluateAccountEvidence({ visibleAccountName: 'Ad Account 2 (MBU)' });
  assert.equal(nameOnly.confidence, TopupConfidence.MEDIUM);
  assert.equal(nameOnly.requiresConfirmation, true);
});

test('operational transitions remain separate from financial review', () => {
  assert.equal(canTransitionTopup(TopupOperationalState.DETECTED, TopupOperationalState.MAPPED), true);
  assert.equal(canTransitionTopup(TopupOperationalState.MAPPED, TopupOperationalState.UI_OBSERVED), true);
  assert.equal(canTransitionTopup(TopupOperationalState.UI_OBSERVED, TopupOperationalState.REVIEW_REQUIRED), true);
  assert.equal(canTransitionTopup(TopupOperationalState.CANCELLED, TopupOperationalState.MAPPED), false);
  assert.deepEqual(Object.values(FinancialReviewState), ['UNVERIFIED', 'CONFIRMED', 'REJECTED']);
});

test('top-up detection schema rejects unknown DOM-derived fields', () => {
  const valid = {
    pageUrl: 'https://business.facebook.com/billing_hub/payment_activity?act=1430414528592618',
    urlAccountId: '1430414528592618',
    visibleAccountName: 'Ad Account 2 (MBU)',
    amountText: '₹500.00',
    currencyCode: 'INR',
    qrVisible: true,
    detectorVersion: '1.0.0'
  };
  assert.equal(TopupDetectionSchema.parse(valid).currencyCode, 'INR');
  assert.throws(() => TopupDetectionSchema.parse({ ...valid, rawHtml: '<body>secret</body>' }));
});

test('canonical fingerprint input is key-order stable and semantic changes differ', () => {
  const first = buildTopupFingerprintInput({
    organizationId: 'org-1',
    amountMinor: '50000',
    currencyCode: 'INR',
    selectedAdAccountId: 'account-1',
    fundingSource: { type: 'FUND_LOT', fundLotId: 'lot-1' }
  });
  const reordered = buildTopupFingerprintInput({
    fundingSource: { fundLotId: 'lot-1', type: 'FUND_LOT' },
    selectedAdAccountId: 'account-1',
    currencyCode: 'INR',
    amountMinor: '50000',
    organizationId: 'org-1'
  });
  const changed = buildTopupFingerprintInput({
    organizationId: 'org-1',
    amountMinor: '50001',
    currencyCode: 'INR',
    selectedAdAccountId: 'account-1',
    fundingSource: { type: 'FUND_LOT', fundLotId: 'lot-1' }
  });

  assert.equal(first, reordered);
  assert.notEqual(first, changed);
  assert.equal(first, '{"amountMinor":"50000","currencyCode":"INR","fundingSource":{"fundLotId":"lot-1","type":"FUND_LOT"},"organizationId":"org-1","selectedAdAccountId":"account-1"}');
});
