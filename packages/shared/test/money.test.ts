import test from 'node:test';
import assert from 'node:assert';
import { toPaise, fromPaise, formatINR, assertLedgerBalanced } from '../src/utils/money.js';

test('Paise Conversion - converts rupees to exact BigInt minor units', () => {
  assert.strictEqual(toPaise(100), 10000n);
  assert.strictEqual(toPaise(1250.50), 125050n);
  assert.strictEqual(toPaise('99.99'), 9999n);
});

test('Paise Conversion - converts minor units back to floating currency display', () => {
  assert.strictEqual(fromPaise(10000n), 100);
  assert.strictEqual(fromPaise(125050n), 1250.50);
});

test('Format INR - formats numbers with Indian currency notation', () => {
  assert.strictEqual(formatINR(10000000n), '₹1,00,000.00');
  assert.strictEqual(formatINR(50000n), '₹500.00');
});

test('Double-Entry Balance Invariant - verifies total debit equals total credit', () => {
  const debits = [50000n, 25000n];
  const credits = [75000n];
  assert.strictEqual(assertLedgerBalanced(debits, credits), true);
});

test('Double-Entry Balance Invariant - throws on unbalanced debits and credits', () => {
  const debits = [50000n];
  const credits = [40000n];
  assert.throws(() => {
    assertLedgerBalanced(debits, credits);
  }, /Ledger imbalance detected/);
});
