# GymGaze — `/admin/analytics` Page Spec

**Version:** 1.0  
**Author:** Nova (Product Strategist)  
**Date:** 2026-04-21  
**Status:** Ready for build

---

## 1. Page Overview

### Purpose
The `/admin/analytics` page is the central command dashboard for the GymGaze operations team. It surfaces revenue performance, venue utilisation, campaign health, and photo compliance into a single, filterable view. It replaces the need to cross-reference raw Supabase tables for monthly reporting.

### Who Uses It
| Role | Use Case |
|------|----------|
| **GymGaze Admin** | Primary audience. Reviews monthly revenue, tracks MoM growth, identifies underperforming venues, manages cash flow forecasting. |
| *(Future)* **GymGaze Finance** | Pull period summaries for invoicing and partner reporting. |

> **Note:** This page is `admin`-role-gated. Owners and managers do not see it.

### Decisions It Enables
- Which venues are generating the most / least revenue?
- Is total revenue growing month-over-month?
- What proportion of revenue comes from rentals vs. revenue share?
- Which campaigns are active and how does revenue correlate with campaign periods?
- Are venues well-utilised (high member count / entries)?
- Are venue photo submissions being approved on time?
- Are there venues with expiring or missing contracts?

---

## 2. KPI Summary Row

Displayed as a horizontal row of 4–6 stat tiles at the top of the page, above all charts. Each tile shows a primary number + a secondary label + a delta badge (MoM change where applicable).

| # | Tile Title | Primary Value | Delta | Source |
|---|-----------|---------------|-------|--------|
| 1 | **Total Revenue (MTD)** | Sum of `rental_zar + revenue_share_zar` for the current month | vs. prior month (%) | `revenue_entries` |
| 2 | **Total Rental Income** | Sum of `rental_zar` for selected period | vs. prior period (%) | `revenue_entries` |
| 3 | **Total Revenue Share** | Sum of `revenue_share_zar` for selected period | vs. prior period (%) | `revenue_entries` |
| 4 | **Active Venues** | Count of venues with `status = 'active'` | vs. prior month count | `venues` |
| 5 | **Active Campaigns** | Count of campaigns where `start_date <= today <= end_date` | none | `campaigns` |
| 6 | **Photo Compliance Rate** | `(approved photos / total submitted photos) * 100` for current month (%) | vs. prior month (pp delta) | `venue_photos` |

### Tile Design Rules
- Each tile: white card, subtle shadow, 24px primary number, 12px label below, coloured delta badge (green = positive, red = negative, grey = neutral/no data).
- Delta badge format: `↑ 12%` / `↓ 4%` / `— no data`.
- Tiles respect the global date range filter (except "Active Venues" which is always current).
- Clicking a tile does nothing (no drill-down in v1).

---

## 3. Chart Specs

### Chart 1 — Revenue Trend (12 Months)

| Property | Value |
|----------|-------|
| **Chart type** | Area chart (smooth curves, semi-transparent fill) |
| **Title** | "Monthly Revenue — Last 12 Months" |
| **X axis** | Month labels: `MMM YYYY` (e.g. "Apr 2026") — 12 data points |
| **Y axis** | ZAR amount (formatted: `R 12 500`) |
| **Series** | Two stacked areas: `Rental Income` (primary brand colour) and `Revenue Share` (accent colour). Also show a `Total` line overlay in a darker stroke. |
| **Data source** | `revenue_entries`: group by `month`, sum `rental_zar` (rental series) and `revenue_share_zar` (share series). Join to `venues` only if venue filter is active. |
| **Default time range** | Last 12 calendar months (rolling) |
| **Filter options** | Global date range filter (min 3 months, max 36 months). Global venue / brand filter narrows the venue set. |
| **Tooltip** | On hover: month label, Rental: R x,xxx, Revenue Share: R x,xxx, Total: R x,xxx |
| **Empty state** | Dashed border placeholder with text: "No revenue data for this period. Add entries via Revenue Management." + CTA button → `/admin/revenue` |

---

### Chart 2 — Rental vs Revenue Share Split

| Property | Value |
|----------|-------|
| **Chart type** | Donut chart (2 segments) |
| **Title** | "Income Split — Rental vs Revenue Share" |
| **Segments** | `Rental Income` / `Revenue Share` |
| **Centre label** | Total ZAR for the period (e.g. `R 84 200`) |
| **Legend** | Below chart: segment name + ZAR value + % of total |
| **Data source** | `revenue_entries`: sum `rental_zar` and `revenue_share_zar` for the filtered period |
| **Default time range** | Current month (MTD); respects global date range filter |
| **Filter options** | Global date range, venue, brand |
| **Tooltip** | On hover: segment name, R value, % of total |
| **Empty state** | Grey placeholder donut with label: "No data — enter revenue for this period." |

