# GymGaze Brand Refresh — Migration Notes
> **Version:** 2.0  
> **Date:** April 2026  
> **Author:** Pixel (Senior UI/UX Designer, GymGaze)  
> **Status:** Approved by Mlu — locked in

---

## Overview

This document describes the visual identity overhaul of GymGaze. The platform is moving from a dual-theme (dark admin + light partner portal) system with orange as the primary brand color to a **unified, single dark theme with lime green as the sole accent**. This applies to both the admin panel and the partner portal.

The aesthetic direction: cyber-futuristic dashboard — dark base, glass/translucent cards, radial progress dials, pill-chip filters, bold display headings, and electric lime green.

---

## What's Being Removed

### Colors Removed
| Token / Usage | Old Value | Reason |
|---|---|---|
| Primary Orange | `#FF6B35` | Entire brand color retired |
| Orange Hover | `#E55A2B` | Retired with orange |
| Orange Active | `#CC4F21` | Retired with orange |
| Orange Light (bg) | `#FFE4D6` | Retired with orange |
| Partner Portal Background | `#F9FAFB` | Light theme removed |
| Partner Surface | `#FFFFFF` | Light theme removed |
| Partner Border | `#E5E7EB` | Light theme removed |
| Partner Text Primary | `#111827` | Light theme removed |
| Warning Amber | `#F59E0B` | Orange-adjacent, removed |
| Warning Dark Amber | `#D97706` | Removed |
| Success Green | `#10B981` | Replaced by lime |
| Success Dark Green | `#059669` | Replaced by lime |
| Info Blue | `#3B82F6` | Removed from brand palette |
| Info Blue Dark | `#2563EB` | Removed from brand palette |
| Error Red (status use) | `#DC2626` | Red removed from status indicators |
| Admin Accent | `#FF6B35` | Replaced by lime |
| Focus Ring | `2px solid #FF6B35` | Replaced by lime ring |
| Selected State | `rgba(255,107,53,0.2)` | Replaced by lime tint |
| Upload Zone Border | `#FF6B35` | Replaced by lime |
| Upload Zone BG | `rgba(255,107,53,0.05)` | Replaced by lime muted |
| White-label `--brand-primary` | `[DYNAMIC]` | Entire system removed |
| White-label `--brand-primary-dark` | `[DYNAMIC]` | Entire system removed |
| White-label `--brand-primary-light` | `[DYNAMIC]` | Entire system removed |

### Systems Removed
- **Light theme (partner portal)**: Fully removed. The partner portal now uses the same dark system as the admin panel.
- **White-label color customization**: Partners no longer receive brand color injection. The `--brand-primary` CSS custom property system is retired. See Partner Branding section below.
- **Dual theme switcher**: No light/dark toggle exists. The platform is always dark.

---

## What Replaces Them

### New Color Tokens
| Token | Value | Usage |
|---|---|---|
| Base | `#0A0A0A` | Primary app background |
| Surface | `#141414` | Cards, panels |
| Surface Elevated | `#1E1E1E` | Modals, dropdowns |
| Border Subtle | `#2A2A2A` | Default card borders, dividers |
| Border Strong | `#3A3A3A` | Emphasized separators |
| Text Primary | `#FFFFFF` | Headings, primary values |
| Text Secondary | `#A3A3A3` | Labels, metadata |
| Text Muted | `#666666` | Hints, placeholders, disabled |
| Accent Lime | `#D4FF4F` | All accent use: buttons, focus, progress, active states |
| Accent Lime Hover | `#C8F438` | Hover state for lime elements |
| Accent Lime Muted | `#D4FF4F20` | Soft backgrounds, selected row tints |
| Success | `#D4FF4F` | Active/healthy/complete — use lime |
| Warning | `#FFFFFF` bold | Attention state — white + bold weight |
| Error/Destructive | `#EF4444` | ONLY in delete confirmation modals |
| Info | `#A3A3A3` | Neutral informational text |

### GymGaze Logo Tile
The GymGaze logo tile background changes from orange (`#FF6B35`) to lime (`#D4FF4F`). Logo text/icon remains on a high-contrast background.

---

## Components That Need Updating

