# GymGaze Admin Navigation Audit
> Audited by Nova 🧠 | 2026-05-25
> Platform: Gym venue management + DOOH ad network
> Two portals: `/admin/*` (Admin & Sales) + `/portal/*` (Gym Partners/Managers)

---

## 1. Current Sidebar Structure

| Group | Slug | Label | Route |
|-------|------|-------|-------|
| SELL | `rate-card` | Rate Card | /admin/rate-card |
| SELL | `insights` | Insights | /admin/insights |
| SELL | `media-kit` | Media Kit | /admin/media-kit |
| SELL | `pipeline` | Pipeline | /admin/pipeline |
| SELL | `contacts` | Contacts | /admin/contacts |
| OVERVIEW | `dashboard` | Dashboard | /admin/dashboard |
| OVERVIEW | `networks` | Networks | /admin/networks |
| VENUES & SCREENS | `venues` | Venues | /admin/venues |
| VENUES & SCREENS | `screens` | Screens | /admin/screens |
| VENUES & SCREENS | `static-sites` | Static Sites | /admin/static-sites |
| VENUES & SCREENS | `inventory` | Inventory | /admin/inventory |
| CAMPAIGNS | `campaigns` | Campaigns | /admin/campaigns |
| CAMPAIGNS | `sponsorships` | Sponsorships | /admin/sponsorships |
| FINANCE | `revenue` | Revenue | /admin/revenue |
| REPORTING | `analytics` | Analytics | /admin/analytics |
| REPORTING | `photos` | Proof Of Flight | /admin/photos |
| ACCOUNT | `settings` | Settings | /admin/settings |

**Total: 17 nav items across 7 groups**

---

## 2. Per-Item Audit

### SELL Group

---

#### Rate Card (`/admin/rate-card`)
- **What it does:** Calculates pricing estimates based on venue selection and pricing tiers from the `pricing_tiers` table. Pulls venue member/entry counts + active screens to compute CPM-based rates. Has copy/print capability.
- **Who uses it:** Sales reps primarily. Also admin for reference.
- **Roles with access:** `sales`, `admin`
- **Essential?** ✅ Yes — core sales tool before any client pitch
- **Complete?** Appears functional. Pricing tier data drives it; has copy/print UI.
- **Merge candidate?** Could be a tab inside a "Sales Hub" but strong enough to stand alone.
- **Recommendation:** **KEEP + IMPROVE** — Add ability to export as PDF, email directly to client, and save quotes. Currently appears read-only with no quote-saving.

---

#### Insights (`/admin/insights`)
- **What it does:** Rich audience data hub — demographics per network/venue (gender split, age brackets, dwell time), foot traffic heatmaps, campaign impact estimator, network growth timeline. Also generates shareable insight links (tokenised, PIN-protected, expiring).
- **Who uses it:** Sales reps use it to support pitches; admin for overview.
- **Roles with access:** `sales`, `admin`, `viewer`
- **Essential?** ✅ Yes — differentiated selling tool, especially the shareable links feature
- **Complete?** Well-built. Has multiple sub-features (AgencyDeckPreview, FootTrafficHeatmap, CampaignImpactEstimator, NetworkGrowthTimeline).
- **Merge candidate?** No — too feature-rich to merge
- **Recommendation:** **KEEP AS-IS** — Strong page. Consider renaming to "Audience & Data" to be more descriptive for new sales reps.

---

#### Media Kit (`/admin/media-kit`)
- **What it does:** Generates a client-facing media kit with network stats (venue count, screen count, audience demographics). Pulls pricing tiers, enquiry data, and gym brand audience data. Shareable/downloadable.
- **Who uses it:** Sales reps to send to prospects.
- **Roles with access:** `sales`, `admin`
- **Essential?** ✅ Yes — standard ad sales collateral tool
- **Complete?** Functional — fetches active venue/screen counts + brands + pricing tiers + enquiries.
- **Merge candidate?** Could live under "Insights" as a tab (both are client-facing sales tools), but the use case differs enough to keep separate.
- **Recommendation:** **KEEP AS-IS** — Solid. Potential improvement: ability to customise per-client/network before sharing.

