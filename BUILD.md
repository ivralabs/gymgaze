# GymGaze — Sprint 1 Build Notes

## What was built

### Infrastructure
- Next.js 15 (App Router) + TypeScript + Tailwind CSS scaffold
- Google Fonts: Inter + Inter Tight loaded via layout.tsx and globals.css
- Tailwind config with full GymGaze design token system (admin dark theme + portal light theme)
- Supabase client (browser + server/SSR) via `@supabase/ssr`
- Middleware auth guard: `/admin/*` requires `role=admin`, `/portal/*` requires `role=owner|manager`

### Database
- `supabase/schema.sql` — full schema with RLS policies:
  - `gym_brands` — networks/brands
  - `venues` — individual gym locations
  - `screens` — display screens per venue
  - `contracts` — one contract per venue
  - `campaigns` — advertising campaigns
  - `campaign_venues` — campaign↔venue junction
  - `revenue_entries` — monthly revenue records
  - `venue_photos` — upload + approval flow
  - `profiles` — user roles (admin/owner/manager)
  - Auto-profile trigger on user signup
  - Row Level Security for all tables

### Pages

#### Auth
- `/auth/login` — shared login with role-based redirect post-sign-in

#### Admin (dark theme, fixed 240px sidebar)
- `/admin/dashboard` — stat tiles + pending photo approvals
- `/admin/networks` — grid of gym brand cards
- `/admin/networks/new` — add network form (name, color, contact)
- `/admin/networks/[id]` — brand detail + venues table
- `/admin/venues` — data table of all venues
- `/admin/venues/new` — add venue form
- `/admin/venues/[id]` — venue profile with 5 tabs (Overview, Screens, Contract, Photos, Revenue)
- `/admin/photos` — pending photo approval grid with approve/reject modal

#### Partner Portal (light theme, top nav)
- `/portal/dashboard` — owner view: stat tiles + SVG revenue chart + venue cards
- `/portal/manager` — manager view: quick actions + pending tasks
- `/portal/manager/upload` — photo upload with drag-and-drop + mobile camera support
- `/portal/manager/venue` — update venue stats form

### API Routes
- `GET/POST /api/venues`
- `GET/PATCH /api/venues/[id]`
- `GET/POST /api/networks`
- `GET/PATCH /api/networks/[id]`
- `GET /api/photos` (pending only)
- `POST /api/photos/[id]/approve`
- `POST /api/photos/[id]/reject`
- `GET/POST /api/revenue`
- `GET/POST /api/campaigns`

---

## Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these from your Supabase project: **Settings → API**.

---

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Go to **Storage** and create a bucket named `venue-photos` (private)
4. Copy your project URL and anon key into `.env.local`
5. Create your first admin user in **Authentication → Users**, then manually set their `role = 'admin'` in the `profiles` table

---

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# TypeScript check
npx tsc --noEmit

# Build for production
npm run build
```

App runs at: http://localhost:3000

---

## Deployment (Vercel)

1. Push to GitHub (already done)
2. Import repo at [vercel.com](https://vercel.com)
3. Set environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
4. Deploy — Vercel auto-detects Next.js

---

## Design Tokens

| Token | Value |
|---|---|
| Brand orange | `#FF6B35` |
| Admin background | `#0F0F0F` |
| Admin surface | `#1E1E1E` |
| Admin elevated | `#2A2A2A` |
| Admin border | `#333333` |
| Portal background | `#F9FAFB` |
| Portal surface | `#FFFFFF` |
| Portal border | `#E5E7EB` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |

---

## Notes

- No emoji anywhere — Lucide React icons throughout
- `window.location.href` used post-auth (not `router.push`) for proper cookie propagation
- White-label system uses CSS custom properties (`--brand-primary`) injectable at portal layout level
- Sprint 2 will wire up real Supabase data, add campaigns management, revenue reporting, and mobile-optimized views
