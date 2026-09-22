import './popup.css';

const app = document.querySelector<HTMLElement>('#app')!;

async function send(message: Record<string, unknown>): Promise<any> {
  return chrome.runtime.sendMessage(message).catch((error) => ({
    error: error instanceof Error ? error.message : 'Request failed'
  }));
}

function isMetaUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return h.endsWith('facebook.com') || h.endsWith('meta.com');
  } catch {
    return false;
  }
}

async function scanCurrentTab(feedbackEl: HTMLElement, button: HTMLButtonElement) {
  button.disabled = true;
  button.textContent = 'Scanning Meta Tab...';
  feedbackEl.innerHTML = '<div class="feedback-card feedback-card--info">Scanning active tab for Meta payment dialog & UPI QR...</div>';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !isMetaUrl(tab.url)) {
      feedbackEl.innerHTML = '<div class="feedback-card feedback-card--warn"><div class="feedback-title">Meta Tab Not Found</div>Please switch to your Meta Ads Manager or Billing tab (e.g. facebook.com / adsmanager.facebook.com) and try again.</div>';
      button.disabled = false;
      button.textContent = '🔍 Detect QR on Current Tab';
      return;
    }

    let result = await chrome.tabs.sendMessage(tab.id, { type: 'ADS_CONTROL_SCAN' }).catch(() => null);
    if (!result) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }).catch(() => null);
      result = await chrome.tabs.sendMessage(tab.id, { type: 'ADS_CONTROL_SCAN' }).catch(() => null);
    }

    if (result?.visible) {
      feedbackEl.innerHTML = `
        <div class="feedback-card feedback-card--success">
          <div class="feedback-title">✅ Payment QR Detected</div>
          <div><strong>Account:</strong> ${result.account} ${result.accountName ? `(${result.accountName})` : ''}</div>
          <div><strong>Amount:</strong> ${result.amount}</div>
          <div><strong>QR State:</strong> ${result.qrVisible ? 'UPI QR Active' : 'Payment dialog detected'}</div>
          <div style="margin-top:6px; color:#15803d; font-weight:600;">Ads Control Assistant is now displayed on the Meta page!</div>
        </div>
      `;
    } else {
      feedbackEl.innerHTML = `
        <div class="feedback-card feedback-card--warn">
          <div class="feedback-title">⚠️ QR Not Found on Active Tab</div>
          <div>${result?.error || 'Make sure the Meta "Add Funds" or UPI Payment QR modal is open on screen, then click Detect again.'}</div>
        </div>
      `;
    }
  } catch (err: any) {
    feedbackEl.innerHTML = `<div class="feedback-card feedback-card--error"><div class="feedback-title">Scan Error</div>${err?.message || 'Could not scan tab.'}</div>`;
  } finally {
    button.disabled = false;
    button.textContent = '🔍 Detect QR on Current Tab';
  }
}

function renderPaired(deviceId?: string, online = true, expiresAt?: string, autoDetect = true) {
  app.innerHTML = `
    <header>
      <div class="brand">
        <div class="brand-icon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <strong>Ads Control Companion</strong>
      </div>
      <span id="conn-status" class="status ${online ? '' : 'status--warn'}">${online ? 'Connected' : 'Offline'}</span>
    </header>
    <section>
      <!-- Auto-detect Toggle -->
      <label class="toggle-row" for="auto-detect-switch">
        <div class="toggle-label">
          <span class="toggle-title">Auto-Detect Payment QR</span>
          <span class="toggle-sub">Automatically shows assistant when Meta QR opens</span>
        </div>
        <div class="switch">
          <input type="checkbox" id="auto-detect-switch" ${autoDetect ? 'checked' : ''}>
          <span class="slider"></span>
        </div>
      </label>

      <dl>
        <dt>Device</dt>
        <dd>${deviceId || 'Connected browser'}</dd>
        ${expiresAt ? `<dt>Renews</dt><dd>${new Date(expiresAt).toLocaleDateString()}</dd>` : ''}
      </dl>

      <button id="scan-btn" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        Detect QR on Current Tab
      </button>
      <div id="scan-feedback"></div>

      <button id="disconnect-btn" class="secondary" type="button">Disconnect Browser</button>
      <p class="hint">Keep the Meta payment modal open while mapping funds.</p>
    </section>
  `;

  // Toggle Auto-detect handler
  const toggleInput = app.querySelector<HTMLInputElement>('#auto-detect-switch')!;
  toggleInput.addEventListener('change', async () => {
    const enabled = toggleInput.checked;
    await chrome.storage.local.set({ autoDetectQr: enabled });
    void send({ type: 'SET_SETTINGS', settings: { autoDetectQr: enabled } });
  });

  // Scan current tab handler
  const scanBtn = app.querySelector<HTMLButtonElement>('#scan-btn')!;
  const scanFeedback = app.querySelector<HTMLElement>('#scan-feedback')!;
  scanBtn.addEventListener('click', () => void scanCurrentTab(scanFeedback, scanBtn));

  // Disconnect handler
  const disconnectBtn = app.querySelector<HTMLButtonElement>('#disconnect-btn')!;
  disconnectBtn.addEventListener('click', async () => {
    if (!confirm('Disconnect this browser from ADS Control?')) return;
    await send({ type: 'DISCONNECT' });
    renderPair('Browser disconnected. Generate a new code in Meta Funding → Devices to pair again.');
  });
}

function renderPair(error = '') {
  app.innerHTML = `
    <header>
      <strong>Ads Control Companion</strong>
      <span class="status status--muted">Not paired</span>
    </header>
    <form>
      <label>One-time pairing code
        <input name="code" autocomplete="off" required placeholder="Paste pairing code from ADS Control">
      </label>
      <label>Device name
        <input name="deviceName" required value="Chrome on this PC">
      </label>
      <button type="submit">Pair Extension</button>
      ${error ? `<p class="error" role="alert">${error}</p>` : ''}
      <p class="hint">Generate a 6-digit code in Meta Funding → Devices page.</p>
    </form>
  `;

  app.querySelector('form')!.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const button = app.querySelector('button')!;
    button.disabled = true;
    button.textContent = 'Pairing...';
    const result = await send({
      type: 'PAIR',
      code: form.get('code'),
      deviceName: form.get('deviceName')
    });
    if (result?.error) {
      renderPair(result.error);
    } else {
      renderPaired(result.deviceId, true, undefined, true);
    }
  });
}

// 1. Instant Render from local cache (0ms delay - no stuck screen!)
chrome.storage.local.get(['deviceSession', 'autoDetectQr']).then(({ deviceSession, autoDetectQr }) => {
  const autoDetect = autoDetectQr !== false;
  if (deviceSession && new Date(deviceSession.expiresAt).getTime() > Date.now()) {
    renderPaired(deviceSession.deviceId, true, deviceSession.expiresAt, autoDetect);
    // Background async heartbeat check to update online badge without blocking UI
    send({ type: 'PAIRING_STATUS' }).then((result) => {
      const badge = document.querySelector<HTMLElement>('#conn-status');
      if (badge) {
        const online = result?.online !== false;
        badge.className = `status ${online ? '' : 'status--warn'}`;
        badge.textContent = online ? 'Connected' : 'Offline';
      }
    });
  } else {
    renderPair();
  }
}).catch(() => {
  renderPair();
});
