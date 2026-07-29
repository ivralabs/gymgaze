# GymGaze Audit — 2026-07-29

## Summary
**2 critical | 4 medium | 2 low | 8 pass**

---

## Critical (breaks functionality for planners/buyers)

### BUG-01: Multiple API routes have no auth guard — unauthenticated callers can read/write sensitive data

- **Affected files:**
  - `src/app/api/landlords/route.ts` (GET, POST) — venue rental fees, bank details
  - `src/app/api/landlords/[id]/route.ts` (GET, PUT, DELETE)
  - `src/app/api/landlords/bulk/route.ts` (POST)
  - `src/app/api/landlords/export/route.ts` (GET)
  - `src/app/api/invoices/route.ts` (GET, POST)
  - `src/app/api/invoices/[id]/route.ts` (GET, PUT, DELETE)
  - `src/app/api/pipeline/route.ts` (GET, POST)
  - `src/app/api/pipeline/[id]/route.ts` (GET, PUT, DELETE)
  - `src/app/api/venues/[id]/route.ts` (GET, PUT, DELETE)
  - `src/app/api/gym-networks/route.ts` (GET, POST)
  - `src/app/api/gym-networks/[id]/route.ts` (GET, PATCH, DELETE)
  - `src/app/api/proposals/route.ts` (GET, POST)
  - `src/app/api/proposals/[id]/route.ts` (GET, PUT, DELETE)
  - `src/app/api/proposals/[id]/venues/route.ts` (GET, POST, DELETE)

- **Issue:** These routes use the service-role Supabase client (bypasses RLS) but include **zero auth checks**. The middleware only guards `/admin/*` and `/portal/*` paths — API routes under `/api/*` are not in the middleware matcher. Any unauthenticated HTTP client can read the full pipeline, proposals, invoices, landlord rental terms, and bank details — or write/delete records — without a session cookie.

- **Evidence:** `src/middleware.ts` lines 99–103 — matcher only covers `/admin/:path*` and `/portal/:path*`. Cross-checked: `grep -n 'getUser\|Unauthorized' src/app/api/pipeline/route.ts` → no output.

- **Fix:** Add a `requireUser()` guard to each route. Pattern from `src/app/api/revenue/route.ts` (lines 20–23):
  ```ts
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ```
  For routes using the raw `createServiceClient` (no cookie binding), switch to `createClient` from `@/lib/supabase/server` for the auth check, then use service client for the actual query.

---

### BUG-02: Emoji used in public-facing pages (violates Lucide-icons-only design convention)

- **Affected files:**
  - `src/app/advertise/AdvertiseClient.tsx` lines 65, 73, 81, 91–94, 247, 348, 371, 402 — multiple emoji in buyer-facing media kit
  - `src/app/insights/[token]/page.tsx` line 33 — ⏰ emoji in expired link screen
  - `src/app/proposal-print/[id]/ProposalPrint.tsx` lines 551, 858, 1133–1135 — emoji in PDF-rendered proposal

- **Issue:** The Lens rule (from `team/lens.md`) and GymGaze design convention mandate Lucide icons only — no emoji in UI. The `advertise` page is seen by purchase-ready buyers; the proposal print view goes into formal PDF documents sent to gym group owners. Emoji render inconsistently in PDFs and look unprofessional in B2B contexts.

- **Fix:** Replace all emoji with Lucide icon components (`<Target />`, `<CheckCircle />`, `<BarChart2 />`, `<Clock />`, etc.). For the proposal PDF's table cells, use Unicode symbols only if absolutely needed.

---

## Medium (degrades experience)

### MED-01: `src/app/api/venues/route.ts` and `src/app/api/screens/route.ts` use cookie-bound client with no auth check

- **Files:** `src/app/api/venues/route.ts` (GET, POST, line 1–2), `src/app/api/screens/route.ts` (POST, line 1–2), `src/app/api/campaigns/route.ts` (GET, POST), `src/app/api/contracts/route.ts` (GET, POST)
- **Issue:** These use `createClient()` (cookie-bound), which will silently return no data when an unauthenticated request arrives (Supabase RLS may block it), but they don't explicitly return 401. Behaviour is inconsistent — some return empty arrays, some may 500. External callers get ambiguous error signals.
- **Fix:** Add explicit `getUser()` + 401 guard at the top of each handler.

---

### MED-02: `src/app/api/proposals/[id]/pdf/route.ts` and `/sla/route.ts` have no auth check

- **Files:** `src/app/api/proposals/[id]/pdf/route.ts`, `src/app/api/proposals/[id]/sla/route.ts`
- **Issue:** Anyone with a valid proposal UUID can generate and download the full partnership proposal PDF or SLA document without being authenticated. These contain commercially sensitive rental projections and legal terms.
- **Fix:** Add auth guard (cookie-bound `getUser()` check) before triggering Browserless.

