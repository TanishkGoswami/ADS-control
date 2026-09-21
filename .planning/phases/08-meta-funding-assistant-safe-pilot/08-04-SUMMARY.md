---
phase: 08-meta-funding-assistant-safe-pilot
plan: 04
subsystem: browser-extension
tags: [chrome-extension, meta-billing, detector, shadow-dom, security]
status: complete
dependency_graph:
  requires: [08-02]
  provides: [url-first-detector, sanitized-dom-evidence, read-only-shadow-assistant]
  affects: [08-06]
tech_stack:
  added: []
  patterns: [pure-detector-pipeline, field-allow-list, scoped-mutation-observer, snapshot-deduplication]
key_files:
  created:
    - apps/browser-extension/src/detector/types.ts
    - apps/browser-extension/src/detector/url.ts
    - apps/browser-extension/src/detector/dom.ts
    - apps/browser-extension/src/detector/evaluate.ts
    - apps/browser-extension/src/content.tsx
    - apps/browser-extension/src/overlay/Overlay.tsx
    - apps/browser-extension/src/overlay/styles.css
    - apps/browser-extension/test/detector.test.ts
  modified:
    - apps/browser-extension/src/background.ts
    - apps/browser-extension/manifest.json
    - apps/browser-extension/vite.config.ts
    - apps/browser-extension/package.json
    - apps/browser-extension/tsconfig.json
key_decisions:
  - URL account evidence is a candidate and only becomes high confidence when the visible account ID agrees.
  - The detector emits an explicit allow-listed evidence shape and never serializes QR content or page markup.
  - Generic fixture selectors remain in place until the live calibration plan approves production selectors.
metrics:
  tasks: 2
  completed: 2026-09-19
---

# Phase 8 Plan 04: Meta Billing Detector Summary

URL-first account matching with sanitized multi-signal DOM evidence and an isolated read-only Shadow DOM assistant for approved Meta Billing routes.

## What Was Built

- Pure URL and DOM detector modules normalize Meta account IDs, INR amounts, QR presence, dialog state, and sanitized signal names.
- Independent URL and visible account evidence yields high, medium, low, or blocked confidence; mismatches are always blocked.
- Snapshot hashing suppresses duplicate observer output without retaining raw page content.
- A top-frame-only content script runs on explicit Facebook hosts, activates only on billing/payment routes, tracks SPA route changes, and scopes observation to the active dialog when present.
- A single ShadowRoot renders account, amount, currency, confidence, and blocked/missing-context guidance without interacting with Meta controls.
- The service worker validates the sender route, top-frame identity, and exact evidence field allow-list before acknowledging a detection.
- Sanitized fixtures cover no-payment, active QR, exact account match, and account mismatch states.

## Verification

- `pnpm --filter @ads-control/browser-extension run test`: passed, 5/5 tests.
- `pnpm --filter @ads-control/browser-extension run build`: passed.
- Built `content.js` is self-contained and contains no ESM import unsupported by manifest content scripts.
- Static inspection found no click automation, raw HTML serialization, canvas/QR extraction, screenshot handling, or Meta history API rewriting.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Security] Validated the content-script message at the service-worker boundary**
- **Found during:** Task 2
- **Issue:** The existing service worker rejected all detector messages and had no privileged-boundary evidence validation.
- **Fix:** Added top-frame approved-route checks and an exact field allow-list in `background.ts`.

**2. [Rule 3 - Build] Kept the MV3 content script free of shared ESM imports**
- **Found during:** Task 2 verification
- **Issue:** Sharing detector validation with the module service worker produced an ESM import in the classic manifest content script.
- **Fix:** Kept a minimal local service-worker validator so Vite emits standalone `background.js` and `content.js` bundles.

**3. [Rule 3 - Test tooling] Used Node 24 native TypeScript stripping**
- **Found during:** Task 1
- **Issue:** The extension had no test runner dependency.
- **Fix:** Added a dependency-free `node:test` script and a minimal sanitized fixture adapter.

## Boundaries Preserved

- No QR decoding, payment automation, Meta control mutation, screenshots, full HTML capture, token capture, or API event persistence was added.
- Live Meta selectors remain intentionally uncalibrated and must be approved in Plan 08-06 before pilot activation.
- No files were staged or committed.

## Self-Check: PASSED

- All planned detector, fixture, content-script, overlay, manifest, and build artifacts exist.
- Required tests and production build pass.
- No known stubs prevent the fixture-proven Plan 08-04 goal.