---

### Chart 3 — Top Venues by Revenue

| Property | Value |
|----------|-------|
| **Chart type** | Horizontal bar chart (bars ordered descending by total revenue) |
| **Title** | "Top Venues by Total Revenue" |
| **X axis** | ZAR amount (formatted: `R 0` → `R 50 000`) |
| **Y axis** | Venue name (show top 10 by default; "Show all" toggle if >10) |
| **Bar colour** | Single colour (primary brand). Bar label shows exact R value at end of bar. |
| **Data source** | `revenue_entries` joined to `venues` (via `venue_id`): group by `venue_id`, sum `rental_zar + revenue_share_zar` as `total_revenue`. Order DESC. Limit 10. |
| **Default time range** | Current calendar year (YTD) |
| **Filter options** | Global date range, brand filter (filters venue set). Venue filter not applicable here (would render 1 bar). |
| **Tooltip** | On hover: venue name, city, total revenue R x,xxx, rental R x,xxx, share R x,xxx |
| **Empty state** | "No revenue data for the selected period." with placeholder bar skeleton (3 greyed bars). |

---

### Chart 4 — Campaign Activity Over Time

| Property | Value |
|----------|-------|
| **Chart type** | Area chart (step or smooth) with secondary axis showing active campaign count |
| **Title** | "Campaign Activity & Revenue Overlap" |
| **X axis** | Month labels: `MMM YYYY` |
| **Y axis (left)** | Total revenue (ZAR) — same series as Chart 1 (line, not filled) |
| **Y axis (right)** | Active campaign count per month (filled area, secondary colour) |
| **Series** | `Revenue` (line, primary) + `Active Campaigns` (area, secondary, 40% opacity) |
| **Active campaign count logic** | For each month, count campaigns from `campaigns` where `start_date <= last_day_of_month AND end_date >= first_day_of_month`. |
| **Data source** | `campaigns` (start_date, end_date, amount_charged_zar) + `revenue_entries` (month, rental_zar, revenue_share_zar). No join needed; two independent series on the same time axis. |
| **Default time range** | Last 12 months |
| **Filter options** | Global date range only (campaigns are not venue-scoped in this chart; venue filter disables campaigns series gracefully) |
| **Tooltip** | On hover: month, Revenue R x,xxx, Active Campaigns: N |
| **Empty state** | "No campaign or revenue data. Add campaigns in Campaign Management." |

---

### Chart 5 — Venue Utilisation (Members)

| Property | Value |
|----------|-------|
| **Chart type** | Vertical grouped bar chart |
| **Title** | "Venue Utilisation — Active Members" |
| **X axis** | Venue name (show up to 15; paginate or scroll if more) |
| **Y axis** | Member count |
| **Bars per venue** | Single bar = `active_members` from `venues` table (current snapshot; not time-series) |
| **Colour coding** | Gradient or threshold colouring: < 100 members = amber, 100–500 = teal, > 500 = green |
| **Data source** | `venues`: `name`, `active_members`, `city`, `status`. Filter `status = 'active'`. |
| **Default time range** | Not applicable (snapshot data). Date filter disabled for this chart. |
| **Filter options** | Brand filter (gym_brand_id). Venue filter highlights selected venue's bar. |
| **Tooltip** | On hover: venue name, city, active members: N, daily entries: N, monthly entries: N |
| **Empty state** | "No active venues found." |
| **Secondary stat** | Below chart: "Network total: X active members across Y venues" |

---

### Chart 6 — Photo Compliance Rate

| Property | Value |
|----------|-------|
| **Chart type** | Donut chart with inner percentage + small per-venue breakdown list below |
| **Title** | "Photo Compliance Rate" |
| **Segments** | `Approved`, `Pending`, `Rejected` (3 segments, traffic-light colours: green / amber / red) |
| **Centre label** | Approval rate % (e.g. `78%`) |
| **Data source** | `venue_photos`: group by `status`, count rows. Filter by `month` (respects global date range → uses most recent month in range if multiple months selected). Optionally join `venues` for venue-level breakdown. |
| **Default time range** | Current month |
| **Filter options** | Global date range (month selector), venue filter, brand filter |
| **Below-chart list** | Table of up to 5 venues with lowest compliance: Venue Name | Submitted | Approved | Rate%. Sorted ASC by rate. Link → venue detail page. |
| **Tooltip** | On hover: status label, count, % of total submitted |
| **Empty state** | "No photos submitted for this period." |

---

### Chart 7 — Month-over-Month Revenue Growth

