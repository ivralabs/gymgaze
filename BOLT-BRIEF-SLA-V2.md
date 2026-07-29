# Bolt Brief — GymGaze SLA v2 (Revised)

## What to fix

Update `src/app/api/proposals/[id]/sla/route.ts` with a completely rewritten SLA HTML template.

**Three key changes from v1:**
1. Revenue split is on **GROSS ad revenue** not net — fix everywhere it's mentioned
2. **Remove all lease/property references** — no mention of installation locations, wall access, physical space, screen placement. That goes in a separate Lease Agreement.
3. **Strengthen the SLA** — add missing commercial and service delivery clauses (see template below)

---

## New SLA HTML Template

Replace the entire HTML string in the route with the following. Keep all the `{{PLACEHOLDER}}` substitution logic exactly as-is — just replace the HTML content.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; color: #1a1a1a; background: #fff; padding: 60px; line-height: 1.7; }
  .header { border-bottom: 3px solid #D4FF4F; padding-bottom: 24px; margin-bottom: 36px; display: flex; justify-content: space-between; align-items: flex-end; }
  .logo-name { font-size: 22pt; font-weight: 800; letter-spacing: -1px; color: #0F0F0F; }
  .logo-name span { color: #D4FF4F; background: #0F0F0F; padding: 2px 8px; border-radius: 3px; }
  .doc-meta { text-align: right; font-size: 9pt; color: #555; line-height: 1.8; }
  .doc-meta strong { font-size: 10pt; display: block; margin-bottom: 4px; }
  h1 { font-size: 17pt; font-weight: 800; margin-bottom: 4px; }
  .subtitle { font-size: 10pt; color: #666; margin-bottom: 28px; }
  h2 { font-size: 11.5pt; font-weight: 700; margin: 32px 0 10px; color: #0F0F0F; border-left: 4px solid #D4FF4F; padding-left: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
  p { margin-bottom: 10px; font-size: 10.5pt; }
  .parties-box { display: flex; gap: 0; margin: 20px 0 28px; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; }
  .party { flex: 1; padding: 18px 22px; }
  .party:first-child { border-right: 1px solid #e0e0e0; background: #0F0F0F; color: #fff; }
  .party:last-child { background: #fafafa; }
  .party .party-label { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.6; margin-bottom: 6px; }
  .party .party-name { font-size: 13pt; font-weight: 700; margin-bottom: 2px; }
  .party .party-role { font-size: 9pt; opacity: 0.7; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0 6px; font-size: 10pt; }
  thead tr th { background: #0F0F0F; color: #fff; padding: 9px 14px; text-align: left; font-weight: 600; font-size: 9.5pt; }
  tbody tr td { padding: 9px 14px; border-bottom: 1px solid #ececec; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) td { background: #f9f9f9; }
  .highlight { background: #D4FF4F; color: #0F0F0F; padding: 2px 8px; border-radius: 3px; font-weight: 700; font-size: 10pt; display: inline-block; }
  .info-box { background: #f5f5f5; border-left: 4px solid #D4FF4F; padding: 14px 18px; margin: 12px 0; border-radius: 0 4px 4px 0; font-size: 10pt; }
  ol { padding-left: 22px; margin: 8px 0; }
  ol li { margin-bottom: 8px; font-size: 10.5pt; }
  ol li strong { color: #0F0F0F; }
  .signature-section { margin-top: 52px; padding-top: 28px; border-top: 2px solid #0F0F0F; display: flex; gap: 60px; }
  .sig-block { flex: 1; }
  .sig-block .sig-party { font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 28px; }
  .sig-line { border-bottom: 1.5px solid #1a1a1a; margin-bottom: 7px; height: 36px; }
  .sig-label { font-size: 9pt; color: #666; margin-bottom: 10px; }
  .footer { margin-top: 44px; padding-top: 14px; border-top: 1px solid #ddd; font-size: 8pt; color: #aaa; text-align: center; line-height: 1.6; }
  .clause-note { font-size: 9.5pt; color: #555; font-style: italic; margin-top: 6px; }
  .page-break { page-break-before: always; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo-name">Gym<span>Gaze</span></div>
    <div style="font-size:9pt;color:#777;margin-top:5px;">Media Network Services</div>
  </div>
  <div class="doc-meta">
    <strong>SERVICE LEVEL AGREEMENT</strong>
    <span>Reference: GG-SLA-{{PROPOSAL_VERSION}}</span>
    <span>Effective Date: {{EFFECTIVE_DATE}}</span>
    <span>Proposal: {{PROPOSAL_TITLE}}</span>
  </div>
</div>

<h1>Service Level Agreement</h1>
<p class="subtitle">This Service Level Agreement ("Agreement") governs the media network services provided by GymGaze to {{PARTNER_NAME}} and sets out the obligations, performance standards, and commercial terms applicable to the partnership.</p>

<div class="parties-box">
  <div class="party">
    <div class="party-label">Service Provider</div>
    <div class="party-name">GymGaze (Pty) Ltd</div>
    <div class="party-role">Media Network Operator</div>
  </div>
  <div class="party">
    <div class="party-label">Partner</div>
    <div class="party-name">{{PARTNER_NAME}}</div>
    <div class="party-role">Gym Network Partner</div>
  </div>
</div>

<h2>1. Definitions</h2>
<ol>
  <li><strong>"Gross Ad Revenue"</strong> means the total invoiced advertising revenue received by GymGaze from advertisers for campaigns displayed within Partner venues, before any deductions, commissions, or expenses.</li>
  <li><strong>"Campaign"</strong> means any advertising content scheduled to run on GymGaze screens or static media within Partner venues for a defined flight period.</li>
  <li><strong>"Proof of Flight"</strong> means a verified report confirming that a Campaign was delivered as scheduled, including play counts, duration, and time-of-day breakdown.</li>
  <li><strong>"Dedicated Inventory"</strong> means advertising slots reserved exclusively for Partner's own use or Partner-approved campaigns.</li>
  <li><strong>"Uptime"</strong> means the percentage of scheduled operating hours during which GymGaze screens are displaying content correctly.</li>
  <li><strong>"Service Credit"</strong> means a reduction in GymGaze's revenue share in a given month as compensation for failure to meet agreed service standards.</li>
</ol>

<h2>2. Scope of Services</h2>
<p>GymGaze agrees to provide the following services across the <strong>{{VENUE_COUNT}} venue(s)</strong> specified in this Agreement:</p>
<ol>
  <li>Operation, content management, and maintenance of digital advertising screens and/or static media across Partner venues.</li>
  <li>End-to-end campaign management including scheduling, delivery, monitoring, and post-campaign reporting.</li>
  <li>Provision of <strong>{{DEDICATED_SLOTS}} dedicated advertising slots of {{SLOT_DURATION}} seconds each</strong> per loop cycle, reserved for Partner's own promotional use or Partner-approved advertisers.</li>
  <li>Monthly Gross Ad Revenue reporting and Partner revenue share payments in accordance with Section 5.</li>
  <li>A 24/7 monitoring service for screen uptime with automated alerts for any offline events.</li>
</ol>

<h2>3. Covered Venues</h2>
<p>This Agreement covers the following venues operated by {{PARTNER_NAME}}:</p>
<div class="info-box">
  <strong>{{VENUES_LIST}}</strong>
</div>
<p>Additional venues may be added to this Agreement by written addendum signed by both parties. Each addendum shall specify the venue name, location, and any venue-specific commercial terms.</p>

<h2>4. Service Standards & Performance</h2>
<table>
  <thead>
    <tr>
      <th>Service Metric</th>
      <th>Committed Standard</th>
      <th>Measurement Period</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Screen Uptime</strong></td>
      <td>Minimum 95% of scheduled operating hours</td>
      <td>Per calendar month, per venue</td>
    </tr>
    <tr>
      <td><strong>Content Update Turnaround</strong></td>
      <td>Within 24 hours of receipt of approved creative</td>
      <td>Per campaign request</td>
    </tr>
    <tr>
      <td><strong>Proof of Flight Reporting</strong></td>
      <td>{{PROOF_OF_FLIGHT}} — delivered within 5 business days of campaign end</td>
      <td>Per campaign</td>
    </tr>
    <tr>
      <td><strong>Hardware Fault Response</strong></td>
      <td>Acknowledgement within 4 hours; on-site resolution within 48 hours</td>
      <td>Per incident</td>
    </tr>
    <tr>
      <td><strong>Revenue Statement Delivery</strong></td>
      <td>Within 5 business days of month-end</td>
      <td>Monthly</td>
    </tr>
    <tr>
      <td><strong>Partner Revenue Payment</strong></td>
      <td>{{PAYMENT_CYCLE}} following revenue statement delivery</td>
      <td>Per payment cycle</td>
    </tr>
    <tr>
      <td><strong>Data Sharing</strong></td>
      <td>{{DATA_SHARING}}</td>
      <td>Monthly</td>
    </tr>
  </tbody>
</table>

<h2>5. Gross Ad Revenue Sharing</h2>
<p>All revenue sharing under this Agreement is calculated on <strong>Gross Ad Revenue</strong> — the total invoiced advertising revenue received by GymGaze for campaigns running within Partner venues, prior to any deductions.</p>
<table>
  <thead>
    <tr><th>Party</th><th>Revenue Share</th><th>Basis</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>{{PARTNER_NAME}}</strong></td>
      <td><span class="highlight">{{REVENUE_SPLIT_PARTNER}}%</span></td>
      <td>Of Gross Ad Revenue from Partner venues</td>
    </tr>
    <tr>
      <td><strong>GymGaze</strong></td>
      <td><span class="highlight">{{REVENUE_SPLIT_GYMGAZE}}%</span></td>
      <td>Of Gross Ad Revenue from Partner venues</td>
    </tr>
  </tbody>
</table>

<div class="info-box">
  <strong>Grace Period:</strong> A grace period of <strong>{{GRACE_PERIOD}} month(s)</strong> applies from the date the first screen goes live in each venue. No revenue share is payable by GymGaze to the Partner during this period. The grace period allows for audience calibration, campaign pipeline development, and baseline data collection.
</div>

<p><strong>Widget &amp; Sponsorship Revenue</strong> is {{SPONSORSHIPS_EXCLUDED}}. This applies to branded widget sponsorships (news, sports, weather) which carry a fixed sponsorship fee structure separate from CPM-based ad campaigns.</p>

<p><strong>Minimum Guarantee:</strong> GymGaze does not provide a minimum monthly revenue guarantee unless separately agreed in writing. Revenue is performance-based and subject to advertiser demand, campaign fill rates, and seasonal variation.</p>

<h2>6. Revenue Reporting & Audit Rights</h2>
<ol>
  <li>GymGaze shall provide the Partner with a monthly Gross Ad Revenue statement for each venue, detailing total campaigns run, total revenue generated, and the Partner's calculated share.</li>
  <li>Statements shall be delivered to the Partner's nominated email address within 5 business days of month-end.</li>
  <li>The Partner has the right to request a revenue audit once per calendar year, with 14 days written notice. GymGaze shall provide reasonable access to campaign booking records and invoicing data for the period under audit.</li>
  <li>Any revenue discrepancy identified through audit must be resolved and any shortfall paid within 30 days of audit completion.</li>
  <li>GymGaze shall maintain accurate records of all campaign bookings and revenue for a minimum of 5 years.</li>
</ol>

<h2>7. Service Credits</h2>
<p>If GymGaze fails to meet the committed Screen Uptime standard in any calendar month, the Partner is entitled to a Service Credit applied against GymGaze's revenue share for that month, calculated as follows:</p>
<table>
  <thead>
    <tr><th>Uptime Achieved</th><th>Service Credit (on GymGaze share)</th></tr>
  </thead>
  <tbody>
    <tr><td>90% – 94.9%</td><td>5% credit</td></tr>
    <tr><td>80% – 89.9%</td><td>10% credit</td></tr>
    <tr><td>Below 80%</td><td>15% credit</td></tr>
  </tbody>
</table>
<p class="clause-note">Service Credits apply per venue per month and are applied to the following month's payment. Credits do not apply to downtime caused by Partner actions, force majeure, or scheduled maintenance notified 24 hours in advance.</p>

<h2>8. Advertiser Standards & Exclusions</h2>
<ol>
  <li>GymGaze shall ensure all advertising content complies with the Advertising Regulatory Board (ARB) Code of Advertising Practice applicable in South Africa.</li>
  <li>The following advertiser categories are permanently excluded from Partner venues: direct competitor gym and fitness brands, tobacco and vaping products, adult content, and illegal or unlicensed financial services.</li>
  <li>The Partner may request exclusion of additional advertiser categories by written notice. GymGaze shall implement such exclusions within 5 business days and confirm in writing.</li>
  <li>GymGaze retains the right to decline any campaign that conflicts with Partner's brand values, provided the Partner communicates such conflicts in writing.</li>
</ol>

<h2>9. Dedicated Inventory</h2>
<ol>
  <li>GymGaze shall reserve <strong>{{DEDICATED_SLOTS}} slots of {{SLOT_DURATION}} seconds each</strong> per loop cycle across Partner venues for the Partner's exclusive use.</li>
  <li>Dedicated slots unused by the Partner in any given week revert to GymGaze's general advertising inventory for that period. Unused slots do not accumulate or carry over.</li>
  <li>The Partner shall submit creative for dedicated slots in the correct format and dimensions specified by GymGaze's technical guidelines. GymGaze accepts no liability for display quality arising from incorrectly formatted creative.</li>
</ol>

<h2>10. GymGaze Obligations</h2>
<ol>
  <li>Maintain all media equipment in good operational order throughout the term of this Agreement.</li>
  <li>Carry adequate public liability insurance covering GymGaze operations within Partner venues.</li>
  <li>Ensure the Partner's brand, logo, and venue information is never used in external advertising or marketing without prior written consent.</li>
  <li>Notify the Partner of any planned maintenance that will result in screen downtime, with a minimum of 24 hours advance notice.</li>
  <li>Keep all Partner revenue and operational data strictly confidential and not share it with third parties without written consent, except as required by law.</li>
  <li>Provide the Partner with a dedicated account contact for operational queries, reachable during business hours (Monday–Friday, 08:00–17:00 SAST).</li>
</ol>

<h2>11. Partner Obligations</h2>
<ol>
  <li>Ensure stable power supply and internet connectivity is available and maintained at each venue for GymGaze equipment, as specified in the accompanying Lease Agreement.</li>
  <li>Notify GymGaze at least 14 days in advance of any venue renovation, closure, or change in operating hours that may affect GymGaze equipment or audience traffic.</li>
  <li>Not permit any third-party advertising screens or static media to be installed within 2 metres of any GymGaze screen without prior written consent.</li>
  <li>Provide GymGaze with access to venues during business hours for maintenance and equipment checks, and outside business hours by prior arrangement for urgent repairs.</li>
  <li>Provide aggregated member entry and foot traffic data monthly if data sharing is required under this Agreement.</li>
  <li>Not reproduce, copy, or share GymGaze's campaign data, rate cards, or reporting with any third party without written consent.</li>
</ol>

<h2>12. Confidentiality</h2>
<p>Both parties agree to keep confidential all financial terms, revenue figures, campaign data, and operational information disclosed under this Agreement. This obligation survives termination for a period of 3 years. Neither party shall make public statements about the commercial terms of this Agreement without prior written consent from the other party.</p>

<h2>13. Intellectual Property</h2>
<p>All advertising creative, campaign materials, and content displayed on GymGaze screens remains the property of the respective advertiser or agency. GymGaze retains ownership of its platform, scheduling software, and reporting systems. The Partner retains ownership of its brand assets. Neither party acquires any IP rights of the other through this Agreement.</p>

<h2>14. Term & Termination</h2>
<ol>
  <li>This Agreement commences on the Effective Date and continues for an initial term of <strong>24 months</strong>.</li>
  <li>Following the initial term, the Agreement renews automatically on a 12-month basis unless either party gives 60 days written notice of non-renewal before the renewal date.</li>
  <li>Either party may terminate this Agreement during the initial term with 90 days written notice if the other party commits a material breach that remains unremedied after 30 days written notice of the breach.</li>
  <li>GymGaze may suspend services immediately and terminate with 14 days notice if the Partner's venues cease operations, are sold, or transferred to new ownership without prior written notification to GymGaze.</li>
  <li>Upon termination for any reason, all outstanding revenue share payments due to the Partner shall be settled within 30 days of the effective termination date.</li>
</ol>

<h2>15. Dispute Resolution</h2>
<ol>
  <li>Both parties agree to attempt to resolve any dispute through good-faith negotiation within 20 business days of written notice of a dispute.</li>
  <li>If negotiation fails, the parties shall refer the dispute to mediation before a mutually agreed mediator in Johannesburg, Gauteng, within 30 days.</li>
  <li>If mediation fails, either party may refer the matter to the courts of the Republic of South Africa, Gauteng Division.</li>
</ol>

<h2>16. Governing Law</h2>
<p>This Agreement is governed by the laws of the Republic of South Africa. The parties consent to the non-exclusive jurisdiction of the High Court of South Africa, Gauteng Division, Johannesburg.</p>

<h2>17. General</h2>
<ol>
  <li><strong>Entire Agreement:</strong> This Agreement, together with the accompanying Lease Agreement, constitutes the entire agreement between the parties and supersedes all prior discussions and representations.</li>
  <li><strong>Amendments:</strong> No amendment to this Agreement is valid unless in writing and signed by authorised representatives of both parties.</li>
  <li><strong>Severability:</strong> If any provision is found to be unenforceable, the remaining provisions continue in full force.</li>
  <li><strong>Force Majeure:</strong> Neither party is liable for failure to perform obligations caused by events beyond their reasonable control, including load-shedding, natural disasters, or civil unrest, provided the affected party notifies the other within 5 business days.</li>
  <li><strong>Notices:</strong> All formal notices under this Agreement must be in writing and delivered by email with read receipt or registered post to the authorised signatories of each party.</li>
</ol>

<div class="signature-section">
  <div class="sig-block">
    <div class="sig-party">For and on behalf of GymGaze (Pty) Ltd</div>
    <div class="sig-line"></div>
    <div class="sig-label">Signature</div>
    <div class="sig-label" style="margin-top:12px;">Full Name: ___________________________</div>
    <div class="sig-label" style="margin-top:8px;">Title / Designation: __________________</div>
    <div class="sig-label" style="margin-top:8px;">Date: ________________________________</div>
  </div>
  <div class="sig-block">
    <div class="sig-party">For and on behalf of {{PARTNER_NAME}}</div>
    <div class="sig-line"></div>
    <div class="sig-label">Signature</div>
    <div class="sig-label" style="margin-top:12px;">Full Name: ___________________________</div>
    <div class="sig-label" style="margin-top:8px;">Title / Designation: __________________</div>
    <div class="sig-label" style="margin-top:8px;">Date: ________________________________</div>
  </div>
</div>

<div class="footer">
  GymGaze (Pty) Ltd · Media Network Services · gymgaze.io<br>
  This document is confidential and intended solely for {{PARTNER_NAME}}. Reference: GG-SLA-{{PROPOSAL_VERSION}} · Effective {{EFFECTIVE_DATE}}
</div>

</body>
</html>
```

---

## What changed from v1

1. **Gross Ad Revenue** — Section 5 now explicitly defines Gross Ad Revenue and uses it throughout. No mention of "net".
2. **No lease/property clauses** — Removed: installation locations, wall access, physical space, who pays for power, screen placement specs. Those belong in the Lease Agreement. Clause 11.1 simply says "as specified in the accompanying Lease Agreement."
3. **Added Definitions section** (Section 1) — legally clean, defines all key terms upfront
4. **Added Audit Rights** (Section 6) — Partner can audit once/year
5. **Added Service Credits** (Section 7) — financial remedy for uptime failures
6. **Strengthened Advertiser Standards** (Section 8) — ARB compliance, exclusion request process
7. **Added Confidentiality** (Section 12) — 3-year post-termination survival
8. **Added IP clause** (Section 13)
9. **Strengthened Termination** (Section 14) — 90-day material breach, venue sale trigger
10. **Added Dispute Resolution** (Section 15) — mediation before litigation
11. **Added Force Majeure** including load-shedding specifically
12. **17 sections total** — legally solid, nothing missing

---

## Implementation

Only change needed: replace the HTML template string in `src/app/api/proposals/[id]/sla/route.ts`. All `{{PLACEHOLDER}}` substitution logic stays identical. No DB changes. No UI changes.

## Verification

1. `pnpm build` — must pass
2. Download SLA from `/admin/proposals/39681bdf-62e4-47ab-be33-9897ab480012`
3. Verify: "Gross Ad Revenue" appears in Section 5, no mention of lease/installation/wall space, 17 sections present, signature blocks clean
4. Single commit: `feat(proposals): SLA v2 — gross revenue, no lease overlap, 17-clause solid agreement`
5. Push via PAT: `git -c credential.helper= push https://ivralabs:REDACTED_PAT@github.com/ivralabs/gymgaze.git main`

## Token budget
Sonnet. Template replacement only.