---

#### Pipeline (`/admin/pipeline`)
- **What it does:** Kanban-style (or list) view of `pipeline_deals` table. Stages: prospect → proposal_sent → negotiating → closed_won → closed_lost. Shows deal value, creator, expected close date. Links to campaigns.
- **Who uses it:** Sales reps to track their deals; admin to see overall pipeline.
- **Roles with access:** `sales`, `admin`
- **Essential?** ✅ Yes — fundamental for a revenue-generating sales team
- **Complete?** Functional. Has deal CRUD, stage tracking, creator attribution. Missing: revenue forecasting overlay, pipeline value total, conversion rate stats.
- **Merge candidate?** No — pipeline deserves its own space
- **Recommendation:** **KEEP + IMPROVE** — Add pipeline value totals (total open value, weighted forecast), conversion %, and a link/flow from Pipeline deal → Create Campaign.

---

#### Contacts (`/admin/contacts`)
- **What it does:** Aggregates contacts from the `campaigns` table — deduplicated by email, showing contact name, phone, client type, campaign count, total spend.
- **Who uses it:** Sales reps to manage client relationships.
- **Roles with access:** `sales`, `admin`
- **Essential?** 🟡 Nice-to-have right now — it's a derived view of campaign data, not a true CRM.
- **Complete?** Half-built — read-only, no contact notes, no tagging, no follow-up reminders. Just a deduplicated list from campaigns.
- **Merge candidate?** ✅ Yes — could be a tab inside Pipeline ("Contacts" tab next to deals)
- **Recommendation:** **MERGE INTO Pipeline** — Put as a "Contacts" tab on the Pipeline page. Save a nav slot. Upgrade to allow notes/tags when time permits.

---

### OVERVIEW Group

---

#### Dashboard (`/admin/dashboard`)
- **What it does:** Role-aware home screen. For admins: monthly target progress, pending photo approvals, campaign stats. For sales reps: personal target, MTD revenue, their campaign count. Commission card included.
- **Who uses it:** All roles on login.
- **Roles with access:** `admin`, `manager`, `viewer`
- **Essential?** ✅ Yes — the front door of the platform
- **Complete?** Well-built. Role-aware rendering is a nice touch. Slightly admin-heavy.
- **Merge candidate?** No
- **Recommendation:** **KEEP + IMPROVE** — Add a sales rep view that's more motivating (leaderboard? deal stage summary? next steps). Currently feels like an admin stat dump when viewed as a sales rep.

---

#### Networks (`/admin/networks`)
- **What it does:** Lists all gym brands (`gym_brands` table) with revenue summaries, venue counts, photo approval status per month. Drill-down to per-network detail with revenue chart.
- **Who uses it:** Admin primarily to track network health.
- **Roles with access:** `admin`
- **Essential?** ✅ Yes — critical for managing the supplier (gym brand) side of the business
- **Complete?** Functional. Has add/edit, detail pages, revenue chart.
- **Merge candidate?** Could be a tab under Venues but the revenue/brand management angle makes it distinct
- **Recommendation:** **KEEP AS-IS**

---

### VENUES & SCREENS Group

---

#### Venues (`/admin/venues`)
- **What it does:** Grid/list of all gym venue locations with member stats, screen counts, photo status, brand affiliation. Full CRUD with add-venue form and per-venue detail tabs.
- **Who uses it:** Admin, manager (read), sales (reference).
- **Roles with access:** `admin`, `manager`, `sales`
- **Essential?** ✅ Yes — core data object of the platform
- **Complete?** Well-built. Has cover images, detail tabs, edit capability.
- **Merge candidate?** No
- **Recommendation:** **KEEP AS-IS**

---

#### Screens (`/admin/screens`)
- **What it does:** All digital screens across venues — location, size, orientation, resolution, active status, CueCast integration status (last seen, player token).
- **Who uses it:** Admin for hardware management; sales for inventory reference.
- **Roles with access:** `admin`, `manager`, `sales`
- **Essential?** ✅ Yes — screens are the ad inventory
- **Complete?** Functional. Has add modal, detail pages. CueCast integration status visible.
- **Merge candidate?** No — distinct enough from Venues to keep separate
- **Recommendation:** **KEEP AS-IS**

