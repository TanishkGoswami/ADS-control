# Meta Assets Surface Design

The Meta Assets page inherits the ADS Control operations system from `../DESIGN.md`.

Surface-specific rules:

- Show connected profiles, Graph API status, portfolio/account hierarchy, account status, balances, and fund isolation controls above decoration.
- Active/restricted state must be text plus semantic color.
- Account rows form one continuous white table with subtle gray dividers; only the outer surface uses a 5px radius.
- Restricted rows may use a light rose tint, but keep the row readable and structurally aligned with active rows.
- Primary actions: `Sync Meta Assets`, connection flows, and account-level isolation.
- Keep Meta blue for sync/connect affordances; do not turn every metric blue.
