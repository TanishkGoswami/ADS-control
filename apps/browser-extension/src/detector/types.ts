export type DetectorConfidence = 'high' | 'medium' | 'low' | 'blocked';
export type DialogState = 'qr-active' | 'processing' | 'success' | 'failure' | 'expired' | 'unknown';

export interface DetectorRules {
  version: string;
  disabled: boolean;
  selectors: {
    dialog: readonly string[];
    accountId: readonly string[];
    accountName: readonly string[];
    amount: readonly string[];
    qr: readonly string[];
    processing: readonly string[];
    success: readonly string[];
    failure: readonly string[];
    expired: readonly string[];
  };
}

export interface ReadableElement {
  textContent: string | null;
  parentElement?: ReadableElement | null;
  getAttribute(name: string): string | null;
  matches(selector: string): boolean;
  querySelector(selector: string): ReadableElement | null;
  querySelectorAll?(selector: string): Iterable<ReadableElement>;
}

export interface ReadableDocument {
  querySelector(selector: string): ReadableElement | null;
  querySelectorAll?(selector: string): Iterable<ReadableElement>;
}

export interface DomSignals {
  visibleAccountId?: string;
  visibleAccountName?: string;
  amountText?: string;
  amountMinor?: string;
  currencyCode?: 'INR';
  paymentMethod?: string;
  qrVisible: boolean;
  dialogState: DialogState;
  successVisible: boolean;
  signalNames: string[];
}

export interface DetectionEvidence extends DomSignals {
  pageUrl: string;
  urlAccountId?: string;
  confidence: DetectorConfidence;
  blocked: boolean;
  requiresConfirmation: boolean;
  detectorVersion: string;
  snapshotHash: string;
}
