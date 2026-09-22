import { ApiError, ExtensionApi, type DeviceSession, type FundingAccount, type FundingSource } from './api.ts';
import { isApprovedBillingUrl, normalizeMetaAccountId } from './detector/url.ts';
import { DurableEventQueue, type QueueEnvelope } from './queue.ts';

const API_BASE = 'http://127.0.0.1:4000/api/v1';
const HEARTBEAT_ALARM = 'ads-control-heartbeat';
const RETRY_ALARM = 'ads-control-event-retry';
const storage = { get: (key: string) => chrome.storage.local.get(key), set: (value: Record<string, unknown>) => chrome.storage.local.set(value) };
const getSession = async () => (await chrome.storage.local.get('deviceSession')).deviceSession as DeviceSession | undefined;
const api = new ExtensionApi(API_BASE, getSession);
const queue = new DurableEventQueue(storage);

function approved(raw: string) {
  return isApprovedBillingUrl(raw);
}

async function claim(code: string, deviceName: string) {
  const session = await api.request<DeviceSession>('/auth/extension/claim', {
    method: 'POST',
    body: JSON.stringify({ code: code.trim(), deviceName: deviceName.trim(), extensionVersion: chrome.runtime.getManifest().version })
  }, false);
  await chrome.storage.local.set({ deviceSession: session });
  await heartbeat();
  await injectExistingMetaTabs();
  return { paired: true, deviceId: session.deviceId };
}

async function heartbeat() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  try {
    const result = await api.request<{ deviceId: string; status: string; lastSeenAt: string; expiresAt: string }>('/auth/extension/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ extensionVersion: chrome.runtime.getManifest().version }),
      signal: controller.signal
    });
    const session = await getSession();
    if (session) await chrome.storage.local.set({ deviceSession: { ...session, expiresAt: result.expiresAt }, lastHeartbeatAt: result.lastSeenAt });
    await drain();
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function pairingStatus(quick = false) {
  const session = await getSession();
  if (!session) return { paired: false, status: 'NOT_PAIRED' };
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await chrome.storage.local.remove(['deviceSession', 'lastHeartbeatAt']);
    return { paired: false, status: 'EXPIRED', error: 'Device session expired. Pair this browser again.' };
  }
  if (quick) {
    return { paired: true, status: 'CONNECTED', online: true, deviceId: session.deviceId, expiresAt: session.expiresAt };
  }
  try {
    const result = await heartbeat();
    return { paired: true, status: 'CONNECTED', online: true, deviceId: session.deviceId, expiresAt: result.expiresAt };
  } catch (error: any) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      await chrome.storage.local.remove(['deviceSession', 'lastHeartbeatAt']);
      return { paired: false, status: 'EXPIRED', error: 'Device session expired or was revoked. Pair again.' };
    }
    return { paired: true, status: 'OFFLINE', online: false, deviceId: session.deviceId, expiresAt: session.expiresAt, error: 'ADS Control API is temporarily unreachable.' };
  }
}

async function disconnect() {
  const session = await getSession();
  if (session) await api.request(`/auth/extension/devices/${session.deviceId}`, { method: 'DELETE' }).catch(() => undefined);
  await chrome.storage.local.clear();
  return { paired: false, status: 'DISCONNECTED' };
}

async function context(evidence: any) {
  const session = await getSession();
  if (!session) return { paired: false };
  try {
    const accounts = await api.request<FundingAccount[]>('/meta-funding/accounts');

    const rawMetaId = evidence?.visibleAccountId || evidence?.urlAccountId;
    const normMetaId = normalizeMetaAccountId(rawMetaId) || '';

    let matches = accounts.filter((a) => {
      const aNorm = normalizeMetaAccountId(a.metaAdAccountId) || '';
      return (normMetaId && aNorm === normMetaId) || a.metaAdAccountId === rawMetaId;
    });

    if (matches.length === 0 && evidence?.visibleAccountName) {
      const vName = evidence.visibleAccountName.trim().toLowerCase();
      matches = accounts.filter((a) => a.name.trim().toLowerCase() === vName || (a.internalAlias && a.internalAlias.trim().toLowerCase() === vName));
    }

    const exactAccountId = matches.length > 0 ? matches[0].id : undefined;
    const [lots, requests] = exactAccountId
      ? await Promise.all([
          api.request<FundingSource[]>(`/meta-funding/eligibility?accountId=${encodeURIComponent(exactAccountId)}`),
          api.request<FundingSource[]>('/meta-funding/requests')
        ])
      : [[], []];

    return {
      paired: true,
      accounts: matches.length > 0 ? matches : accounts,
      lots,
      requests: requests.filter((request) =>
        ['APPROVED', 'READY'].includes(request.status)
        && (!request.targetAdAccountId || request.targetAdAccountId === exactAccountId)
        && (!request.fundLot?.locationAdAccountId || request.fundLot.locationAdAccountId === exactAccountId)
      ),
      exactAccountId
    };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      await chrome.storage.local.remove('deviceSession');
      return { paired: false, error: error.message };
    }
    return { paired: true, error: error instanceof Error ? error.message : 'Context fetch failed' };
  }
}

