# GymGaze — Concept 1 Refined (Eye Mark)
Generated: 2026-05-25

## Concept
The Eye Mark — abstract minimal angular eye/lens icon. Iris is a lime (#D4FF4F) rectangular screen shape. Sharp geometry, no curves. Wordmark: "GymGaze" in bold condensed sans-serif.

## Iterations

- **A: Full lockup dark** — primary platform logo
  - Path: `/Users/ivralabs/.openclaw/media/tool-image-generation/gymgaze-A-lockup-dark---21c2f0db-1e13-40d1-a5d8-8152eb1e18c8.png`
  
- **B: App icon / favicon**
  - Path: `/Users/ivralabs/.openclaw/media/tool-image-generation/gymgaze-B-appicon---9cd6c359-7938-493d-bc70-6979af822fca.png`

- **C: Stacked dark** — pitch deck / cover page
  - Path: `/Users/ivralabs/.openclaw/media/tool-image-generation/gymgaze-C-stacked-dark---32a8a6ae-ff77-43d6-83a1-4310dfa6ce58.png`

- **D: White/print version** — rate card PDF
  - Path: `/Users/ivralabs/.openclaw/media/tool-image-generation/gymgaze-D-white-print---fb9930d5-0f65-483b-9114-47d0d178a8f9.png`

- **E: Lime bg reversed** — badges, highlights
  - Path: `/Users/ivralabs/.openclaw/media/tool-image-generation/gymgaze-E-lime-reversed---53d97cbe-342e-480a-9552-eea372953274.png`

- **F: Monochrome white** — overlays, watermarks
  - Path: `/Users/ivralabs/.openclaw/media/tool-image-generation/gymgaze-F-monochrome-white---c1feb25f-abc6-4373-94f2-9a1154cbf77b.png`

---

## Usage Guide

| Iteration | Background | Use When |
|-----------|-----------|----------|
| A — Full lockup dark | #0a0a0a | Primary website header, platform UI, dark-mode default |
| B — App icon | #0a0a0a | Favicon, mobile app icon, browser tab, notification badge |
| C — Stacked dark | #0a0a0a | Pitch deck covers, presentation slides, square social media profile |
| D — White/print | White | Rate cards, PDF decks, printed materials, light-background web |
| E — Lime reversed | #D4FF4F | Callout badges, tags, highlighted CTA sections, merch |
| F — Monochrome white | Dark/transparent | Video watermarks, overlays, sponsorship chyrons, embossed print |

---

## Color Palette

| Token | Hex | Use |
|-------|-----|-----|
| Lime Accent | `#D4FF4F` | Iris/screen, CTAs, highlights |
| Near-black | `#0a0a0a` | Primary background |
| Dark | `#111111` | Print text / icon on white |
| White | `#FFFFFF` | Primary text, icon on dark |

---

## Next Steps — Vector Refinement in Figma

1. **Trace the eye mark** — Build as 4-node polygon: left point, top-right, right point, bottom-right. Use stroke or compound path, not a fill outline.
2. **Iris rectangle** — Precisely sized at ~40% of eye width, centered. Use exact `#D4FF4F` fill. No border radius.
3. **Wordmark** — Set in Inter Tight. `Gym` at 400 weight, `Gaze` at 700 weight (or reverse for visual rhythm). Optically align to eye vertical center.
4. **Spacing** — Icon-to-wordmark gap = 1× icon height. Maintain this ratio across all lockup sizes.
5. **Export variants** — SVG (web), PDF (print), PNG @1x/2x/3x (raster), dark/light/lime versions.
6. **Icon grid** — Place B (app icon) on standard 1024×1024 icon grid. Safe zone = 80% of canvas.
7. **Brand token file** — Set up a Figma Variables file with all color tokens for design system use.
