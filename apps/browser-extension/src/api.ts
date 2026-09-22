export interface DeviceSession { token: string; deviceId: string; expiresAt: string; organizationId: string; }
export interface FundingAccount { id: string; metaAdAccountId: string; name: string; internalAlias?: string; currencyCode: string; normalizedStatus: string; }
export interface FundingSource { id: string; referenceCode?: string; purpose?: string; amountMinor?: string; availableAmountMinor?: string; status: string; targetAdAccountId?: string; fundLotId?: string; locationAdAccountId?: string; fundLot?: { locationAdAccountId?: string }; }

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export class ExtensionApi {
  constructor(private readonly baseUrl: string, private readonly getSession: () => Promise<DeviceSession | undefined>) {}

  async request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
    const session = authenticated ? await this.getSession() : undefined;
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.token}` } : {}), ...init.headers }
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string };
      throw new ApiError(response.status, body.message || `Ads Control API returned ${response.status}`);
    }
    return response.json() as Promise<T>;
  }
}
