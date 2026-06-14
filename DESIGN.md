# Design System — Lagkassan

## Aesthetic stance
Swedish civic clarity — clean, functional, trustworthy. The feeling of a Swedish cooperative, not a startup. Warm enough that a 58-year-old club treasurer feels comfortable, sharp enough that a 28-year-old co-founder respects it.

## Type
- Heading: Inter, 700, h1: 48px / h2: 36px / h3: 24px / h4: 18px
- Body: Inter, 400, 16px, line-height 1.65, max-width 680px
- Small / label: Inter, 500, 13px, letter-spacing 0.02em
- Mono (amounts, IDs): JetBrains Mono — used ONLY for SEK amounts and unique collection codes

## Color
- Surface: #FAFAF8 — page background (warm white, not pure white)
- Surface alt: #F2F1EE — cards, raised areas, sidebar bg
- Surface border: #E5E3DF — dividers, input borders
- Text primary: #1A1917 — body and headings
- Text muted: #6B6860 — secondary labels, helper text
- Accent: #1D6EE8 — buttons, links, active states (one accent, used sparingly)
- Accent hover: #1558C4
- Accent light: #EFF4FD — accent tint for tag backgrounds, focus rings
- Success: #16A34A — "Betald" / paid state
- Success light: #F0FDF4
- Warning: #D97706 — approaching deadline
- Danger: #DC2626 — overdue, failed payment
- Danger light: #FEF2F2

## Spacing
- Base unit: 4px
- Section vertical rhythm: 96px between page sections
- Card padding: 24px
- Form field gap: 16px
- Button padding: 12px 20px
- Max content width: 1100px
- Max reading width: 680px

## Component rules
- Border radius: 8px on cards; 6px on inputs and buttons; 4px on tags/badges
- Box shadow (cards only): 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
- No shadows on buttons — use border (1px Surface border) for secondary; solid fill for primary
- Inputs: border 1px Surface border, focus ring 2px Accent light
- Tables: no outer border, horizontal dividers only (1px Surface border)

## Motion
- Default transition: 150ms ease-out
- What animates: opacity and transform on hover states, toast notifications entering, loading spinners
- What does NOT animate: page transitions, form field label positions, layout reflows

## Swedish language defaults
- Product is in Swedish. All UI labels, CTAs, error messages, and emails in Swedish
- English used only in: code, API keys, developer-facing config, and this document
- Currency: always "kr" suffix, space before (e.g., "199 kr/mån") — not SEK, not ":-"
- Dates: Swedish format (14 juni 2026, not 2026-06-14 in UI)

## What this system rejects
- Gradients of any kind (backgrounds, buttons, text)
- Glassmorphism (backdrop-filter, frosted effects)
- Dark mode in MVP — adds testing surface with zero treasurer demand signal
- Multiple accent colors — every "just add a second color" request is rejected
- Decorative illustrations or icons beyond Heroicons outline set
- Font pairing — Inter only; no display typeface added "for personality"
- Rounded corners beyond 8px — no pill buttons, no full-radius cards
- Dense data tables with >6 columns — split views instead
