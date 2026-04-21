# GymGaze Design System
> **Brand Refresh v2.0** — Dark + Lime. Authored by Pixel, April 2026.

## Brand Identity
**Energy. Power. Results.**

GymGaze is built for the fitness industry — where performance matters and aesthetics drive engagement. Our visual language mirrors the high-performance gym experience: dark, precise, and electrifying. The new aesthetic is cyber-futuristic — think Orion dashboards, radial dials, glass cards, and a single electric accent that commands attention.

---

## Color Palette

> **All orange (#FF6B35) and red brand colors have been removed.** Lime green is the sole accent color across both the admin panel and partner portal. There is no light theme.

### Base Scale
```
Base:              #0A0A0A  — near-black, primary background
Surface:           #141414  — card backgrounds
Surface Elevated:  #1E1E1E  — modals, dropdowns, overlays
Border Subtle:     #2A2A2A  — default dividers and card borders
Border Strong:     #3A3A3A  — emphasized borders, focused separators
```

### Text
```
Text Primary:      #FFFFFF  — headings, primary labels
Text Secondary:    #A3A3A3  — secondary labels, metadata
Text Muted:        #666666  — hints, placeholders, disabled
```

### Accent — Lime
```
Accent Lime:       #D4FF4F  — primary actions, highlights, focus rings, radial progress
Accent Lime Hover: #C8F438  — hover state for lime elements
Accent Lime Muted: #D4FF4F20 — soft background fills, hover overlays, tag backgrounds
```

### Semantic Colors
> Semantic colors are greyscale-first. Orange and red are removed from all status indicators.
```
Success:           #D4FF4F  — use lime (active, completed, healthy states)
Warning:           #FFFFFF  — white text, bold weight (attention, not danger)
Error/Destructive: #EF4444  — ONLY for truly destructive confirmations (delete dialogs)
                              NOT used in status badges, indicators, or tables
Info:              #A3A3A3  — neutral informational text/icons
```

### Usage Rules
- **Lime is the ONLY accent color.** It appears on: primary buttons, focus states, active nav items, progress rings, stat highlights, selected states.
- **Red (#EF4444) is reserved for destructive action confirmations only** — delete modals, irreversible warnings. It does not appear in status pills, badges, or tables.
- **There is no orange in the system.** Any existing #FF6B35 references are retired.
- **There is no white-label color system.** Partners upload a logo only. The platform is always dark + lime.

---

## Typography

### Font Families
```
Display / Headings: Inter Tight (Google Fonts)
  Weight: 700–800
  Tracking: -0.02em to -0.04em (tight)
  Use: All headings, hero numbers, display text

Body: Inter (Google Fonts)
  Weight: 400–500
  Use: Paragraphs, labels, UI copy, form text

Numeric / Stats: Inter Tight
  Weight: 700
  Feature: tabular-nums (font-variant-numeric: tabular-nums)
  Use: Revenue figures, counters, percentages, stat tiles

Monospace: JetBrains Mono
  Use: IDs, codes, timestamps (admin internals)
```

### Type Scale
```
Display:    48px / 56px — Inter Tight 800, tracking -0.04em
H1:         36px / 44px — Inter Tight 700, tracking -0.03em
H2:         30px / 38px — Inter Tight 700, tracking -0.02em
H3:         24px / 32px — Inter Tight 700
H4:         20px / 28px — Inter Tight 700
H5:         18px / 24px — Inter Tight 600
Body Large: 16px / 24px — Inter 500
Body:       14px / 20px — Inter 400
Body Small: 12px / 16px — Inter 400
Caption:    10px / 12px — Inter 400, uppercase, tracking +0.06em
Stat Large: 32px / 40px — Inter Tight 700, tabular-nums
Stat XL:    48px / 56px — Inter Tight 800, tabular-nums
```

### Typography Hierarchy
- **Admin**: Inter Tight for all headings and stat numbers; Inter for body/labels
- **Partner Portal**: Same — dark theme, same fonts, same hierarchy (no light variant)
- **Mobile**: Body minimum 16px; line-height increased by 2px; touch-friendly label sizing

---

## Spacing System

### Base Unit: 4px
```
0:  0px
1:  4px
2:  8px
3:  12px
4:  16px
5:  20px
6:  24px
7:  28px
8:  32px
10: 40px
12: 48px
16: 64px
20: 80px
24: 96px
32: 128px
```

### Grid System
```
Mobile:    4px grid, 16px margins
Tablet:    8px grid, 24px margins
Desktop:   8px grid, 32px margins
Max width: 1440px (admin), 1280px (partner)
```

---

## Components

### Buttons

#### Primary Button (Lime)
```
Background:     #D4FF4F
Text:           #000000  — black on lime for contrast
Border:         transparent
Padding:        12px 24px
Border-radius:  rounded-full (pill) for top-level CTAs
                rounded-xl (12px) for inline form actions
Font:           Inter 600, 14px
Hover:          #C8F438
Active:         scale(0.97)
Disabled:       opacity 0.3, cursor not-allowed
```

#### Secondary Button
```
Background:     transparent
Text:           #FFFFFF
Border:         1px solid #3A3A3A
Padding:        12px 24px
Border-radius:  same as primary context (pill or xl)
Font:           Inter 500, 14px
Hover:          background #1E1E1E, border #D4FF4F
Active:         opacity 0.8
```

#### Destructive Button
```
Background:     #EF4444
Text:           #FFFFFF
Border:         transparent
Padding:        12px 24px
Border-radius:  12px
Font:           Inter 500, 14px
Use:            Only in delete confirmation modals
```

### Cards
```
Background:     #141414
Border:         1px solid #2A2A2A
Border-radius:  16px (rounded-2xl)
Padding:        24px
Shadow:         none by default (dark themes don't need elevation shadow)
Hover:          border-color #3A3A3A, subtle transition 150ms
Glass variant:  background rgba(255,255,255,0.04), backdrop-filter blur(12px)
                border 1px solid rgba(255,255,255,0.08)
```

### Stat Tiles
```
Background:     #141414 (card base)
Border:         1px solid #2A2A2A
Border-radius:  16px
Padding:        24px
Label:          Inter 400, 11px, uppercase, letter-spacing +0.08em, #666666
                — label sits ABOVE the number
Large Number:   Inter Tight 700, 32px–48px, tabular-nums, #FFFFFF
Trend:          Inter 500, 12px
  Positive:     #D4FF4F (lime)
  Neutral:      #666666
  Negative:     #A3A3A3 (greyscale — no red in stat tiles)
Accent line:    optional 2px left border in #D4FF4F for highlighted tiles
```

### Progress Rings (Radial Dials)
```
Track:          #2A2A2A (dark circle)
Fill stroke:    #D4FF4F (lime)
Background:     transparent
Percentage:     Inter Tight 700, tabular-nums, centered inside ring
Ring thickness: 4px–8px depending on size
Sizes:
  Small:        40px diameter
  Medium:       80px diameter
  Large:        120px diameter
Animation:      stroke-dashoffset transition 600ms ease-out
```

### Pills / Chips / Filters
```
Background:     #141414
Border:         1px solid #2A2A2A
Border-radius:  rounded-full
Padding:        6px 14px
Font:           Inter 500, 13px
Text:           #A3A3A3
Hover:          border #3A3A3A, text #FFFFFF
Active/selected: background #D4FF4F20, border #D4FF4F, text #D4FF4F
```

### Tables
```
Header background:  #141414
Header text:        #666666, uppercase, 11px, tracking +0.06em
Row background:     transparent
Row divider:        1px solid #1E1E1E (very subtle)
Row hover:          background rgba(212,255,79,0.04) — lime tint
Row selected:       background #D4FF4F20, left accent 2px solid #D4FF4F
Cell text:          #FFFFFF (primary col), #A3A3A3 (secondary cols)
Padding:            16px horizontal, 14px vertical
```

### Forms
```
Label:              Inter 500, 12px, #666666, uppercase, tracking +0.04em
Input background:   #0A0A0A
Input border:       1px solid #2A2A2A
Input border-radius: 10px
Input padding:      12px 16px
Input text:         #FFFFFF
Input focus:        border 1px solid #D4FF4F, ring 0 0 0 3px #D4FF4F20
Placeholder:        #3A3A3A
Error border:       1px solid #EF4444
Error text:         #EF4444, 12px
Disabled:           opacity 0.4
```

### Badges / Status Pills
```
Active:    background #D4FF4F20, text #D4FF4F, border 1px solid #D4FF4F40
Pending:   background #FFFFFF10, text #FFFFFF, border 1px solid #FFFFFF20
Inactive:  background #2A2A2A, text #666666, border none
Offline:   background #2A2A2A, text #A3A3A3, border none
Border-radius: rounded-full
Padding:   3px 10px
Font:      Inter 500, 11px, uppercase, tracking +0.06em

Note: No orange or red status badges. Destructive states (rejected, deleted)
use greyscale (Inactive styling) everywhere except the delete confirmation modal.
```

### Icons
```
Library:      Lucide React (lucide-react)
Size:         16px (small), 20px (default), 24px (large)
Color:        inherit from context; accent interactions use #D4FF4F
Stroke-width: 1.5px (lighter, more refined feel on dark backgrounds)
```

### Photo Grid
```
Gap:          12px
Aspect ratio: 16:9 (landscape), 1:1 (square thumbnails)
Border-radius: 12px
Overlay:       gradient rgba(0,0,0,0) → rgba(0,0,0,0.6) on hover
Hover:         scale(1.02), transition 200ms
Selected:      3px solid #D4FF4F, scale(0.99)
```

### Upload Zone
```
Background:   #D4FF4F08
Border:       2px dashed #D4FF4F40
Border-radius: 16px
Padding:      48px
Min-height:   200px
Drag over:    background #D4FF4F15, border #D4FF4F
Icon:         CloudUpload, 48px, #D4FF4F
Text:         Inter 500, 16px, #A3A3A3
```

---

## Layout Patterns

### Admin Dashboard
- **Structure**: Fixed sidebar (240px) + main content
- **Sidebar**: Dark (#0A0A0A), active item uses lime accent
- **Header**: 64px height, sticky, border-bottom 1px solid #1E1E1E
- **Content**: Responsive grid, max 12 columns
- **Spacing**: 24px between sections

### Partner Portal
- **Structure**: Top navigation + main content
- **Theme**: Dark — same visual language as admin, NOT a light theme
- **Header**: 72px height, partner logo uploaded by partner (logo only)
- **Navigation**: Horizontal pill tabs, active state lime
- **Content**: Responsive grid, max 10 columns
- **Spacing**: 32px between sections

### Mobile Patterns
- **Navigation**: Bottom tab bar (5 items max), active tab lime
- **Cards**: Full width, 16px margins
- **Buttons**: Full width primary actions
- **Forms**: Single column, large touch targets (min 44px)
- **Spacing**: Increased by 4px for touch comfort

---

## Partner Branding Policy

> **Partners do NOT get brand color customization. The platform is always dark + lime.**

Partners can:
- Upload a logo (displayed in the portal header)
- That's it.

Partners cannot:
- Change the accent color
- Change the theme
- Override component colors
- Apply white-label CSS variables

The `--brand-primary` CSS variable system has been **removed**. The GymGaze platform has a single, unified visual identity.

---

## Accessibility

### Contrast Requirements
- **AA Compliance**: 4.5:1 for normal text, 3:1 for large text
- **Lime on black** (#D4FF4F on #0A0A0A): ~12:1 — excellent contrast ✓
- **White on dark** (#FFFFFF on #141414): ~13:1 — excellent ✓
- **Secondary text** (#A3A3A3 on #0A0A0A): ~5.8:1 — AA compliant ✓
- **Focus indicators**: 3px ring in #D4FF4F20 + 1px border #D4FF4F
- **Interactive elements**: Minimum 44px touch target
- **Screen readers**: Semantic HTML, ARIA labels on icon-only buttons

### Color Usage Guidelines
- **Never rely on color alone**: Pair with icons and text for state communication
- **Error states**: Use #EF4444 + icon + text (destructive confirmations only)
- **Success states**: Lime + icon + text
- **Status indicators**: Use label text + subtle greyscale background

---

## Motion & Animation

### Transitions
```
Micro-interactions:  150ms ease-out
Hover states:        150ms ease-out
Panel/drawer open:   250ms cubic-bezier(0.4, 0, 0.2, 1)
Page transitions:    300ms cubic-bezier(0.4, 0, 0.2, 1)
Progress rings:      600ms ease-out (stroke-dashoffset)
```

### Animations
- **Loading**: Subtle pulse on skeleton screens (bg #1E1E1E → #2A2A2A)
- **Success**: Brief lime checkmark flash
- **Upload**: Lime progress bar with smooth fill
- **Hover**: Scale and border-color transitions
- **Radial progress**: Animated stroke draw on mount

---

## Responsive Breakpoints
```
Mobile:  320px – 767px
Tablet:  768px – 1023px
Desktop: 1024px – 1279px
Large:   1280px+
```

### Adaptive Patterns
- **Mobile-first**: Design for smallest screen first
- **Progressive enhancement**: Add features for larger screens
- **Touch optimization**: Larger targets on mobile
- **Performance**: Lazy load images, optimize assets

---

## Design Principles

1. **Dark is the default.** No light theme. No toggle. The platform has one look.
2. **One accent, used with intention.** Lime (#D4FF4F) is the only accent. Reserve it for actions, progress, and active states — not decoration.
3. **Bold numbers, quiet chrome.** Stats and data should dominate. UI chrome should recede.
4. **Clarity always.** Dense views must stay scannable. Labels above numbers. Uppercase micro-labels. Generous line-height.
5. **Confidence through restraint.** Fewer colors, stronger hierarchy. The design system doesn't need orange to have energy.

---

## Implementation Notes

### For Bolt
- Remove all CSS custom property overrides for `--brand-primary` and related vars
- Use CSS variables for the new dark palette (see color tokens above)
- Load Inter and Inter Tight from Google Fonts
- Install Lucide React for icons (stroke-width: 1.5)
- `font-variant-numeric: tabular-nums` on all stat/revenue numbers
- Glass card variant: `backdrop-filter: blur(12px)` + semi-transparent background
- Radial progress: SVG `stroke-dasharray` / `stroke-dashoffset` technique

### Component Structure
```
/components
  /atoms
    Button.tsx
    Badge.tsx
    Icon.tsx
    ProgressRing.tsx
    Chip.tsx
  /molecules
    StatCard.tsx
    PhotoCard.tsx
    SearchBar.tsx
    FilterPills.tsx
  /organisms
    DataTable.tsx
    PhotoGrid.tsx
    RevenueChart.tsx
  /templates
    AdminLayout.tsx
    PartnerLayout.tsx
```

### State Management
- **Theme**: Single dark theme, no toggle needed
- **Partner brand**: Logo URL only (fetched from API, no color injection)
- **Layout**: React state for sidebar collapse
- **Data**: Fetch from API, optimistic updates
