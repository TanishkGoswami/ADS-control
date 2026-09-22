import type { DetectionEvidence } from '../detector/types.ts';

interface Account {
  id: string;
  name: string;
  internalAlias?: string;
  metaAdAccountId: string;
}

interface AssistantContext {
  paired: boolean;
  exactAccountId?: string;
  accounts?: Account[];
  lots?: Array<{ id: string; availableAmountMinor: string; status: string }>;
  requests?: Array<{ id: string; referenceCode: string; purpose: string; amountMinor: string; targetAdAccountId?: string }>;
  error?: string;
}

type Send = (message: Record<string, unknown>) => Promise<any>;

const money = (minor?: string) =>
  minor ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(minor) / 100) : 'Amount unavailable';

const shortId = (id?: string) => (id && id.length > 4 ? `ID: ...${id.slice(-4)}` : id ? `ID: ${id}` : '');

function row(label: string, value: string, detail?: string) {
  const item = document.createElement('div');
  item.className = 'ac-row';
  const key = document.createElement('span');
  key.className = 'ac-label';
  key.textContent = label;
  const content = document.createElement('div');
  content.className = 'ac-val-wrap';
  const strong = document.createElement('strong');
  strong.className = 'ac-val';
  strong.textContent = value;
  content.append(strong);
  if (detail) {
    const small = document.createElement('span');
    small.className = 'ac-detail';
    small.textContent = detail;
    content.append(small);
  }
  item.append(key, content);
  return item;
}

function field(label: string, control: HTMLElement, help?: string) {
  const wrap = document.createElement('label');
  wrap.className = 'ac-field';
  const text = document.createElement('span');
  text.className = 'ac-field-label';
  const labelText = document.createElement('span');
  labelText.textContent = label;
  text.append(labelText);
  if (help) {
    const info = document.createElement('span');
    info.className = 'ac-info';
    info.textContent = 'i';
    info.title = help;
    info.setAttribute('aria-label', help);
    text.append(info);
  }
  wrap.append(text, control);
  return wrap;
}

function button(label: string) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'ac-button';
  el.textContent = label;
  return el;
}

function message(text: string, tone: 'info' | 'error' | 'success' = 'info') {
  const el = document.createElement('div');
  el.className = `ac-alert ac-alert--${tone}`;
  el.textContent = text;
  return el;
}

export function renderOverlay(
  container: HTMLElement,
  evidence: DetectionEvidence,
  context: AssistantContext,
  send: Send,
  onClose: () => void
): void {
  container.replaceChildren();

  const account = context.accounts?.find((item) => item.id === context.exactAccountId) || context.accounts?.[0];
  const detectedName = evidence.visibleAccountName || account?.internalAlias || account?.name || 'Meta Ad Account';
  const detectedId = evidence.visibleAccountId || evidence.urlAccountId || account?.metaAdAccountId;

  // Header
  const header = document.createElement('div');
  header.className = 'ac-header';

  const brand = document.createElement('div');
  brand.className = 'ac-brand';
  brand.innerHTML = `
    <div class="ac-logo-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    </div>
    <span class="ac-title">Ads Control Companion</span>
  `;

  const actions = document.createElement('div');
  actions.className = 'ac-header-actions';

  const status = document.createElement('span');
  if (evidence.blocked) {
    status.className = 'ac-badge ac-badge--danger';
    status.textContent = 'Mismatch';
  } else if (!context.paired) {
    status.className = 'ac-badge ac-badge--muted';
    status.textContent = 'Not paired';
  } else if (context.exactAccountId || context.accounts?.length) {
    status.className = 'ac-badge ac-badge--success';
    status.textContent = 'Connected';
  } else {
    status.className = 'ac-badge ac-badge--warn';
    status.textContent = 'Unsynced';
  }

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'ac-close';
  close.title = 'Close assistant';
  close.setAttribute('aria-label', 'Close assistant');
  close.innerHTML = '&times;';
  close.onclick = onClose;

  actions.append(status, close);
  header.append(brand, actions);

  // Body
  const body = document.createElement('div');
  body.className = 'ac-body';

  const card = document.createElement('div');
  card.className = 'ac-card';
  card.append(
    row('Ad Account', detectedName, shortId(detectedId)),
    row('Payment Amount', evidence.amountText || 'Not detected'),
    row('Payment Method', evidence.paymentMethod || (evidence.qrVisible ? 'UPI (Dynamic QR)' : 'Auto-detected')),
    row('QR State', evidence.qrVisible ? 'UPI QR Active' : 'Dialog detected')
  );
  body.append(card);

  if (!context.paired) {
    body.append(message('Browser is not paired with ADS Control. Click the extension icon to connect.', 'error'));
  } else if (evidence.blocked) {
    body.append(message('The account in the URL and payment dialog do not match. Fund mapping is blocked for safety.', 'error'));
  } else if (!context.exactAccountId && (!context.accounts || context.accounts.length === 0)) {
    body.append(message(`${detectedName} (${shortId(detectedId)}) is not linked in ADS Control. Please sync Meta assets in dashboard.`, 'error'));
  } else if (!evidence.amountMinor || evidence.currencyCode !== 'INR') {
    body.append(message('Waiting for valid INR payment amount from Meta modal...', 'info'));
  } else {
    const targetAccountId = context.exactAccountId || context.accounts?.[0]?.id;
    const source = document.createElement('select');
    source.className = 'ac-select';
    source.append(new Option('-- Select Approved Funding Source --', ''));

    for (const request of context.requests ?? []) {
      if (request.amountMinor !== evidence.amountMinor || (request.targetAdAccountId && request.targetAdAccountId !== targetAccountId)) {
        continue;
      }
      source.append(new Option(`Request: ${request.referenceCode} · ${request.purpose} (${money(request.amountMinor)})`, `FUNDING_REQUEST:${request.id}`));
    }

    for (const lot of context.lots ?? []) {
      if (BigInt(lot.availableAmountMinor || '0') < BigInt(evidence.amountMinor)) continue;
      source.append(new Option(`Prepaid Lot: Available ${money(lot.availableAmountMinor)}`, `FUND_LOT:${lot.id}`));
    }

    body.append(field(
      'Funding Allocation Source',
      source,
      'Only funds allocated from a client wallet to this exact Ad Account are shown. Mapping reserves the selected amount; it does not complete the Meta payment.'
    ));

    if (source.options.length === 1) {
      body.append(message(`No approved funding source covers ${money(evidence.amountMinor)}. Create & approve a request in ADS Control first.`, 'error'));
    }

    const map = button('⚡ Map Approved Funds');
    map.disabled = true;
    source.onchange = () => {
      map.disabled = !source.value;
    };

    const feedback = document.createElement('div');
    feedback.className = 'ac-feedback-area';

    map.onclick = async () => {
      map.disabled = true;
      feedback.replaceChildren(message('Mapping funds to top-up session...', 'info'));
      const [sourceType, sourceId] = source.value.split(':');
      const result = await send({
        type: 'MAP_TOPUP',
        evidence,
        selectedAdAccountId: targetAccountId,
        sourceType,
        sourceId
      });

      if (result?.error) {
        map.disabled = false;
        feedback.replaceChildren(message(result.error, 'error'));
      } else {
        feedback.replaceChildren(message('Funds mapped successfully! Proceed to scan and pay in Meta.', 'success'));
      }
    };

    body.append(map, feedback);
  }

  container.append(header, body);
}
