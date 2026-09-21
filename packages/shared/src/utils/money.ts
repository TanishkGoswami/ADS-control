/**
 * Money utilities using BigInt minor units (paise) to guarantee zero float precision errors.
 * 1 INR = 100 paise.
 */

export function toPaise(rupees: number | string): bigint {
  if (typeof rupees === 'string') {
    const parsed = parseFloat(rupees);
    if (isNaN(parsed)) throw new Error(`Invalid rupee amount string: "${rupees}"`);
    return BigInt(Math.round(parsed * 100));
  }
  if (isNaN(rupees)) throw new Error('Invalid rupee number: NaN');
  return BigInt(Math.round(rupees * 100));
}

export function fromPaise(paise: bigint | number | string): number {
  const p = typeof paise === 'bigint' ? Number(paise) : Number(paise);
  return p / 100;
}

const CURRENCY_CONFIG: Record<string, { locale: string; symbol: string }> = {
  INR: { locale: 'en-IN', symbol: '₹' },
  USD: { locale: 'en-US', symbol: '$' },
  EUR: { locale: 'de-DE', symbol: '€' },
  GBP: { locale: 'en-GB', symbol: '£' },
  AED: { locale: 'en-AE', symbol: 'AED ' },
  CAD: { locale: 'en-CA', symbol: 'CA$' },
  AUD: { locale: 'en-AU', symbol: 'A$' },
  SGD: { locale: 'en-SG', symbol: 'S$' },
  JPY: { locale: 'ja-JP', symbol: '¥' }
};

export function formatCurrency(
  amountMinor: bigint | number | string,
  currencyCode: string = 'INR',
  includeCode: boolean = false
): string {
  const code = (currencyCode || 'INR').toUpperCase();
  const major = fromPaise(amountMinor);
  const cfg = CURRENCY_CONFIG[code] || { locale: 'en-US', symbol: `${code} ` };

  const formatted = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: code === 'JPY' ? 0 : 2,
    maximumFractionDigits: code === 'JPY' ? 0 : 2
  }).format(major);

  const formattedWithSymbol = `${cfg.symbol}${formatted}`;
  return includeCode ? `${formattedWithSymbol} ${code}` : formattedWithSymbol;
}

export function formatINR(paise: bigint | number | string, includeSymbol: boolean = true): string {
  const amountInRupees = fromPaise(paise);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountInRupees);

  return includeSymbol ? `₹${formatted}` : formatted;
}

export function assertLedgerBalanced(debits: bigint[], credits: bigint[]): boolean {
  const totalDebit = debits.reduce((acc, d) => acc + d, 0n);
  const totalCredit = credits.reduce((acc, c) => acc + c, 0n);
  if (totalDebit !== totalCredit) {
    throw new Error(`Ledger imbalance detected: Total Debit (${totalDebit}) != Total Credit (${totalCredit})`);
  }
  return true;
}

/**
 * Formats a timestamp as DD/MM/YYYY, hh:mm:ss A (Date Month Year)
 */
export function formatDateTime(
  dateInput: Date | string | number | null | undefined,
  options: { includeTime?: boolean; includeSeconds?: boolean } = { includeTime: true, includeSeconds: true }
): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (options.includeTime === false) {
    return `${day}/${month}/${year}`;
  }

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours);

  if (options.includeSeconds !== false) {
    return `${day}/${month}/${year}, ${strHours}:${minutes}:${seconds} ${ampm}`;
  }
  return `${day}/${month}/${year}, ${strHours}:${minutes} ${ampm}`;
}

export function formatDateDMY(dateInput: Date | string | number | null | undefined): string {
  return formatDateTime(dateInput, { includeTime: false });
}

