import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { assertLedgerBalanced, toPaise, fromPaise } from '@ads-control/shared';

describe('Ledger Invariant Unit Tests', () => {
  it('correctly validates balanced double-entry transactions', () => {
    const debits = [toPaise(50000), toPaise(5000)];
    const credits = [toPaise(55000)];
    assert.doesNotThrow(() => assertLedgerBalanced(debits, credits));
  });

  it('rejects unbalanced journal entries', () => {
    const debits = [toPaise(50000)];
    const credits = [toPaise(40000)];
    assert.throws(() => assertLedgerBalanced(debits, credits), /Ledger imbalance detected/);
  });

  it('correctly handles zero decimal point rounding errors with BigInt paise', () => {
    const amount = 1234.56;
    const paise = toPaise(amount);
    assert.strictEqual(paise, 123456n);
    assert.strictEqual(fromPaise(paise), 1234.56);
  });
});