---

### MED-03: `src/app/api/rate-card/pdf/route.ts` has no auth check

- **File:** `src/app/api/rate-card/pdf/route.ts`
- **Issue:** Rate card PDF generation (which includes pricing tiers, venue list, and CPM rates) can be triggered by any unauthenticated caller.
- **Fix:** Add auth guard, or at minimum a signed token check if this route is intended to be callable from Browserless (where no cookie is present). If admin-only, require session.

---

### MED-04: `src/app/api/gym-networks/` and `src/app/api/proposals/` POST/DELETE routes have no tenant scoping

- **Files:** `src/app/api/gym-networks/route.ts`, `src/app/api/proposals/route.ts`
- **Issue:** Even beyond missing auth, these routes insert records via service role with no `tenant_id` injection. If the schema has tenant isolation columns, new records will be created without one. Future multi-tenant expansion will be broken by design.
- **Fix:** After auth guard, inject `tenant_id` from the authenticated user's profile on all inserts.

---

## Low (polish)

### LOW-01: Emoji in expired-link screen (`/insights/[token]`)

- **File:** `src/app/insights/[token]/page.tsx` line 33
- **Issue:** The expired link page shows `text-5xl` ⏰ emoji. This is a public page seen by buyers and media planners. Minor but inconsistent with design system.
- **Fix:** Replace with `<Clock className="w-12 h-12 text-gray-400" />` Lucide icon.

---

### LOW-02: `InvoicePrintView.tsx` import structure — not a circular import but worth noting

- **File:** `src/app/admin/revenue/invoices/[id]/InvoicePrintView.tsx` (imported by `page.tsx` line 6)
- **Issue:** Previous audit flagged a circular import. This no longer appears to be circular — `page.tsx` imports `InvoicePrintView` which is a leaf component. No circular dependency found. However, `InvoicePrintView` is a large file in a route segment. If it grows, consider moving to `src/components/`.
- **Status:** Previously reported circular import — **not present** in current code.

---

## Passed

- ✅ **TypeScript:** `npx tsc --noEmit` exits clean — zero type errors
- ✅ **Dead links (known bugs):** `/admin/deals/new` → not found anywhere in codebase (fixed). `/admin/screens/new` → not found (fixed). Dashboard quick-action buttons correctly link to `/admin/pipeline`, `/admin/screens`, `/admin/campaigns/new`, `/admin/venues/new`, `/admin/revenue/new`
- ✅ **Column names:** `MediaKitClient.tsx` correctly uses `min_spend` (line 49) and `duration_sec` (line 47). `RateCardPrint.tsx`, `RateCardClient.tsx`, and `pricing-tiers` API all consistently use correct column names. No `min_spend_zar` or `duration_seconds` found anywhere.
- ✅ **Console.log debris:** Zero `console.log` calls found in production source (only `console.error` where appropriate)
- ✅ **Route coverage:** All `href=` values and `router.push()` calls resolve to real `page.tsx` files. No dead routes found.
- ✅ **Public pages load real data:** `/insights/[token]` server-fetches all data before render (no "Loading…" forever). `/advertise` page server-renders stats via `createServiceClient`. `/rate-card-print` fetches venues + pricing tiers server-side. `/proposal-print/[id]` fetches full proposal server-side.
- ✅ **Middleware guards pages correctly:** `/admin/*` and `/portal/*` require auth and enforce role-based access. Unauthenticated users are redirected to `/auth/login`.
- ✅ **PDF routes use Browserless correctly:** Both proposal PDF and rate-card PDF forward auth cookies to Browserless, wait for `[data-print-page="true"]` selector before generating.
- ✅ **`InvoicePrintView.tsx` circular import:** Not present — was fixed or never existed in current codebase.

---

## Known bugs status (from REVIEW.md)

| Bug | Status |
|-----|--------|
| Dashboard dead link `/admin/deals/new` | ✅ **Fixed** — not present in codebase |
| Dashboard dead link `/admin/screens/new` | ✅ **Fixed** — not present in codebase |
| `MediaKitClient.tsx` wrong column names (`min_spend_zar`, `duration_seconds`) | ✅ **Fixed** — correct columns `min_spend` / `duration_sec` used |
| `InvoicePrintView.tsx` circular import | ✅ **Fixed / Not present** — no circular dependency found |

---

## Priority order for fixes

1. **BUG-01** (Critical) — Auth guards on service-role API routes. This is a data exposure issue in production.
2. **MED-02 + MED-03** (Medium) — Auth on PDF generation routes (proposal, SLA, rate card).
3. **MED-01** (Medium) — Consistent 401 returns on cookie-bound routes.
4. **MED-04** (Medium) — Tenant scoping on inserts (important before any multi-gym expansion).
5. **BUG-02 + LOW-01** (Low) — Emoji cleanup in buyer-facing and print views.