| Property | Value |
|----------|-------|
| **Chart type** | Single large stat tile with sparkline (mini line chart, 12 data points) |
| **Title** | "MoM Revenue Growth" |
| **Primary value** | Growth % vs prior month: `((current_month_revenue - prior_month_revenue) / prior_month_revenue) * 100`, formatted as `+12.4%` or `-3.1%` |
| **Sparkline** | 12-month rolling MoM growth % — line chart, no axes, no labels. Positive months: green; negative: red. Width ~200px, height ~60px. |
| **Sub-label** | "vs. [Month YYYY]  R x,xxx → R x,xxx" showing prior and current month totals |
| **Colour** | Primary number: green if positive, red if negative, grey if zero/no data |
| **Data source** | `revenue_entries`: sum `rental_zar + revenue_share_zar` grouped by `month`. Compute delta between consecutive months. |
| **Default time range** | Current month vs prior month (sparkline always shows last 12 months) |
| **Filter options** | Global venue/brand filter applies. Date range filter doesn't apply (always shows MoM context). |
| **Empty state** | "Not enough data — at least 2 months of revenue entries required." with disabled sparkline placeholder. |

---

## 4. Global Filters

Filters are displayed in a sticky filter bar immediately below the page header and above the KPI tiles. All charts (except where noted) react to filter changes in real time.

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| **Date Range** | Date range picker (month granularity) | Any range from earliest revenue_entry to today. Max range: 36 months. Presets: "This Month", "Last 3 Months", "Last 6 Months", "Last 12 Months", "This Year", "Custom" | Last 12 months |
| **Gym Brand** | Single-select dropdown | All brands from `gym_brands.name`, plus "All Brands" | All Brands |
| **Venue** | Multi-select dropdown (searchable) | Venues filtered by selected brand. Shows venue name + city. "All Venues" selected by default. | All Venues |

### Filter Interaction Rules
- Selecting a **Gym Brand** automatically scopes the **Venue** dropdown to that brand's venues.
- Clearing the brand filter resets the venue filter to "All Venues".
- Venue utilisation chart (Chart 5) ignores the date range filter (snapshot data).
- MoM Growth tile (Chart 7) ignores the date range filter (always computes last 12 months of MoM).
- All filters persist in the URL as query params (`?from=2025-05&to=2026-04&brand=uuid&venues=uuid1,uuid2`) for shareability.

---

## 5. Layout

### Overall Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  PAGE HEADER: "Analytics"  [Export CSV button — future v2]      │
├─────────────────────────────────────────────────────────────────┤
│  FILTER BAR: [Date Range ▼]  [Gym Brand ▼]  [Venues ▼]         │
├─────────────────────────────────────────────────────────────────┤
│  KPI TILES ROW (6 tiles, equal width, 1 row on desktop)         │
│  [ Total Revenue ][ Rental Income ][ Rev Share ][ Active ][ Campaigns ][ Photo % ] │
├──────────────────────────────┬──────────────────────────────────┤
│  CHART 1: Revenue Trend      │  CHART 2: Income Split           │
│  (Area, 12 months)  [2/3 w]  │  (Donut)              [1/3 w]   │
├──────────────────────────────┴──────────────────────────────────┤
│  CHART 3: Top Venues by Revenue                                  │
│  (Horizontal bar, full width)                                    │
├──────────────────────────────┬──────────────────────────────────┤
│  CHART 4: Campaign Activity  │  CHART 7: MoM Growth             │
│  (Area + line)    [2/3 w]    │  (Stat + sparkline)   [1/3 w]   │
├──────────────────────────────┬──────────────────────────────────┤
│  CHART 5: Venue Utilisation  │  CHART 6: Photo Compliance       │
│  (Bar chart)      [2/3 w]    │  (Donut + list)       [1/3 w]   │
└──────────────────────────────┴──────────────────────────────────┘
```

### Grid System
- **Desktop (≥1280px):** 12-column grid, 24px gutter. Wide charts = 8 cols, narrow charts = 4 cols. Full-width chart = 12 cols.
- **Tablet (768–1279px):** Charts stack to full width (12 cols each), except KPI tiles wrap to 2 rows of 3.
- **Mobile (<768px):** Single column. KPI tiles = 2 per row (3 rows). All charts full width. Horizontal bar chart (Chart 3) scrolls horizontally.

### Card Styling
- Each chart lives in a white card: `border-radius: 12px`, `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`, `padding: 24px`.
- Card header: chart title (semibold, 16px) left-aligned. Optional subtitle/description (12px, muted) below.
- Loading state: skeleton shimmer replaces chart content.
- Error state: red border-left accent + error message + "Retry" button.

---

## 6. Data Notes

### Aggregations & Joins Required

#### Revenue Totals (Charts 1, 2, 3, 7, KPI tiles 1–3)
```sql
-- Monthly revenue per venue
SELECT
  re.venue_id,
  re.month,
  re.rental_zar,
  re.revenue_share_zar,
  (re.rental_zar + re.revenue_share_zar) AS total_revenue,
  v.name AS venue_name,
  v.city,
  gb.name AS brand_name
