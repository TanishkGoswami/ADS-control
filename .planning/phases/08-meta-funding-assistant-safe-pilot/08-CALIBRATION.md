# Meta Billing calibration

## Automated acceptance

- Detector rules: `fixture-v1`
- Extension version: `1.0.0`
- Supported hosts: `www.facebook.com`, `business.facebook.com`
- Supported route families: billing, payments, payment settings, Ads Manager billing
- Synthetic states covered: no payment dialog, QR active, account match, account mismatch
- Sensitive material policy: no QR payload, screenshot, full HTML, Meta token, or payment credential is captured

## Live pilot checkpoint

Status: pending operator verification on the approved English Meta Billing UI.

Before enabling a production pilot, verify QR active, processing, success, failure, and expired states. Record only sanitized selectors and wording; never paste customer data, QR material, tokens, or full Meta markup here.

The extension remains read-only on Meta: it does not click payment controls, decode QR data, intercept requests, or post ledger entries.