### High Priority — Visual Break Without Update
- [ ] **Primary buttons** — background from #FF6B35 → #D4FF4F, text from #FFFFFF → #000000
- [ ] **Secondary buttons** — border/text from #FF6B35 → switch to greyscale + lime hover
- [ ] **Form focus rings** — from #FF6B35 → #D4FF4F with muted ring
- [ ] **Upload zone** — border and icon from orange → lime
- [ ] **Stat tiles** — gradient overlay with brand color → remove gradient, use flat dark surface + lime accent line
- [ ] **Progress bars / rings** — fill from orange → #D4FF4F
- [ ] **Selected states** (table rows, photo grid) — from orange tint → lime tint
- [ ] **Active nav items** (sidebar, tab nav) — indicator from orange → lime
- [ ] **Badge: Active** — from green (#10B981) → lime (#D4FF4F20 bg, #D4FF4F text)
- [ ] **Badge: Pending** — from amber → greyscale white variant
- [ ] **GymGaze logo tile** — background orange → lime

### Medium Priority — Inconsistency Without Update
- [ ] **Partner portal layout** — migrate from light theme scaffolding to dark base
- [ ] **Partner portal header** — remove white/light header background
- [ ] **Partner portal tables** — light row colors → dark equivalents
- [ ] **Partner portal forms** — light inputs → dark inputs
- [ ] **Photo grid selection** — orange ring → lime ring
- [ ] **Revenue chart colors** — remove orange accent line, use lime
- [ ] **Campaign status badges** — audit all status pill colors

### Low Priority — Polish
- [ ] **Icon stroke-width** — update from 2px → 1.5px across all Lucide icons
- [ ] **Skeleton screens** — update pulse range to dark palette (#1E1E1E → #2A2A2A)
- [ ] **Empty state illustrations** — remove any orange accents
- [ ] **Tooltip backgrounds** — ensure dark surface, no light variant
- [ ] **Toast notifications** — ensure dark bg, lime for success

### CSS Custom Properties to Remove
```css
/* DELETE THESE — white-label system is retired */
--brand-primary
--brand-primary-dark
--brand-primary-light
--brand-logo-url (keep --partner-logo-url for logo-only injection)
.brand-primary { color: var(--brand-primary); }
.brand-bg-primary { background-color: var(--brand-primary); }
.brand-border-primary { border-color: var(--brand-primary); }
```

---

## Partner Branding Policy (Updated)

### What Changed
The white-label color customization system has been **fully removed** by decision of Mlu.

### Old System (Retired)
- Partners could inject `--brand-primary` color
- Buttons, headers, accents would reflect partner brand color
- Multiple visual identities existed simultaneously

### New System
- **Partners upload a logo only.** That logo is displayed in the portal header.
- The platform's visual language is always dark + lime, regardless of which partner is logged in.
- There are no CSS variable overrides for partners.
- The partner's identity is expressed through their logo, not through platform color theming.

### Rationale
- Simplifies the design system dramatically
- Creates a stronger, more distinctive GymGaze brand identity
- Eliminates QA overhead of testing N partner color combinations
- Consistent experience for managers moving between partner portals

### Implementation Change for Bolt
Remove the brand injection logic:
```
// Remove: fetchBrandConfig() → applyCSSVariables() flow
// Keep: fetchPartnerLogo() → render in header
```

---

## Migration Checklist for Bolt

### Phase 1 — Color System
- [ ] Remove all `#FF6B35` instances from CSS/Tailwind config
- [ ] Remove `--brand-primary` and related custom properties
- [ ] Add new dark palette tokens to Tailwind/CSS config
- [ ] Add `accent-lime` and `accent-lime-muted` tokens

### Phase 2 — Admin Panel
- [ ] Update primary button component
- [ ] Update secondary button component  
- [ ] Update all focus ring styles
- [ ] Update stat tiles (remove gradient, add flat surface)
- [ ] Update sidebar active state
- [ ] Update progress bars and rings
- [ ] Update table hover and selected states
- [ ] Update status badges

### Phase 3 — Partner Portal
- [ ] Rebuild portal layout with dark base (#0A0A0A)
- [ ] Remove light theme classes (bg-white, bg-gray-50, text-gray-900, etc.)
- [ ] Apply dark surface for all partner portal components
- [ ] Update partner header to dark, show uploaded logo only
- [ ] Remove brand color injection logic
- [ ] Keep partner logo URL injection (logo-only)

### Phase 4 — GymGaze Logo
- [ ] Update logo tile from orange background → lime background

### Phase 5 — QA
- [ ] Grep codebase for `#FF6B35`, `#E55A2B`, `#F59E0B`, `#10B981`, `#3B82F6` — resolve all
- [ ] Grep for `--brand-primary` — should be zero remaining instances
- [ ] Visual review: dark theme consistency across all 16 screens
- [ ] Accessibility check: lime contrast ratios on dark backgrounds

---

## Sign-Off

This brand refresh was designed and specified by **Pixel** (Senior UI/UX Designer) based on direction from **Mlu**, April 2026.

Decisions locked:
1. ✅ Dark theme end-to-end — admin AND partner portal
2. ✅ All orange and red removed from brand system
3. ✅ Lime green (#D4FF4F) is the only accent color
4. ✅ GymGaze logo tile: orange → lime
5. ✅ No white-labeling of brand colors — partners upload logo only

Implementation by Bolt. Questions? See `DESIGN.md` for full system specification.

— **Pixel** ✏️
