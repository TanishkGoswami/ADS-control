# ADS Control Web UI

This app follows the root `DESIGN.md`: Meta Business-style operations UI, 5px radius, quiet structural hairlines, flat white surfaces, compact Inter typography, cobalt primary actions, and data-first structure.

Implementation source of truth:

- Global tokens and component classes: `src/index.css`
- Tailwind radius scale: `tailwind.config.js`
- Shell components: `src/components/Header.tsx`, `src/components/Sidebar.tsx`
- Reusable cards and overlays: `src/components/StatCard.tsx`, `src/components/CommandPalette.tsx`

Key rules:

- `rounded-none` is intentionally remapped to the 5px product radius.
- `#e4e7eb` is the standard structural hairline.
- Repeated records are continuous table/list rows, not individually outlined cards.
- `#f5f6f7` is the app background and quiet panel tint.
- `#0064e0` is reserved for primary actions and Meta-specific emphasis.
- `font-mono` is only for IDs, money, timestamps, ledger/account data.
