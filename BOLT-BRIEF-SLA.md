# Bolt Brief — GymGaze SLA Generator

## What to build

Add an **"SLA" download button** to the proposal detail page (`/admin/proposals/[id]`) that generates and downloads a Service Level Agreement PDF for the gym network partner.

The SLA is generated from the existing proposal data — no new DB tables needed.

---

## Files to create

### 1. `src/app/api/proposals/[id]/sla/route.ts`
API route that:
- Fetches the proposal + gym_network + proposal_venues from Supabase (service client)
- Generates SLA HTML string (see template below)
- Sends to CloudConvert for PDF conversion (same pattern as `/api/rate-card/pdf/route.ts`)
- Returns the PDF as a downloadable response with filename `GymGaze-SLA-[NetworkName]-v[version].pdf`

### 2. No new UI pages needed
Just add a button to the existing `ProposalDetailClient.tsx` alongside the existing Download PDF and Occupancy Scenarios PDF buttons.

---

## SLA Content Template

The SLA must use real data from the proposal. Fields to inject:
- `{{PARTNER_NAME}}` — gym_networks.name (e.g. "Edge Fitness")
- `{{PARTNER_CONTACT}}` — gym_networks.primary_contact_name ?? "the Partner"
- `{{PROPOSAL_TITLE}}` — proposal.title
- `{{PROPOSAL_VERSION}}` — proposal.version
- `{{EFFECTIVE_DATE}}` — today's date formatted as "1 July 2026"
- `{{VENUES_LIST}}` — comma-separated venue names from partnership_proposal_venues → venues.name
- `{{VENUE_COUNT}}` — count of venues
- `{{REVENUE_SPLIT_PARTNER}}` — proposal.revenue_split_partner_pct
- `{{REVENUE_SPLIT_GYMGAZE}}` — proposal.revenue_split_gymgaze_pct
- `{{GRACE_PERIOD}}` — proposal.grace_period_months
- `{{DEDICATED_SLOTS}}` — proposal.dedicated_slots_count
- `{{SLOT_DURATION}}` — proposal.dedicated_slot_seconds
- `{{PAYMENT_CYCLE}}` — proposal.payment_cycle
- `{{PROOF_OF_FLIGHT}}` — "required" if proposal.proof_of_flight_required else "not required"
- `{{DATA_SHARING}}` — "required" if proposal.data_sharing_required else "not required"
- `{{SPONSORSHIPS_EXCLUDED}}` — "excluded from revenue share" if proposal.sponsorships_excluded else "included in revenue share"

---

## SLA HTML Template

