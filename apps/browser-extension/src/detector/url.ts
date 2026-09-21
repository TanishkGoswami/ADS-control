const ACCOUNT_KEYS = ['act', 'account_id', 'ad_account_id', 'asset_id', 'payment_account_id'] as const;
const APPROVED_HOSTS = new Set(['www.facebook.com', 'business.facebook.com', 'adsmanager.facebook.com']);
const BILLING_SEGMENTS = ['/billing', '/billing_hub', '/payments', '/payment_settings', '/ads/manager/billing'];

export function normalizeMetaAccountId(value?: string | null): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/^act_/i, '').replace(/\D/g, '');
  return /^\d{5,32}$/.test(digits) ? digits : undefined;
}

export function extractUrlAccountId(rawUrl: string): string | undefined {
  try {
    const url = new URL(rawUrl);
    for (const key of ACCOUNT_KEYS) {
      const accountId = normalizeMetaAccountId(url.searchParams.get(key));
      if (accountId) return accountId;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function isApprovedBillingUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' || !APPROVED_HOSTS.has(url.hostname)) return false;
    const path = url.pathname.toLowerCase();
    return BILLING_SEGMENTS.some((segment) => path.includes(segment));
  } catch {
    return false;
  }
}