async function mapPayment(message: any) {
  const e = message.evidence;
  if (e.blocked) throw new Error('Account mismatch must be resolved before mapping');
  const idempotencyKey = `map:${e.snapshotHash}:${message.selectedAdAccountId}:${message.sourceId}`;
  const body = {
    idempotencyKey,
    detectedMetaAccountId: e.urlAccountId,
    visibleMetaAccountId: e.visibleAccountId,
    selectedAdAccountId: message.selectedAdAccountId,
    detectedAmountMinor: e.amountMinor,
    selectedAmountMinor: e.amountMinor,
    currencyCode: 'INR',
    detectorVersion: e.detectorVersion,
    fundingSourceType: message.sourceType,
    ...(message.sourceType === 'FUNDING_REQUEST' ? { fundingRequestId: message.sourceId } : { fundLotId: message.sourceId })
  };
  const session = await api.request<any>('/meta-funding/sessions/map', { method: 'POST', body: JSON.stringify(body) });
  await chrome.storage.local.set({ [`activeSession:${message.tabId}`]: { id: session.id, evidenceHash: e.snapshotHash } });
  return session;
}

async function observe(message: any, tabId: number) {
  const key = `activeSession:${tabId}`;
  const active = (await chrome.storage.local.get(key))[key] as { id: string } | undefined;
  if (!active || !message.evidence.successVisible) return { accepted: true };
  const id = `observe:${active.id}:${message.evidence.snapshotHash}`;
  await queue.enqueue({
    id,
    sessionId: active.id,
    idempotencyKey: id,
    payload: {
      observedAmountMinor: message.evidence.amountMinor,
      visibleMetaAccountId: message.evidence.visibleAccountId,
      detectorVersion: message.evidence.detectorVersion
    }
  });
  await drain();
  return { accepted: true, queued: true };
}

async function sendEvent(item: QueueEnvelope) {
  await api.request(`/meta-funding/sessions/${item.sessionId}/observe-success`, {
    method: 'POST',
    body: JSON.stringify({ idempotencyKey: item.idempotencyKey, ...item.payload })
  });
}
async function drain() {
  return queue.drain(sendEvent);
}

async function injectExistingMetaTabs() {
  const tabs = await chrome.tabs.query({
    url: ['https://*.facebook.com/*', 'https://*.meta.com/*', 'https://facebook.com/*', 'https://business.facebook.com/*', 'https://adsmanager.facebook.com/*']
  });
  await Promise.all(tabs.filter((tab) => tab.id !== undefined).map((tab) => ensureContentScript(tab.id!, tab.url)));
}

async function ensureContentScript(tabId: number, url?: string) {
  if (!url || !approved(url)) return;
  const alive = await chrome.tabs.sendMessage(tabId, { type: 'ADS_CONTROL_PING' }).then(() => true).catch(() => false);
  if (!alive) await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }).catch(() => undefined);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: 15 });
  chrome.alarms.create(RETRY_ALARM, { periodInMinutes: 1 });
  void drain();
  void injectExistingMetaTabs();
});
chrome.runtime.onStartup.addListener(() => {
  void drain();
  void injectExistingMetaTabs();
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) void ensureContentScript(tabId, tab.url || changeInfo.url);
});
chrome.tabs.onActivated.addListener(({ tabId }) => {
  void chrome.tabs.get(tabId).then((tab) => ensureContentScript(tabId, tab.url)).catch(() => undefined);
});
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === HEARTBEAT_ALARM) void pairingStatus();
  if (a.name === RETRY_ALARM) void drain();
});

chrome.runtime.onMessage.addListener((m, s, reply) => {
  const tabId = s.tab?.id;
  const senderUrl = s.url || s.tab?.url || '';
  const isApproved = approved(senderUrl);
  let op: Promise<unknown>;

  if (m?.type === 'PAIR') op = claim(m.code, m.deviceName);
  else if (m?.type === 'HEARTBEAT') op = heartbeat();
  else if (m?.type === 'GET_CONTEXT') {
    if (!isApproved && !m?.bypassUrlCheck) {
      op = Promise.reject(new Error('Unauthorized origin for payment context'));
    } else {
      op = context(m.evidence);
    }
  } else if (m?.type === 'MAP_TOPUP' && tabId !== undefined) {
    op = mapPayment({ ...m, tabId });
  } else if (m?.type === 'META_TOPUP_DETECTION' && tabId !== undefined) {
    op = observe(m, tabId);
  } else if (m?.type === 'PAIRING_STATUS') {
    op = pairingStatus(Boolean(m?.quick));
  } else if (m?.type === 'DISCONNECT') {
    op = disconnect();
  } else if (m?.type === 'SET_SETTINGS') {
    op = chrome.storage.local.set(m.settings).then(() => ({ success: true }));
  } else {
    op = Promise.reject(new Error('Unsupported message'));
  }

  op.then(reply).catch((error) => reply({ error: error instanceof Error ? error.message : 'Request failed' }));
  return true;
});
