import styles from './overlay/styles.css?inline';
import { evaluateDetection, isDetectionEvidence } from './detector/evaluate.ts';
import { isApprovedBillingUrl } from './detector/url.ts';
import { renderOverlay } from './overlay/Overlay.tsx';

const HOST_ID = 'ads-control-companion-root';
const OBSERVER_DEBOUNCE_MS = 180;
let observer: MutationObserver | undefined;
let timer: number | undefined;
let lastSnapshot = '';
let lastUrl = location.href;
let observedRoot: Node | undefined;
let dismissedForCurrentPayment = false;

function removeAssistant(): void {
  observer?.disconnect();
  observer = undefined;
  observedRoot = undefined;
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

async function inspect(): Promise<void> {
  if (!isApprovedBillingUrl(location.href)) {
    removeAssistant();
    return;
  }
  const evidence = evaluateDetection(location.href, document);
  if (!evidence) {
    document.getElementById(HOST_ID)?.remove();
    lastSnapshot = '';
    dismissedForCurrentPayment = false;
    return;
  }
  if (dismissedForCurrentPayment) return;
  if (!isDetectionEvidence(evidence) || evidence.snapshotHash === lastSnapshot) return;
  lastSnapshot = evidence.snapshotHash;
  const context = await chrome.runtime.sendMessage({ type: 'GET_CONTEXT', evidence }).catch(() => ({ paired: false }));
  renderOverlay(overlayContainer(), evidence, context, (message) => chrome.runtime.sendMessage(message), () => {
    dismissedForCurrentPayment = true;
    document.getElementById(HOST_ID)?.remove();
  });
  void chrome.runtime.sendMessage({ type: 'META_TOPUP_DETECTION', evidence }).catch(() => undefined);
}

function scheduleInspect(): void {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = window.setTimeout(() => void inspect(), OBSERVER_DEBOUNCE_MS);
}

function startForRoute(): void {
  observer?.disconnect();
  if (!isApprovedBillingUrl(location.href)) {
    removeAssistant();
    return;
  }
  const dialog = document.querySelector('[data-ads-control-signal="payment-dialog"], [role="dialog"][aria-modal="true"], [role="dialog"]');
  observedRoot = dialog ?? document.body;
  observer = new MutationObserver(scheduleInspect);
  observer.observe(observedRoot, {
    childList: true,
    subtree: true,
    attributes: Boolean(dialog),
    attributeFilter: dialog ? ['aria-hidden', 'aria-modal', 'data-ads-control-state'] : undefined
  });
  void inspect();
}

const scriptVersion = chrome.runtime.getManifest().version;
const marker = 'adsControlCompanionVersion';
if (window.top === window && document.documentElement.dataset[marker] !== scriptVersion) {
  document.documentElement.dataset[marker] = scriptVersion;
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'ADS_CONTROL_PING') { sendResponse({ active: true, version: scriptVersion }); return false; }
    if (message?.type !== 'ADS_CONTROL_SCAN') return false;
    lastSnapshot = '';
    dismissedForCurrentPayment = false;
    inspect().then(() => sendResponse({ visible: Boolean(document.getElementById(HOST_ID)), url: location.href }))
      .catch((error) => sendResponse({ visible: false, error: error instanceof Error ? error.message : 'Scan failed' }));
    return true;
  });
  window.setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      startForRoute();
    } else if (isApprovedBillingUrl(location.href)) {
      const currentDialog = document.querySelector('[data-ads-control-signal="payment-dialog"], [role="dialog"][aria-modal="true"], [role="dialog"]');
      const expectedRoot = currentDialog ?? document.body;
      if (!observer || observedRoot !== expectedRoot) startForRoute();
    }
  }, 500);
  window.addEventListener('popstate', startForRoute);
  startForRoute();
}