---

#### Static Sites (`/admin/static-sites`)
- **What it does:** Manages non-digital ad placements (posters, banners, frames) at venues. Has site type labels, location labels, photo upload. Separate from digital screens.
- **Who uses it:** Admin, sales reps (to include in proposals with digital).
- **Roles with access:** `sales`, `admin` (note: NOT in `admin` ROLE_DEFAULTS — **bug**)
- **Essential?** 🟡 Nice-to-have — important for venues that mix digital + static ads, but a secondary concern
- **Complete?** Functional but basic. Photo upload works. No booking/campaign linking visible.
- **Merge candidate?** ✅ Yes — merge as a tab under Screens ("Digital" tab + "Static" tab), since both are ad placement inventory
- **⚠️ BUG:** `static-sites` is NOT in `admin` ROLE_DEFAULTS — admins can't see it unless they're granted full access via `resolvePermissions` returning all slugs. Confirm the admin override catches this (it does via `NAV_PAGES.map` returning all — so it's fine, but the ROLE_DEFAULTS omission is confusing).
- **Recommendation:** **MERGE INTO Screens** — "Screens" → rename to "Inventory" with Digital Screens + Static Sites as tabs. This consolidates all ad placement types.

---

#### Inventory (`/admin/inventory`)
- **What it does:** Shows screen-level slot availability — 7-second and 15-second slot bookings per screen. Has booking management, campaign linking, slot utilisation bars.
- **Who uses it:** Admin to manage screen capacity; sales to check availability before selling.
- **Roles with access:** `admin` (not in `sales` defaults — gap!)
- **Essential?** ✅ Yes — critical for knowing what's available to sell
- **Complete?** Functional. Has booking CRUD, slot tracking.
- **Merge candidate?** 🟡 Partially — could be a tab in the renamed "Screens/Inventory" page, but the slot-level detail is enough to warrant its own view.
- **⚠️ GAP:** Sales reps don't have access to Inventory by default. They can't check availability before pitching. This is a real workflow problem.
- **Recommendation:** **KEEP + IMPROVE** — Keep as standalone but: (1) add `sales` to ROLE_DEFAULTS for inventory, (2) add a calendar/availability view, (3) link from Campaigns to show current availability. Also consider renaming to "Availability" to be less technical.

---

### CAMPAIGNS Group

---

#### Campaigns (`/admin/campaigns`)
- **What it does:** Full campaign lifecycle management. Create, list, filter by status/format. Tracks client, contact, format, venues, value, amount collected. Detail view per campaign.
- **Who uses it:** Admin and sales reps. Core page.
- **Roles with access:** `admin`, `sales`
- **Essential?** ✅ Yes — the primary revenue-generating object
- **Complete?** Well-built. Has create modal, status flow, venue linking, value tracking.
- **Merge candidate?** No
- **Recommendation:** **KEEP AS-IS**

---

#### Sponsorships (`/admin/sponsorships`)
- **What it does:** Manages brand sponsorships (widget-based, recurring). Different from campaigns — these are ongoing display widgets on gym screens (brand widget type, coverage area, billing period, rate). Tracks brand colour, logo, tagline, amount collected.
- **Who uses it:** Admin and sales.
- **Roles with access:** `admin`, `sales`
- **Essential?** ✅ Yes — distinct revenue stream from one-off campaigns
- **Complete?** Functional. Has create modal, detail view, action buttons.
- **Merge candidate?** 🟡 Could be a tab under Campaigns ("Ad Campaigns" + "Sponsorships" tabs) — both are revenue-generating client deals
- **Recommendation:** **MERGE INTO Campaigns** — Make Campaigns the "Deals" page with two tabs: "Campaigns" and "Sponsorships". Saves a nav slot; both belong to the same mental model (selling to advertisers).

---

### FINANCE Group

---

#### Revenue (`/admin/revenue`)
- **What it does:** Revenue tracking — payment recording against campaigns and sponsorships, revenue bar charts, payment history. Has a RecordPaymentModal and RevenueCharts.
- **Who uses it:** Admin primarily (and noted to not be in `sales` ROLE_DEFAULTS, which is correct — sales shouldn't record payments).
- **Roles with access:** `admin`
- **Essential?** ✅ Yes — financial tracking is non-negotiable
- **Complete?** Solid. Has charts, payment recording, tracks both campaign + sponsorship revenue.
- **Merge candidate?** Could live under Analytics as a "Finance" tab, but the write capability (recording payments) justifies its own page.
- **Recommendation:** **KEEP AS-IS** — Consider renaming to "Finance" to be more precise (Revenue is a metric, Finance is the management page).

---

### REPORTING Group

---

#### Analytics (`/admin/analytics`)
- **What it does:** Cross-platform analytics — revenue entries over time, venue performance, campaign tracking, brand breakdowns. Charts driven by revenue_entries, venues, campaigns, and gym_brands.
- **Who uses it:** Admin, viewer. Sales reps don't get this by default.
- **Roles with access:** `admin`, `viewer`
- **Essential?** ✅ Yes — reporting is essential for a data-driven platform
- **Complete?** Functional but potentially thin — pulls revenue entries and venues/campaigns but the depth depends on AnalyticsClient implementation.
- **Merge candidate?** No
- **Recommendation:** **KEEP + IMPROVE** — Give sales reps read access. Add campaign performance analytics (not just revenue entries). Add exportable reports.

---

#### Proof Of Flight (`/admin/photos`)
- **What it does:** Photo management and approval workflow for venue proof-of-flight. Managers upload photos per venue/month, admins approve. Also shows screen status per venue for campaign verification. Critical for advertiser reporting.
- **Who uses it:** Admin (approve), manager (upload), sales (view for client reporting).
- **Roles with access:** `admin`, `manager`, `sales`
- **Essential?** ✅ Yes — POF is standard in DOOH; advertisers want evidence their ads ran
- **Complete?** Well-built. Has approval grid, status filters, per-venue photo tracking.
- **Merge candidate?** No
- **Recommendation:** **KEEP AS-IS** — Strong page. Good label too.

---

### ACCOUNT Group

---

#### Settings (`/admin/settings`)
- **What it does:** Platform settings hub with multiple sections: Team management, Pricing, Platform config, Notifications, Integrations, Manager Portal, Owner Portal, Whitelabel, Audit Log, Report Scheduler.
- **Who uses it:** Admin only.
- **Roles with access:** `admin`
- **Essential?** ✅ Yes
- **Complete?** Rich — 10 sub-sections. Audit log, report scheduler, whitelabel are advanced features.
- **Merge candidate?** No
- **Recommendation:** **KEEP AS-IS**

---

## 3. Recommendation Summary Table

| Slug | Current Label | Recommendation | Notes |
|------|--------------|----------------|-------|
| `rate-card` | Rate Card | **KEEP + IMPROVE** | Add PDF export, quote saving, email to client |
| `insights` | Insights | **KEEP AS-IS** (consider rename) | Rename to "Audience & Data" for clarity |
| `media-kit` | Media Kit | **KEEP AS-IS** | |
| `pipeline` | Pipeline | **KEEP + IMPROVE** | Add pipeline value totals, conversion rate, deal→campaign flow |
| `contacts` | Contacts | **MERGE INTO Pipeline** | Contacts tab on Pipeline page |
| `dashboard` | Dashboard | **KEEP + IMPROVE** | Better sales rep view; add leaderboard/next-steps |
| `networks` | Networks | **KEEP AS-IS** | |
| `venues` | Venues | **KEEP AS-IS** | |
| `screens` | Screens | **KEEP + RENAME** | Rename to "Screens & Static" or keep as-is after merging static-sites as tab |
| `static-sites` | Static Sites | **MERGE INTO Screens** | "Static" tab on Screens page |
| `inventory` | Inventory | **KEEP + IMPROVE** | Add `sales` role access; rename to "Availability"; add calendar view |
| `campaigns` | Campaigns | **KEEP + IMPROVE** | Absorb Sponsorships as a tab |
| `sponsorships` | Sponsorships | **MERGE INTO Campaigns** | "Sponsorships" tab on Campaigns page |
| `revenue` | Revenue | **KEEP + RENAME** | Rename to "Finance" |
| `analytics` | Analytics | **KEEP + IMPROVE** | Add sales rep access; add campaign performance analytics |
| `photos` | Proof Of Flight | **KEEP AS-IS** | |
| `settings` | Settings | **KEEP AS-IS** | |

---

## 4. Proposed Clean Nav Structure

After applying all merges and renames, the sidebar collapses from **17 items** to **12 items** — tighter, cleaner, every item earns its place.

```
╔══════════════════════════════╗
║  ⚡ GymGaze                  ║
╠══════════════════════════════╣
║                              ║
║  ── SELL ──────────────────  ║
║  📊  Rate Card               ║  (keep)
║  💡  Audience & Data         ║  (was: Insights)
║  📄  Media Kit               ║  (keep)
║  📈  Pipeline                ║  (keep + Contacts tab inside)
║                              ║
║  ── OVERVIEW ──────────────  ║
║  🏠  Dashboard               ║  (keep)
║  🏢  Networks                ║  (keep)
║                              ║
║  ── INVENTORY ─────────────  ║
║  📍  Venues                  ║  (keep)
║  🖥️  Screens                 ║  (keep + Static Sites tab inside)
║  📦  Availability            ║  (was: Inventory — better label)
║                              ║
║  ── CAMPAIGNS ─────────────  ║
║  📣  Campaigns               ║  (keep + Sponsorships tab inside)
║                              ║
║  ── FINANCE ───────────────  ║
║  💰  Finance                 ║  (was: Revenue)
║                              ║
║  ── REPORTING ─────────────  ║
║  📊  Analytics               ║  (keep)
║  📷  Proof Of Flight         ║  (keep)
║                              ║
║  ── ACCOUNT ───────────────  ║
║  ⚙️  Settings                ║  (keep)
║                              ║
╚══════════════════════════════╝
```

**Nav count: 12 items** (down from 17)

### Tab Structure for Merged Pages

| Page | Tabs |
|------|------|
| **Pipeline** | Deals · Contacts |
| **Screens** | Digital Screens · Static Sites |
| **Campaigns** | Ad Campaigns · Sponsorships |

---

## 5. Role Access Matrix (Revised)

| Page | Admin | Sales | Manager | Viewer |
|------|-------|-------|---------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Networks | ✅ | — | — | — |
| Venues | ✅ | ✅ | ✅ | — |
| Screens (+ Static Sites) | ✅ | ✅ | ✅ | — |
| Availability | ✅ | ✅ ⚠️ | — | — |
| Campaigns (+ Sponsorships) | ✅ | ✅ | — | — |
| Finance | ✅ | — | — | — |
| Analytics | ✅ | ✅ ⚠️ | — | ✅ |
| Proof Of Flight | ✅ | ✅ | ✅ | — |
| Rate Card | ✅ | ✅ | — | — |
| Audience & Data | ✅ | ✅ | — | ✅ |
| Media Kit | ✅ | ✅ | — | — |
| Pipeline (+ Contacts) | ✅ | ✅ | — | — |
| Settings | ✅ | — | — | — |

> ⚠️ = currently missing from ROLE_DEFAULTS, needs to be added

---

## 6. Biggest UX Gaps

These are the most critical missing pieces for a real ad sales platform:

### Gap 1: No Quote / Proposal Builder
**What's missing:** Sales reps can calculate rates (Rate Card) and generate audience insights (Insights/Media Kit) but there's no way to build and send a formal proposal/quote to a client. There's no: quote PDF export, client-facing proposal link, or campaign estimate → proposal → campaign conversion flow.
**Impact:** Sales reps copy numbers manually into Word/email. Slow. Unprofessional. Revenue leaks.
**Fix:** Add a "Create Proposal" action on Rate Card that saves a quote, generates a PDF/shareable link, and converts to a Campaign on acceptance.

### Gap 2: No Campaign Performance Reporting (Post-Flight)
**What's missing:** Once a campaign runs, there's no advertiser-facing or internal campaign report showing: impressions served, screens used, Proof of Flight photos, and revenue breakdown. Proof Of Flight page exists but it's an approval workflow, not a delivery report.
**Impact:** No evidence of value delivered → client churn risk → no repeat bookings.
**Fix:** Add a "Campaign Report" view (per-campaign): screens served, POF photos, impressions estimate, payment status. Make it shareable (like the Insight Links feature).

### Gap 3: Sales Reps Can't See Inventory Availability
**What's missing:** `sales` role doesn't have access to `inventory` (the slot availability page). Sales reps are pitching screen time without being able to check if slots are actually available.
**Impact:** Overselling risk. Sales reps look uninformed in client meetings.
**Fix:** Add `inventory` to `sales` ROLE_DEFAULTS. Consider building a simplified "availability check" view within Rate Card.

### Gap 4: No Invoicing / Billing Flow
**What's missing:** Revenue page records payments but there's no invoice generation, no invoice status tracking (sent/paid/overdue), and no integration with accounting tools. The RecordPaymentModal implies manual payment tracking.
**Impact:** Finance is a spreadsheet on top of a platform. No audit trail per invoice.
**Fix:** Add basic invoicing to the Finance page — generate invoice PDF per campaign/sponsorship, track sent/paid/overdue status, integrate with Xero or similar.

### Gap 5: No Notifications or Activity Feed
**What's missing:** No real-time alerts for: new photo submissions (manager uploaded), campaign about to expire, payment overdue, pipeline deal idle for 7+ days.
**Impact:** Admin has to manually check every page. Things fall through cracks — late photo approvals, chasing payments.
**Fix:** Add a notification bell in the header + an activity feed in Dashboard. Settings already has a NotificationsSection — the infrastructure exists, the triggers don't.

---

## 7. Permission Bugs & Gaps Found

| Issue | Severity | Fix |
|-------|---------|-----|
| `static-sites` missing from `admin` ROLE_DEFAULTS | Low | Cosmetic only — `resolvePermissions` for admin returns all slugs anyway, but the omission in ROLE_DEFAULTS is misleading |
| `inventory` missing from `sales` ROLE_DEFAULTS | **High** | Sales reps can't check slot availability. Add `"inventory"` to `sales` array |
| `analytics` missing from `sales` ROLE_DEFAULTS | Medium | Sales reps should see campaign performance analytics. Add `"analytics"` to `sales` array |
| `pipeline` and `contacts` missing from `admin` ROLE_DEFAULTS | Low | Admin always gets everything via resolvePermissions override, but ROLE_DEFAULTS should be accurate for documentation |

---

## 8. Summary

### What to Kill (merge away / remove from top-level nav)
- **Contacts** → merge as tab in Pipeline
- **Static Sites** → merge as tab in Screens
- **Sponsorships** → merge as tab in Campaigns

### What to Rename
- **Insights** → "Audience & Data"
- **Revenue** → "Finance"
- **Inventory** → "Availability"

### What to Improve (priority order)
1. **Rate Card** — add quote saving + PDF export + email to client
2. **Pipeline** — add value totals, conversion %, deal→campaign flow
3. **Dashboard** — better sales rep view (motivation-first, not stat-dump)
4. **Analytics** — add sales access, campaign performance data
5. **Inventory/Availability** — add to sales role, add calendar view

### Top 3 UX Gaps for a Real Ad Sales Platform
1. 🔴 **No Proposal Builder** — sales workflow is broken without a quote-to-campaign conversion flow
2. 🔴 **No Campaign Delivery Report** — advertisers need post-flight evidence of value, not just POF photos
3. 🟠 **No Invoicing** — Finance page is manual payment logging, not a real billing system

---

*Audit complete. No code changes made. All recommendations are structural/strategic.*
