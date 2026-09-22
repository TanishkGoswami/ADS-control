const ACCOUNT_KEYS = ['act', 'account_id', 'ad_account_id', 'asset_id', 'payment_account_id', 'selected_account_id'] as const;
const APPROVED_HOST_SUFFIXES = ['facebook.com', 'meta.com'];

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
    // Check path for act_123456789 or /123456789/
    const pathMatch = /(?:act[_-]|account[_-])?(\d{8,32})/i.exec(url.pathname);
    if (pathMatch && pathMatch[1]) {
      const candidate = normalizeMetaAccountId(pathMatch[1]);
      if (candidate) return candidate;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function isApprovedBillingUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') return false;
    const hostname = url.hostname.toLowerCase();
    const isMetaHost = APPROVED_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
    if (!isMetaHost) return false;

    // Adsmanager and Business subdomains can trigger payment dialogs from any screen
    if (hostname.includes('adsmanager') || hostname.includes('business')) return true;

    // For other Facebook domains, check advertising/billing paths or presence of account parameter
    const path = url.pathname.toLowerCase();
    const isBillingOrAdsPath = ['/billing', '/billing_hub', '/payments', '/payment_settings', '/ads', '/adsmanager', '/manage'].some((segment) => path.includes(segment));
    const hasAccountParam = ACCOUNT_KEYS.some((k) => Boolean(url.searchParams.get(k)));

    return isBillingOrAdsPath || hasAccountParam;
  } catch {
    return false;
  }
}
