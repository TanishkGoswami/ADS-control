# ADS Control UI Design System

## Intent

ADS Control is an internal Meta ads operations and finance console. The UI should feel like Meta Business tooling: white canvas, cobalt actions, quiet gray separators, compact typography, clear data rows, and no decorative chrome. This is an operator product, not a marketing page.

## Visual Contract

- **Mode:** Operate.
- **Primary job:** Help admins inspect Meta assets, client wallets, vendor credit, ledger entries, reconciliation, alerts, and audit events quickly.
- **Scene:** Desktop-first daily operations, with tablet/mobile read access.
- **Shape rule:** 5px radius everywhere for panels, inputs, buttons, badges, menus, and modals.
- **Depth rule:** Flat surfaces with 1px structural hairlines. Use shadow only for overlays/modals.

## Tokens

### Colors

| Role | Value | Use |
|---|---:|---|
| Canvas | `#ffffff` | Main cards, tables, header, sidebar |
| App background | `#f5f6f7` | Page background and low-emphasis panels |
| Soft surface | `#f1f4f7` | Hover, secondary cells, inactive chips |
| Hairline | `#e4e7eb` | Structural 1px borders and row dividers |
| Hairline strong | `#c5ced8` | Hover/focus-adjacent border |
| Ink | `#1c1e21` | Primary text and active dark controls |
| Ink deep | `#0a1317` | Highest emphasis labels |
| Steel | `#5d6c7b` | Secondary text |
| Stone | `#8595a4` | Placeholder and muted metadata |
| Meta blue | `#0064e0` | Primary actions, active links, Meta-specific emphasis |
| Meta blue pressed | `#0457cb` | Primary action hover/pressed |
| Success | `#15803d` | Active, connected, balanced |
| Warning | `#b45309` | Open, pending, unresolved |
| Critical | `#be123c` | Restricted, alert, destructive |

### Typography

Use `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`. Use `JetBrains Mono` only for IDs, rupee amounts, account numbers, timestamps, and ledger-like data.

| Role | Size | Weight | Line height | Use |
|---|---:|---:|---:|---|
| Page title | 16px | 700 | 1.35 | Feature headers |
| Section title | 12px | 700 | 1.35 | Panel headers |
| Body | 12px | 500 | 1.45 | Rows, labels, controls |
| Secondary | 11px | 400 | 1.45 | Helper text, descriptions |
| Caption | 10px | 600 | 1.35 | Badges, metadata |
| Numeric | 13-18px | 700 | 1.25 | KPI and money values |

Letter spacing stays `0` except uppercase micro-labels may use `0.04em`.

### Layout

- Sidebar width: `222px` desktop only.
- Header height: `48px`.
- Page max width: `1260px`.
- Page gutters: `16px` mobile, `24px` tablet, `32px` desktop.
- Grid gap: `10-12px` for dense panels.
- Panel padding: `12px` default, `16px` for important forms/modals.

## Components

### Buttons

- Primary Meta action: blue fill, white text, 5px radius, 32px min height.
- Secondary action: white fill, hairline border, ink text.
- Ghost action: white fill, hairline border, steel text, used for utility commands.
- Icon buttons keep the same 5px radius and must expose `title` text.

### Cards And Panels

- White background, optional `1px #e4e7eb` outer border, 5px radius.
- No nested decorative cards. Nested panels are allowed only for forms, drawers, and table detail sections.
- Hover may change border to `#c5ced8` or background to `#f5f6f7`.

### Tables And Lists

- Dense continuous rows with clear right-aligned numeric columns.
- Use one outer container border; rows share subtle dividers and hover fills.
- Do not box every row, icon, label, metric, or nested detail.
- Header rows use soft surface background and 10px uppercase labels.
- IDs, amounts, account numbers, and timestamps use mono.
- Status must be visible through text and color, not color alone.

### Badges

All badges use 5px radius, 1px semantic border, 10px font, and short labels: `ACTIVE`, `CONNECTED`, `RESTRICTED`, `OPEN`, `BALANCED`.

### Inputs And Modals

- Inputs: white background, 1px hairline border, 5px radius, 32-36px height.
- Focus: blue outline/border.
- Modals: white surface, 5px radius, hairline border, soft shadow, compact header/body/footer.

## Responsive Rules

- Desktop (`1024px+`): sidebar visible, content uses full operator grid.
- Tablet (`768px-1023px`): sidebar visible only if space allows; two-column grids may collapse.
- Mobile (`320px-767px`): sidebar hidden, header actions compress to icons, all data grids stack or horizontally scroll.

## Do

- Keep the product calm, flat, and data-first.
- Use cobalt only for primary actions and Meta-specific links.
- Prefer rows and tables over card-heavy layouts.
- Keep labels short and exact.

## Don't

- Do not use 24px/32px marketing-card radius.
- Do not use pill buttons for this operations UI.
- Do not add gradients, glass, glow, decorative blobs, or hero sections.
- Do not use monospace for ordinary prose.
