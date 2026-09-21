import './popup.css';

const app = document.querySelector<HTMLElement>('#app')!;

async function send(message: Record<string, unknown>) {
  return chrome.runtime.sendMessage(message).catch((error) => ({ error: error instanceof Error ? error.message : 'Request failed' }));
}

async function scanCurrentTab(feedback: HTMLElement, button: HTMLButtonElement) {
  button.disabled = true; button.textContent = 'Scanning...'; feedback.textContent = '';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith('https://adsmanager.facebook.com/')) { feedback.textContent = 'Open the Meta Billing tab first.'; button.disabled = false; button.textContent = 'Troubleshoot detection'; return; }
  let result = await chrome.tabs.sendMessage(tab.id, { type: 'ADS_CONTROL_SCAN' }).catch(() => null);
  if (!result) {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    result = await chrome.tabs.sendMessage(tab.id, { type: 'ADS_CONTROL_SCAN' }).catch(() => null);
  }
  feedback.textContent = result?.visible ? 'Assistant is active on this tab.' : result?.error || 'Payment QR was not detected. Keep the QR open and scan again.';
  button.disabled = false; button.textContent = 'Troubleshoot detection';
}

function renderPaired(deviceId?: string, online=true, expiresAt?:string) {
  app.innerHTML = `<header><strong>Ads Control Companion</strong><span class="status ${online?'':'status--warn'}">${online?'Connected':'Offline'}</span></header><section><p>${online?'Meta payment QR screens are detected automatically.':'ADS Control is unreachable. Detection continues, but mapping is paused.'}</p><dl><dt>Device</dt><dd>${deviceId || 'Connected browser'}</dd>${expiresAt?`<dt>Renews</dt><dd>${new Date(expiresAt).toLocaleDateString()}</dd>`:''}</dl><button id="scan" type="button">Troubleshoot detection</button><button id="disconnect" class="secondary" type="button">Disconnect browser</button><p id="scan-feedback" class="hint" role="status">Use troubleshooting only if the assistant does not appear automatically.</p></section>`;
  const button = app.querySelector<HTMLButtonElement>('#scan')!; const feedback = app.querySelector<HTMLElement>('#scan-feedback')!;
  button.addEventListener('click', () => void scanCurrentTab(feedback, button));
  app.querySelector<HTMLButtonElement>('#disconnect')!.addEventListener('click', async()=>{if(!confirm('Disconnect this browser from ADS Control?'))return;await send({type:'DISCONNECT'});renderPair('Browser disconnected. Generate a new code to pair again.');});
}

function renderPair(error = '') {
  app.innerHTML = `<header><strong>Ads Control Companion</strong><span class="status status--muted">Not paired</span></header><form><label>One-time pairing code<input name="code" autocomplete="off" required placeholder="Paste code from ADS Control"></label><label>Device name<input name="deviceName" required value="Chrome on this PC"></label><button type="submit">Pair extension</button><p class="error" role="alert">${error}</p><p class="hint">Generate the code in Meta Funding → Devices.</p></form>`;
  app.querySelector('form')!.addEventListener('submit', async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget as HTMLFormElement); const button = app.querySelector('button')!; button.disabled = true; button.textContent = 'Pairing...';
    const result = await send({ type: 'PAIR', code: form.get('code'), deviceName: form.get('deviceName') });
    if (result?.error) renderPair(result.error); else renderPaired(result.deviceId);
  });
}

app.innerHTML='<div class="loading">Checking connection...</div>';
void send({ type: 'PAIRING_STATUS' }).then((result) => result?.paired ? renderPaired(result.deviceId,result.online!==false,result.expiresAt) : renderPair(result?.error));
