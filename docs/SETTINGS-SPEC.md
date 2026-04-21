# GymGaze Settings Page — Full Specification
> Written by Nova 🧠 | April 2026

The Settings page (`/admin/settings`) is a tabbed interface with 9 sections accessible via a left-side nav or top tab strip. Each section is a glass card panel. No emoji — Lucide icons only. Dark + lime (#D4FF4F) design.

---

## Layout

- **Left sidebar nav** (vertical, stacked): each of the 9 sections is a nav item
- **Active section** renders in the main content area (right)
- URL param: `/admin/settings?tab=team` (so deep links work)
- Mobile: tabs collapse to a dropdown

---

## Section 1 — Team & Permissions

**Purpose:** Manage who has admin access to the GymGaze platform.

### UI Layout
- Header: "Team & Permissions" + "Invite Admin" button (lime, right-aligned)
- Table of current admin users:
  - Columns: Name, Email, Role, Status, Last Login, Actions
  - Status badge: Active (lime) / Suspended (amber)
  - Actions: Role dropdown (Admin / Viewer), Suspend/Reactivate toggle, Remove (red, confirm dialog)
- Invite modal (portal): email input + role dropdown + "Send Invite" button

### Fields & Controls
| Field | Type | Validation |
|-------|------|------------|
| Invite email | email input | required, valid email |
| Role | select: Admin / Viewer | required |
| Suspend toggle | button | confirm before suspending self — blocked |
| Remove | button | confirm dialog, cannot remove self |

### API Routes
- `GET /api/settings/team` — list all admin profiles
- `POST /api/settings/team/invite` — send invite email via Resend
- `PATCH /api/settings/team/[id]` — update role or suspended status
- `DELETE /api/settings/team/[id]` — remove user (soft delete or deactivate)

### DB Changes
- `profiles` table: add `suspended boolean DEFAULT false`, `last_login_at timestamptz`, `invited_by uuid`
- New table: `invitations (id, email, role, token, invited_by, created_at, accepted_at)`

### Empty States
- No other admins: "You're the only admin. Invite someone to collaborate."

### Edge Cases
- Cannot suspend or remove yourself
- Viewer role: read-only access to all admin pages (enforce in middleware)
- Invite token expires after 48h

---

## Section 2 — Portal Control: Owner Dashboard

**Purpose:** Control which widgets gym network owners see when they log into their partner portal.

### UI Layout
- Header: "Owner Dashboard Visibility"
- Toggle list — each item is a glass row with: widget name, description, on/off toggle
- Widgets:
  - Revenue Summary — "Monthly rental + revenue share totals"
  - Venue Health Score — "Composite score per venue (contract + photos + revenue)"
  - Campaign Activity — "Active and upcoming campaigns at their venues"
  - Photo Compliance — "Submission rate and approval status"
  - Monthly Report Download — "PDF report of the previous month"
- Save button (lime)

### Fields & Controls
| Widget | Type | Default |
|--------|------|---------|
| Revenue Summary | toggle | on |
| Venue Health Score | toggle | on |
| Campaign Activity | toggle | on |
| Photo Compliance | toggle | on |
| Monthly Report Download | toggle | off |

### API Routes
- `GET /api/settings/portal-config` — fetch current config
- `PATCH /api/settings/portal-config` — save owner widget toggles

### DB Changes
- New table: `portal_config (id, owner_widgets jsonb, manager_sections jsonb, updated_at)`
- Single row (singleton config)

### Empty States
- N/A — toggles always shown

---

## Section 3 — Portal Control: Manager Dashboard

**Purpose:** Control which sections venue managers see in their portal.

### UI Layout
- Header: "Manager Dashboard Visibility"
- Toggle list:
  - Photo Upload — "Allow managers to submit monthly proof-of-display photos"
  - Screen Info — "Show screen specs and locations at their venue"
  - Venue Stats — "Show active members, daily/weekly/monthly entries"
  - Contact Support — "Show a support contact button"
- Save button

### API Routes
- `GET /api/settings/portal-config` — shared with Section 2
- `PATCH /api/settings/portal-config` — save manager section toggles

### DB Changes
- Covered by `portal_config.manager_sections jsonb` (see Section 2)

---

## Section 4 — Platform Settings

**Purpose:** Configure core platform defaults used across GymGaze.

### UI Layout
- Glass card form, 2-column grid for most fields
- Save button at bottom

### Fields & Controls
| Field | Type | Default | Validation |
|-------|------|---------|------------|
| Platform Name | text input | "GymGaze" | required, max 50 chars |
| Support Email | email input | "" | valid email |
| Default Currency | text (locked) | "ZAR" | display only |
| Default Gym Revenue Split % | number input | 30 | 0–100 |
| Invoice Prefix | text input | "GG-" | max 10 chars, alphanumeric + dash |
| Financial Year Start | select (Jan–Dec) | January | required |

### API Routes
- `GET /api/settings/platform` — fetch platform config
- `PATCH /api/settings/platform` — save platform config

### DB Changes
- New table: `platform_settings (id, platform_name, support_email, default_gym_revenue_split, invoice_prefix, fy_start_month, updated_at)`
- Single row (singleton)

### Empty States
- Pre-populated with defaults on first load

---

## Section 5 — White-Label Portal Builder

**Purpose:** Customise the partner-facing portal appearance with the GymGaze brand or a custom brand.

### UI Layout
- Left: form panel (logo upload, colour picker, domain, welcome message)
- Right: live preview panel showing portal header mock (logo + accent colour + welcome message)

### Fields & Controls
| Field | Type | Validation |
|-------|------|------------|
| Logo | file upload (PNG/SVG, max 2MB) | image only |
| Primary Accent Colour | colour picker + hex input | valid hex |
| Portal Domain | text (display only) | e.g. partners.gymgaze.co.za |
| Welcome Message | textarea | max 200 chars |

### API Routes
- `GET /api/settings/whitelabel` — fetch config
- `PATCH /api/settings/whitelabel` — save (logo upload to Supabase storage)

### DB Changes
- Extend `platform_settings`: add `logo_url text`, `accent_color text`, `portal_domain text`, `welcome_message text`

### Preview
- Right panel renders a static mock with actual logo + colour applied
- Updates live as user types/changes values

---

## Section 6 — Automated Report Scheduler

**Purpose:** Schedule monthly PDF reports to be emailed to specified recipients automatically.

### UI Layout
- Enable/disable toggle at top
- Form below (greyed out when disabled):
  - Delivery day selector
  - Recipients list with add/remove
  - Report contents checkboxes
  - "Send Test Report" button

### Fields & Controls
| Field | Type | Validation |
|-------|------|------------|
| Enable monthly reports | toggle | — |
| Delivery day | number input or select (1–28) | required if enabled |
| Recipients | email chip input (add/remove) | valid emails |
| Revenue Summary | checkbox | — |
| Campaign Activity | checkbox | — |
| Photo Compliance | checkbox | — |
| Venue Health Scores | checkbox | — |

### API Routes
- `GET /api/settings/reports` — fetch scheduler config
- `PATCH /api/settings/reports` — save config
- `POST /api/settings/reports/test` — trigger test email to current admin

### DB Changes
- New table: `report_scheduler (id, enabled boolean, delivery_day int, recipients jsonb, contents jsonb, updated_at)`

### Edge Cases
- Day 29–31 doesn't exist in all months — cap at 28
- Test report sends to logged-in admin only (not all recipients)

---

## Section 7 — Notification Centre

**Purpose:** Configure which in-app notification events admins are alerted about.

### UI Layout
- Toggle list of notification types
- Each row: notification name, description, on/off toggle
- "In-app only" label (Lucide Info icon + tooltip: "Email notifications coming soon")

### Notification Types
| Event | Default |
|-------|---------|
| New photo submitted | on |
| Photo approved | off |
| Photo rejected | on |
| Campaign goes live | on |
| Campaign ends | off |
| Revenue entry added | off |
| New partner portal login | on |

### API Routes
- `GET /api/settings/notifications` — fetch preferences
- `PATCH /api/settings/notifications` — save preferences

### DB Changes
- New table: `notification_preferences (id, admin_id uuid FK profiles, preferences jsonb, updated_at)`
- Per-admin row

### Edge Cases
- Preferences are per-admin (each admin sets their own)
- Future: add email delivery toggle per event

---

## Section 8 — API & Integrations

**Purpose:** Manage API credentials and third-party integrations.

### UI Layout
- **API Key** card: masked key (`gg_live_••••••••••••••••`), Copy button, Regenerate button (confirm dialog)
- **Webhook** card: URL text input, event checkboxes, Save button, "Test Webhook" button
- **Google Analytics** card: GA4 Measurement ID input, Save button, status badge (Connected / Not configured)

### Fields & Controls
| Field | Type | Validation |
|-------|------|------------|
| API Key | text (masked) | read-only, copy on click |
| Regenerate | button | confirm dialog |
| Webhook URL | url input | valid URL, https only |
| Webhook Events | checkboxes | any selection valid |
| GA4 Measurement ID | text input | must start with "G-" |

### API Routes
- `GET /api/settings/integrations` — fetch key (masked) + webhook config + GA4 ID
- `POST /api/settings/integrations/regenerate-key` — generate new API key
- `PATCH /api/settings/integrations/webhook` — save webhook URL + events
- `POST /api/settings/integrations/test-webhook` — send test POST to webhook URL
- `PATCH /api/settings/integrations/ga4` — save GA4 measurement ID

### DB Changes
- New table: `api_credentials (id, api_key_hash text, api_key_prefix text, webhook_url text, webhook_events jsonb, ga4_measurement_id text, created_at, updated_at)`
- Store hash of key, never plaintext. Display prefix only after creation.

### Edge Cases
- On regenerate: invalidate old key immediately, show new key once (cannot retrieve again)
- Webhook test sends a `{"event":"test","timestamp":"..."}` POST

---

## Section 9 — Audit Log

**Purpose:** Full visibility into all admin actions taken on the platform.

### UI Layout
- Filters row: User dropdown, Action Type dropdown, Date range (from/to), Apply button
- Table: Timestamp, User, Action, Record Type, Record Name/ID
- "Export CSV" button (top right)
- Pagination: 50 rows per page

### Columns
| Column | Description |
|--------|-------------|
| Timestamp | Full datetime, SAST |
| User | Admin name + email |
| Action | Human-readable (e.g. "Created venue", "Approved photo") |
| Record | Type + name (e.g. "Venue: FitZone Sandton") |

### Action Types Logged
- `auth.login`
- `venue.created`, `venue.updated`
- `campaign.created`
- `photo.approved`, `photo.rejected`
- `revenue.entry_added`
- `settings.changed`
- `team.invited`, `team.suspended`, `team.removed`

### API Routes
- `GET /api/settings/audit-log?user=&action=&from=&to=&page=` — paginated log
- `GET /api/settings/audit-log/export` — returns CSV

### DB Changes
- New table: `audit_log (id, admin_id uuid FK profiles, action text, record_type text, record_id uuid, record_name text, metadata jsonb, created_at timestamptz)`
- Index on `admin_id`, `action`, `created_at`

### Empty States
- "No actions logged yet. Actions will appear here as the platform is used."

### Edge Cases
- Log is append-only — no deletes
- Export respects current filters
- Show max 90 days in UI; archive older logs

---

## DB Migration Summary

```sql
-- profiles extensions
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS suspended boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES profiles(id);

-- invitations
CREATE TABLE IF NOT EXISTS invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'viewer')),
  token text NOT NULL UNIQUE,
  invited_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

-- portal_config (singleton)
CREATE TABLE IF NOT EXISTS portal_config (
  id int PRIMARY KEY DEFAULT 1,
  owner_widgets jsonb DEFAULT '{"revenue_summary":true,"health_score":true,"campaign_activity":true,"photo_compliance":true,"monthly_report":false}'::jsonb,
  manager_sections jsonb DEFAULT '{"photo_upload":true,"screen_info":true,"venue_stats":true,"contact_support":true}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO portal_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- platform_settings (singleton)
CREATE TABLE IF NOT EXISTS platform_settings (
  id int PRIMARY KEY DEFAULT 1,
  platform_name text DEFAULT 'GymGaze',
  support_email text,
  default_gym_revenue_split integer DEFAULT 30,
  invoice_prefix text DEFAULT 'GG-',
  fy_start_month integer DEFAULT 1,
  logo_url text,
  accent_color text DEFAULT '#D4FF4F',
  portal_domain text,
  welcome_message text,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- report_scheduler (singleton)
CREATE TABLE IF NOT EXISTS report_scheduler (
  id int PRIMARY KEY DEFAULT 1,
  enabled boolean DEFAULT false,
  delivery_day integer DEFAULT 1,
  recipients jsonb DEFAULT '[]'::jsonb,
  contents jsonb DEFAULT '{"revenue":true,"campaigns":true,"photos":true,"health":true}'::jsonb,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO report_scheduler (id) VALUES (1) ON CONFLICT DO NOTHING;

-- notification_preferences (per admin)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  preferences jsonb DEFAULT '{"photo_submitted":true,"photo_approved":false,"photo_rejected":true,"campaign_live":true,"campaign_ended":false,"revenue_added":false,"portal_login":true}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- api_credentials (singleton)
CREATE TABLE IF NOT EXISTS api_credentials (
  id int PRIMARY KEY DEFAULT 1,
  api_key_hash text,
  api_key_prefix text,
  webhook_url text,
  webhook_events jsonb DEFAULT '[]'::jsonb,
  ga4_measurement_id text,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO api_credentials (id) VALUES (1) ON CONFLICT DO NOTHING;

-- audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  record_type text,
  record_id uuid,
  record_name text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_admin_id_idx ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at DESC);
```

---

## Implementation Notes for Bolt

1. Settings page uses a **left sidebar nav** + right content area — not a single scrolling page
2. URL state: `?tab=team` so refreshing keeps you on the right section
3. All singleton tables use `id=1` pattern — always upsert on conflict
4. Audit log writes should be triggered from existing API routes (e.g. when a venue is created, also insert into audit_log)
5. API key: generate with `crypto.randomUUID()` + prefix `gg_live_`, store only the hash (bcrypt or SHA-256), show plaintext only once
6. Portal config toggles affect what renders in `/portal` routes — read portal_config there
7. Section 2 & 3 share the same `portal_config` table row