Use this exact structure. GymGaze brand colours: dark bg `#0F0F0F`, accent lime `#D4FF4F`. For PDF use white background with dark text.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; color: #1a1a1a; background: #fff; padding: 60px; line-height: 1.6; }
  .header { border-bottom: 3px solid #D4FF4F; padding-bottom: 24px; margin-bottom: 36px; display: flex; justify-content: space-between; align-items: flex-end; }
  .logo-name { font-size: 22pt; font-weight: 800; letter-spacing: -1px; color: #0F0F0F; }
  .logo-name span { color: #D4FF4F; background: #0F0F0F; padding: 2px 6px; border-radius: 3px; }
  .doc-meta { text-align: right; font-size: 9pt; color: #666; }
  h1 { font-size: 16pt; font-weight: 700; margin-bottom: 6px; }
  h2 { font-size: 12pt; font-weight: 700; margin: 28px 0 10px; color: #0F0F0F; border-left: 3px solid #D4FF4F; padding-left: 10px; }
  p { margin-bottom: 10px; }
  .parties-box { background: #f8f8f8; border: 1px solid #e5e5e5; border-radius: 6px; padding: 20px 24px; margin: 20px 0; display: flex; gap: 40px; }
  .party h3 { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 6px; }
  .party p { font-size: 11pt; font-weight: 600; margin: 0; }
  .party .sub { font-size: 9pt; font-weight: 400; color: #666; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
  th { background: #0F0F0F; color: #fff; padding: 8px 12px; text-align: left; font-weight: 600; }
  td { padding: 8px 12px; border-bottom: 1px solid #e5e5e5; }
  tr:nth-child(even) td { background: #fafafa; }
  .highlight { background: #D4FF4F; padding: 2px 6px; border-radius: 3px; font-weight: 700; font-size: 10pt; }
  .signature-section { margin-top: 48px; border-top: 1px solid #e5e5e5; padding-top: 32px; display: flex; gap: 60px; }
  .sig-block { flex: 1; }
  .sig-block h3 { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #888; margin-bottom: 24px; }
  .sig-line { border-bottom: 1px solid #1a1a1a; margin-bottom: 6px; height: 32px; }
  .sig-label { font-size: 9pt; color: #666; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 8pt; color: #999; text-align: center; }
  ol { padding-left: 20px; }
  ol li { margin-bottom: 8px; }
  .clause-num { font-weight: 700; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo-name">Gym<span>Gaze</span></div>
    <div style="font-size:9pt;color:#666;margin-top:4px;">Media Network Services</div>
  </div>
  <div class="doc-meta">
    <div style="font-weight:700;">SERVICE LEVEL AGREEMENT</div>
    <div>Reference: GG-SLA-{{PROPOSAL_VERSION}}</div>
    <div>Effective Date: {{EFFECTIVE_DATE}}</div>
    <div>Proposal: {{PROPOSAL_TITLE}}</div>
  </div>
</div>

<h1>Service Level Agreement</h1>
<p style="color:#666;">This Service Level Agreement ("Agreement") is entered into between GymGaze and {{PARTNER_NAME}} in respect of the GymGaze Media Network partnership.</p>

<div class="parties-box">
  <div class="party">
    <h3>Service Provider</h3>
    <p>GymGaze (Pty) Ltd</p>
    <p class="sub">Media Network Operator</p>
  </div>
  <div class="party">
    <h3>Partner</h3>
    <p>{{PARTNER_NAME}}</p>
    <p class="sub">Gym Network Partner</p>
  </div>
</div>

<h2>1. Scope of Services</h2>
<p>GymGaze agrees to provide the following media network services across <strong>{{VENUE_COUNT}} venue(s)</strong> operated by {{PARTNER_NAME}}:</p>
<ol>
  <li>Installation, operation, and maintenance of digital advertising screens and/or static media sites at the venues listed in Schedule A.</li>
  <li>Content scheduling, delivery, and proof of flight reporting for all advertising campaigns displayed within partner venues.</li>
  <li>Revenue sharing based on the terms set out in Section 4 of this Agreement.</li>
  <li>Dedicated advertising inventory of <strong>{{DEDICATED_SLOTS}} slots × {{SLOT_DURATION}} seconds</strong> per loop for partner use.</li>
</ol>

<h2>2. Covered Venues (Schedule A)</h2>
<p>This Agreement covers the following {{PARTNER_NAME}} venues:</p>
<p><strong>{{VENUES_LIST}}</strong></p>
<p>Additional venues may be added by written amendment signed by both parties.</p>

<h2>3. Service Standards</h2>
<table>
  <tr><th>Service Metric</th><th>Standard</th></tr>
  <tr><td>Screen Uptime</td><td>Minimum 95% per calendar month</td></tr>
  <tr><td>Content Update Turnaround</td><td>Within 24 hours of approved creative receipt</td></tr>
  <tr><td>Proof of Flight Reporting</td><td>Monthly — {{PROOF_OF_FLIGHT}}</td></tr>
  <tr><td>Maintenance Response</td><td>Hardware fault reported → technician on-site within 48 hours</td></tr>
  <tr><td>Revenue Reporting</td><td>Monthly statements within 5 business days of month-end</td></tr>
  <tr><td>Payment Cycle</td><td>{{PAYMENT_CYCLE}}</td></tr>
</table>

<h2>4. Revenue Sharing</h2>
<p>Net advertising revenue generated from campaigns running within {{PARTNER_NAME}} venues shall be split as follows:</p>
<table>
  <tr><th>Party</th><th>Revenue Share</th></tr>
  <tr><td>{{PARTNER_NAME}}</td><td><span class="highlight">{{REVENUE_SPLIT_PARTNER}}%</span></td></tr>
  <tr><td>GymGaze</td><td><span class="highlight">{{REVENUE_SPLIT_GYMGAZE}}%</span></td></tr>
</table>
<p>A grace period of <strong>{{GRACE_PERIOD}} month(s)</strong> applies from the installation date, during which no revenue share is required from the Partner.</p>
<p>Widget and sponsorship revenue is <strong>{{SPONSORSHIPS_EXCLUDED}}</strong>.</p>
<p>Data sharing between parties is <strong>{{DATA_SHARING}}</strong>.</p>

<h2>5. Partner Obligations</h2>
<ol>
  <li>Provide safe, unobstructed access to agreed screen locations within venues.</li>
  <li>Maintain adequate power supply (220V, minimum 10A) to each screen location.</li>
  <li>Provide stable Wi-Fi or LAN connectivity for content delivery at each venue.</li>
  <li>Notify GymGaze at least 14 days in advance of any venue renovations that may affect screens.</li>
  <li>Not remove, obstruct, or tamper with GymGaze-installed equipment without written consent.</li>
  <li>Provide member entry data (aggregated, anonymised) monthly if data sharing is required under this Agreement.</li>
</ol>

<h2>6. GymGaze Obligations</h2>
<ol>
  <li>Install and commission all screens and media equipment at no capital cost to the Partner.</li>
  <li>Ensure all advertising content complies with applicable South African advertising standards (ASA).</li>
  <li>Provide the Partner with a monthly proof-of-flight report confirming campaign delivery.</li>
  <li>Pay the Partner's revenue share within the agreed payment cycle following month-end.</li>
  <li>Maintain all installed equipment in good working order throughout the term.</li>
  <li>Carry public liability insurance covering GymGaze equipment within partner venues.</li>
</ol>

<h2>7. Exclusions & Advertiser Restrictions</h2>
<p>The following advertiser categories are excluded from campaigns running in {{PARTNER_NAME}} venues by default: direct competitor gym brands, tobacco products, and adult content. Any additional exclusions agreed during the proposal process are noted in the proposal terms.</p>

<h2>8. Term & Termination</h2>
<ol>
  <li>This Agreement commences on the Effective Date and continues for an initial term of 24 months.</li>
  <li>Either party may terminate with 60 days written notice after the initial term.</li>
  <li>GymGaze may terminate immediately if the Partner prevents access to screens for more than 30 consecutive days.</li>
  <li>Upon termination, GymGaze retains the right to remove all installed equipment within 30 days.</li>
</ol>

<h2>9. Liability & Indemnity</h2>
<p>GymGaze's total liability under this Agreement shall not exceed the total revenue share paid to the Partner in the preceding 3 months. Neither party shall be liable for indirect or consequential losses. The Partner indemnifies GymGaze against claims arising from Partner's breach of this Agreement.</p>

<h2>10. Governing Law</h2>
<p>This Agreement is governed by the laws of the Republic of South Africa. Any disputes shall be resolved by mediation before litigation, in the jurisdiction of Johannesburg, Gauteng.</p>

<div class="signature-section">
  <div class="sig-block">
    <h3>For and on behalf of GymGaze (Pty) Ltd</h3>
    <div class="sig-line"></div>
    <div class="sig-label">Authorised Signatory</div>
    <div class="sig-label" style="margin-top:8px;">Name: _______________________</div>
    <div class="sig-label">Title: ________________________</div>
    <div class="sig-label">Date: ________________________</div>
  </div>
  <div class="sig-block">
    <h3>For and on behalf of {{PARTNER_NAME}}</h3>
    <div class="sig-line"></div>
    <div class="sig-label">Authorised Signatory</div>
    <div class="sig-label" style="margin-top:8px;">Name: _______________________</div>
    <div class="sig-label">Title: ________________________</div>
    <div class="sig-label">Date: ________________________</div>
  </div>
</div>

<div class="footer">
  GymGaze (Pty) Ltd · Media Network Services · gymgaze.io · This document is confidential and intended solely for {{PARTNER_NAME}}
</div>

</body>
</html>
```

---

## API Route Implementation

File: `src/app/api/proposals/[id]/sla/route.ts`

Pattern: copy from `src/app/api/rate-card/pdf/route.ts` — same CloudConvert pattern. Replace HTML content with SLA template above, substituting real proposal values.

Key data to fetch:
```ts
const { data: proposal } = await svc
  .from('partnership_proposals')
  .select(`
    *,
    gym_networks (name, primary_contact_name, primary_contact_email, primary_contact_phone),
    partnership_proposal_venues (
      screens_planned, static_sites_planned, monthly_rental_projection,
      venues (name, city, province)
    )
  `)
  .eq('id', id)
  .single();
```

Date formatting: `new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })`

---

## UI Button

In `ProposalDetailClient.tsx`, add alongside the existing Download PDF button:

```tsx
<button
  onClick={() => window.open(`/api/proposals/${proposal.id}/sla`, '_blank')}
  className="flex items-center gap-1.5 px-3 py-1.5 bg-lime-400 text-black text-xs font-semibold rounded hover:bg-lime-300 transition-colors"
>
  <FileText size={13} /> Download SLA
</button>
```

Use lime accent (`bg-lime-400`) to distinguish from the grey Download PDF button.

---

## Verification

1. `pnpm build` — must pass
2. Open `/admin/proposals/39681bdf-62e4-47ab-be33-9897ab480012`
3. Click "Download SLA" — PDF should download as `GymGaze-SLA-Edge-Fitness-v1.pdf`
4. Verify PDF contains: Edge Fitness name, correct revenue split, venue list, signature blocks
5. Git commit + push via PAT: `git -c credential.helper= push https://ivralabs:REDACTED_PAT@github.com/ivralabs/gymgaze.git main`

## Token budget
Sonnet. Mechanical build — HTML template + API route + one button.
