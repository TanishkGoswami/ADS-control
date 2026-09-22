import styles from './overlay/styles.css?inline';
import { evaluateDetection, isDetectionEvidence } from './detector/evaluate.ts';
import { isApprovedBillingUrl } from './detector/url.ts';
import { renderOverlay } from './overlay/Overlay.tsx';

const HOST_ID = 'ads-control-companion-root';
const OBSERVER_DEBOUNCE_MS = 150;
let observer: MutationObserver | undefined;
let timer: number | undefined;
let lastSnapshot = '';
let lastUrl = location.href;
let dismissedForCurrentPayment = false;

async function isAutoDetectEnabled(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get('autoDetectQr');
    return result.autoDetectQr !== false;
  } catch {
    return true;
  }
}

function removeAssistant(): void {
  observer?.disconnect();
  observer = undefined;
  document.getElementById(HOST_ID)?.remove();
  lastSnapshot = '';
}

function overlayContainer(): HTMLElement {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    host.setAttribute('aria-live', 'polite');
    document.documentElement.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = styles;
    const panel = document.createElement('aside');
    panel.className = 'ac-panel';
    panel.setAttribute('aria-label', 'Ads Control payment assistant');
    shadow.append(style, panel);
  }
  return host.shadowRoot!.querySelector<HTMLElement>('.ac-panel')!;
}

async function inspect(force = false): Promise<any> {
  if (!isApprovedBillingUrl(location.href)) {
    removeAssistant();
    return { visible: false, error: 'Current tab is not a Meta Ads Manager / Billing page.' };
  }

  if (!force) {
    const autoDetect = await isAutoDetectEnabled();
    if (!autoDetect) return { visible: false, autoDetectDisabled: true };
  }

  const evidence = evaluateDetection(location.href, document);
  if (!evidence) {
    if (!force) {
      document.getElementById(HOST_ID)?.remove();
      lastSnapshot = '';
      dismissedForCurrentPayment = false;
    }
    return {
      visible: false,
      error: 'Payment QR screen not detected. Open Meta UPI / Add Funds modal and try again.'
    };
  }

  if (dismissedForCurrentPayment && !force) return { visible: false, dismissed: true };
  if (!isDetectionEvidence(evidence)) return { visible: false, error: 'Invalid detection evidence' };

  const hostPresent = Boolean(document.getElementById(HOST_ID));
  if (!force && hostPresent && evidence.snapshotHash === lastSnapshot) {
    return { visible: true, cached: true };
  }
  lastSnapshot = evidence.snapshotHash;
  dismissedForCurrentPayment = false;

  const context = await chrome.runtime.sendMessage({ type: 'GET_CONTEXT', evidence }).catch(() => ({ paired: false }));
  renderOverlay(overlayContainer(), evidence, context, (message) => chrome.runtime.sendMessage(message), () => {
    dismissedForCurrentPayment = true;
    document.getElementById(HOST_ID)?.remove();
  });

  void chrome.runtime.sendMessage({ type: 'META_TOPUP_DETECTION', evidence }).catch(() => undefined);

  return {
    visible: true,
    url: location.href,
    account: evidence.visibleAccountId || evidence.urlAccountId || 'Unknown Account',
    accountName: evidence.visibleAccountName,
    amount: evidence.amountText || 'Not detected',
    qrVisible: evidence.qrVisible,
    dialogState: evidence.dialogState
  };
}

function scheduleInspect(): void {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = window.setTimeout(() => void inspect(false), 80);
}

function startForRoute(): void {
  observer?.disconnect();
  if (!isApprovedBillingUrl(location.href)) {
    removeAssistant();
    return;
  }
  observer = new MutationObserver(scheduleInspect);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-hidden', 'aria-modal', 'style', 'class', 'hidden']
  });
  void inspect(false);
}

const scriptVersion = chrome.runtime.getManifest().version;
if (window.top === window) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'ADS_CONTROL_PING') {
      sendResponse({ active: true, version: scriptVersion });
      return false;
    }
    if (message?.type === 'ADS_CONTROL_SCAN') {
      lastSnapshot = '';
      dismissedForCurrentPayment = false;
      inspect(true)
        .then((result) => sendResponse(result))
        .catch((error) => sendResponse({ visible: false, error: error instanceof Error ? error.message : 'Scan failed' }));
      return true;
    }
    return false;
  });

  // Fast polling loop to catch instant modals even if mutations are swallowed
  window.setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      startForRoute();
    } else if (isApprovedBillingUrl(location.href)) {
      void inspect(false);
    }
  }, 350);

  window.addEventListener('popstate', startForRoute);
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.autoDetectQr) {
      void inspect(false);
    }
  });

  startForRoute();
}
