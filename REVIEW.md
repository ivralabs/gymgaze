# GymGaze QA Review — 2026-05-25

Reviewed by: Lens 🔍 (QA subagent)
Scope: 10 commits shipped today. 3 more incoming (nav restructure, campaign report, invoicing).

---

## ✅ Passed

- **Media model constants consistent** — `PLAYS_PER_SCREEN_PER_WEEK=1596`, `ACTIVE_RATE=0.65`, `AVG_VISITS_PER_MEMBER_PER_WEEK=3.5`, `ATTENTION_QUALITY_SCORE=8.5` all match across `PublicInsightsClient.tsx`, `AgencyDeckPreview.tsx`, and `RateCardClient.tsx`
- **Pipeline route** (`/api/pipeline/route.ts`) — correctly uses service client, no cookie-based auth. Bug from commit `d036e1a` is genuinely fixed.
- **No `console.log` debug calls** — only intentional `console.error` handlers in settings API routes
- **API auth pattern** — `media-kit/settings`, `media-kit/enquiries`, `insights/links`, `insights/audience`, `insights/data` all correctly use `createClient()` for admin-only XHR routes (session-protected pages). Not the same bug as Pipeline was.
- **Print CSS (Rate Card)** — uses `body * { visibility: hidden }` + `position: fixed` for `#rate-card-printable`. Sidebar effectively disappears from print output.
- **PublicInsightsClient** — PIN gate works correctly. Data safely stripped for public views (no campaign advertiser names, no contact info, no revenue). Error path returns `null` (blank screen, not crash).
- **PIN verify route** — uses service client correctly, checks expiry, no session dependency.
- **Per-user sales target** — `profiles.sales_target` column read correctly in dashboard. Falls back to R50k if null.
- **VenueTypeBar** — has `if total === 0 return null` guard.
- **MediaKit enquiry flow** — `AdvertiseClient` submits to `/api/media-kit/enquire`, admin `MediaKitClient` reads/patches `/api/media-kit/enquiries`. Both routes exist and are wired correctly.
- **Dashboard photo alert banner** — fires when `pendingCount > 0`, links to `/admin/photos` which exists.
- **Dashboard quick-action routes** — `/admin/campaigns/new` ✅, `/admin/venues/new` ✅, `/admin/revenue/new` ✅, `/admin/photos` ✅
- **Mobile responsiveness (mostly)** — RateCard 2-col/5-col grid (`grid-cols-2 lg:grid-cols-5`) handles mobile. Venue tables wrap correctly.
- **eCPM explainer** — identical hardcoded benchmark table in both `PublicInsightsClient` and `AgencyDeckPreview`. Consistent.
- **TS compile check** — only 3 errors, all pre-existing (see Critical section).

---

## ⚠️ Issues Found

### Critical (breaks functionality)

**1. `MediaKitClient.tsx` — Wrong pricing tier column names**
- File: `src/app/admin/media-kit/MediaKitClient.tsx` — interface at lines 45–50
- DB columns (confirmed in `supabase/schema-pricing-v1.sql`): `min_spend`, `duration_sec`
- MediaKit interface declares: `min_spend_zar`, `duration_seconds`
- Result: the Rates tab in Media Kit will show `undefined` for duration and `NaN` for min spend. The table renders broken data to users.
- RateCardClient.tsx uses the CORRECT column names (`min_spend`, `duration_sec`) as a reference fix.

**2. `InvoicePrintView.tsx` — Circular import → TypeScript error**
- File: `src/app/admin/revenue/invoices/[id]/InvoicePrintView.tsx` line 6
- `InvoicePrintView.tsx` imports `InvoiceDetail` type from `./page`
- `page.tsx` imports `InvoicePrintView` from `./InvoicePrintView`
- TypeScript error: `Cannot find module './InvoicePrintView' or its corresponding type declarations`
- This is a circular dependency. Fix: move `InvoiceDetail` type to a shared `types.ts` file in the same directory.

**3. Dashboard dead link — `/admin/deals/new`**
- File: `src/app/admin/dashboard/page.tsx` line 232
- Route `/admin/deals/new` does not exist. The pipeline deals feature lives at `/admin/pipeline` (modal-based).
- Users clicking "New Deal" from the dashboard quick actions will hit a 404.
- Fix: change `href="/admin/deals/new"` to `href="/admin/pipeline"` (the modal auto-opens from the Pipeline UI).

**4. Dashboard dead link — `/admin/screens/new`**
- File: `src/app/admin/dashboard/page.tsx` line 220
- Route `/admin/screens/new` does not exist. Screen management lives at `/admin/screens` (with an `AddScreenModal`).
- Fix: change `href="/admin/screens/new"` to `href="/admin/screens"`.

### Medium (degrades experience)

**5. OTS formula inconsistency in `AgencyDeckPreview.tsx`**
- File: `src/app/admin/insights/AgencyDeckPreview.tsx` lines 593 and 787
- Formula used: `ots = totalMonthly * screens.length` — multiplies monthly foot traffic by screen count, inflating OTS
- Correct formula (used in `calcMetrics` and `PublicInsightsClient`): `ots = monthly_entries * (weeks / 4.3)`
- Impact: the OTS shown in the admin agency deck preview will be significantly higher (and wrong) compared to what the agency actually sees in `PublicInsightsClient`. Agencies could receive different numbers than admins presented.
- Note: `InsightsClient.tsx` (network breakdown rows, line 184) has the same bug.