FROM revenue_entries re
JOIN venues v ON v.id = re.venue_id
JOIN gym_brands gb ON gb.id = v.gym_brand_id
WHERE re.month BETWEEN :start_month AND :end_month
  AND (:brand_id IS NULL OR v.gym_brand_id = :brand_id)
  AND (:venue_ids IS NULL OR re.venue_id = ANY(:venue_ids));
```

#### Active Campaign Count per Month (Chart 4)
```sql
-- Count campaigns active in each calendar month
SELECT
  to_char(gs.month, 'YYYY-MM') AS month,
  COUNT(c.id) AS active_campaign_count
FROM generate_series(
  :start_date::date,
  :end_date::date,
  '1 month'::interval
) AS gs(month)
LEFT JOIN campaigns c
  ON c.start_date <= (gs.month + interval '1 month - 1 day')
  AND c.end_date >= gs.month
GROUP BY gs.month
ORDER BY gs.month;
```

#### Photo Compliance (Chart 6, KPI tile 6)
```sql
SELECT
  vp.status,
  COUNT(*) AS count,
  v.name AS venue_name
FROM venue_photos vp
JOIN venues v ON v.id = vp.venue_id
WHERE vp.month = :target_month
  AND (:brand_id IS NULL OR v.gym_brand_id = :brand_id)
  AND (:venue_ids IS NULL OR vp.venue_id = ANY(:venue_ids))
GROUP BY vp.status, v.name, v.id;
```

#### MoM Growth (Chart 7)
```sql
-- Requires revenue per month, then compute delta in application layer:
-- growth_pct = ((month_N - month_N-1) / month_N-1) * 100
-- Handle division by zero: if prior month = 0, show null/no data
```

### Notes for Bolt
1. **No real-time subscription needed** — analytics data is read-only, fetched on page load + filter change. Use `supabase.rpc()` or standard `select` queries.
2. **Month field format:** `revenue_entries.month` is stored as a `DATE` type (first day of month, e.g. `2026-04-01`). All month-range filters should normalize to first-day-of-month.
3. **Venue filter scoping:** When brand filter is active, venue dropdown should only show venues matching that brand. Enforce this in the query too (don't rely on UI alone).
4. **Missing months:** Not every venue will have a `revenue_entries` row for every month. Treat missing rows as R 0 (zero, not null) when plotting totals.
5. **Currency formatting:** All ZAR values should display as `R 1 234` (space as thousands separator, no decimal for whole rands, R prefix). Use a shared `formatZAR(n)` utility.
6. **Chart library:** Use Recharts (already in the stack per DESIGN.md) — `AreaChart`, `BarChart`, `PieChart`/`Cell` for donut, `ComposedChart` for Chart 4 dual-axis.
7. **Export (v2):** Do not build CSV export in v1. Reserve the button slot in the header layout but leave it disabled/hidden.
8. **Supabase RLS:** Queries run under admin session — ensure RLS policies allow admin role to read all rows in `revenue_entries`, `venues`, `campaigns`, `venue_photos`.
9. **Empty vs loading:** Distinguish between "loading" (skeleton), "no data for filters" (empty state), and "query error" (error state). Each chart handles all three independently.
10. **Performance:** For Chart 3 (top venues), limit to 10 rows by default. The full list should only load if user clicks "Show all". This prevents slow renders for large venue networks.

---

## Appendix — Quick Reference: Data Sources per Chart

| Chart | Tables Used | Key Columns |
|-------|-------------|-------------|
| KPI Tile 1–3 | `revenue_entries` | `rental_zar`, `revenue_share_zar`, `month` |
| KPI Tile 4 | `venues` | `status` |
| KPI Tile 5 | `campaigns` | `start_date`, `end_date` |
| KPI Tile 6 | `venue_photos` | `status`, `month` |
| Chart 1 | `revenue_entries` | `month`, `rental_zar`, `revenue_share_zar` |
| Chart 2 | `revenue_entries` | `rental_zar`, `revenue_share_zar` |
| Chart 3 | `revenue_entries`, `venues` | `venue_id`, total revenue, `name`, `city` |
| Chart 4 | `campaigns`, `revenue_entries` | `start_date`, `end_date`, `month`, totals |
| Chart 5 | `venues` | `name`, `active_members`, `daily_entries`, `monthly_entries` |
| Chart 6 | `venue_photos`, `venues` | `status`, `month`, `venue_id` |
| Chart 7 | `revenue_entries` | `month`, totals (computed MoM delta) |

---

_Spec complete. Ready for Bolt implementation._