**6. OTS formula inconsistency in `InsightsClient.tsx`**
- File: `src/app/admin/insights/InsightsClient.tsx` lines 184 and 744
- Same `ots = totalMonthly * screens.length` pattern as #5.
- The per-network OTS displayed in the accordion rows is inflated.
- The Media Performance panel at line 748 uses the correct `flightFactor` model — so the same page shows two different OTS numbers depending on which section you read.

**7. `ContactsClient.tsx` — Orphaned dead import**
- File: `src/app/admin/contacts/ContactsClient.tsx` line 6
- Imports `AggregatedContact` from `./page`, but `contacts/page.tsx` now only contains a redirect to `/admin/pipeline`. The type is gone.
- TypeScript error: `Module '"./page"' has no exported member 'AggregatedContact'`
- `ContactsClient` is a dead component (not rendered anywhere), but the TS error blocks clean builds.
- Fix: delete `ContactsClient.tsx` entirely (it's orphaned since contacts was deprecated in favour of pipeline).

**8. `ScreensTabsWrapper.tsx` — TS module resolution error**
- File: `src/app/admin/screens/page.tsx` line 9
- TypeScript reports: `Cannot find module './ScreensTabsWrapper'`
- The file exists and has a default export. This may be a `.next` stale cache issue or an incremental TS build artifact. Should clear after `rm -rf .next && npx tsc --noEmit`.
- If it persists: check if the screens `page.tsx` has `export const dynamic` and server directives that conflict with the client-only `ScreensTabsWrapper`.

**9. `PublicInsightsClient` — Empty data shows blank page, not error**
- File: `src/app/insights/[token]/PublicInsightsClient.tsx` line 1175
- `if (!data) return null;` — if the data fetch fails after PIN verification, the user sees a completely blank white screen with no message.
- Medium: not a crash, but a confusing UX for an agency user.
- Fix: add a fallback error UI: "Unable to load insights. Please refresh or contact your GymGaze representative."

**10. Dashboard — Hardcoded "+12% this month" badge on Networks tile**
- File: `src/app/admin/dashboard/page.tsx` line 282
- This stat is hardcoded and not calculated from real data. It will always show "+12% this month" regardless of actual growth.
- Users may make decisions based on a fictitious metric.

### Minor (polish)

**11. `AgencyDeckPreview.tsx` — `void` suppression hack for unused constants**
- File: `src/app/admin/insights/AgencyDeckPreview.tsx` lines 792–795
- `void AVG_VISITS_PER_MEMBER_PER_WEEK; void PLAYS_PER_SCREEN_PER_WEEK;` — these constants are declared but not used in calculations. The `void` hack silences the TS warning.
- If these constants are truly unused, remove them. If they should be used (they should — for the OTS fix in issue #5), use them in the calc.

**12. `MediaKitClient.tsx` — Hardcoded `PUBLIC_URL = "https://gymgaze.vercel.app/advertise"`**
- File: `src/app/admin/media-kit/MediaKitClient.tsx` line 149
- URL is hardcoded. If the production domain changes or a custom domain is added, this breaks.
- Minor: won't break in current prod, but worth moving to an env var.

**13. `MediaKitClient.tsx` — Hardcoded `eCPM = R131` in "Why GymGaze" static block**
- File: `src/app/admin/media-kit/MediaKitClient.tsx` around `WHY_GYMGAZE` constant (line ~80)
- The eCPM R131 is hardcoded in the display copy ("Proven eCPM: R131 effective CPM vs R750+").
- Not dynamically calculated from pricing tiers. Same as PublicInsightsClient's hardcoded table — consistent but hardcoded.

**14. `RateCardClient.tsx` — `grid-cols-2 lg:grid-cols-5` gap at medium breakpoints**
- File: `src/app/admin/rate-card/RateCardClient.tsx` line 450
- The 5-metric national summary jumps from 2 columns (mobile) directly to 5 columns (lg). No `md:grid-cols-3` intermediate step.
- On tablets (768–1024px), cards may look awkward with only 2 items per row in a 5-card strip.

---

## 📋 Needs Mlu

1. **Fix `admin/deals/new` dead link** (issue #3) — change to `/admin/pipeline` in dashboard quick actions. 30-second fix.
2. **Fix `admin/screens/new` dead link** (issue #4) — change to `/admin/screens`. 30-second fix.
3. **Fix `MediaKitClient` pricing tier column names** (issue #1) — change `min_spend_zar` → `min_spend` and `duration_seconds` → `duration_sec` in the `PricingTier` interface and all usages. Media Kit Rates tab is broken until this is fixed.
4. **Decide on OTS formula** (issues #5 & #6) — the `AgencyDeckPreview` and `InsightsClient` network accordion rows use the wrong formula. These should use the same `calcMetrics` function already defined in those files, not the ad-hoc screen-count multiplier. Medium complexity fix.
5. **Decide on `ContactsClient.tsx`** (issue #7) — if contacts feature is fully deprecated, delete the file. Otherwise define `AggregatedContact` type somewhere.
6. **Remove hardcoded "+12% this month"** (issue #10) — replace with a real MoM network count calc, or remove the badge entirely.
7. **Circular import in InvoicePrintView** (issue #2) — extract `InvoiceDetail` type to `types.ts` in the invoices `[id]` directory. TS build error.

---

*Generated automatically. No fixes applied — analysis only.*
