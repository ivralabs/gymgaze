import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Generates the SLA PDF for a partnership proposal via Browserless.io.
 *
 * Flow:
 * 1. Fetch proposal + gym_network + venues from Supabase (service client)
 * 2. Build SLA HTML string with real data substituted
 * 3. POST HTML directly to Browserless /pdf
 * 4. Return PDF as a downloadable response
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const token = process.env.BROWSERLESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "missing_browserless_token", message: "Set BROWSERLESS_TOKEN in Vercel env vars" },
      { status: 500 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "missing_supabase_config" }, { status: 500 });
  }

  try {
    const svc = createServiceClient(supabaseUrl, serviceKey);

    const { data: proposal, error } = await svc
      .from("partnership_proposals")
      .select(`
        *,
        gym_networks (name, primary_contact_name, primary_contact_email, primary_contact_phone),
        partnership_proposal_venues (
          screens_planned, static_sites_planned, monthly_rental_projection,
          venues (name, city, province)
        )
      `)
      .eq("id", id)
      .single();

    if (error || !proposal) {
      return NextResponse.json({ error: "proposal_not_found", message: error?.message }, { status: 404 });
    }

    // Normalise gym_networks (UNIQUE FK → single object, but guard anyway)
    const network = Array.isArray(proposal.gym_networks)
      ? proposal.gym_networks[0]
      : proposal.gym_networks;

    // Normalise partnership_proposal_venues
    const propVenues: { venues: { name: string; city: string | null; province: string | null } | null }[] =
      Array.isArray(proposal.partnership_proposal_venues)
        ? proposal.partnership_proposal_venues
        : proposal.partnership_proposal_venues
        ? [proposal.partnership_proposal_venues]
        : [];

    const venueNames = propVenues
      .map(pv => pv.venues?.name)
      .filter(Boolean) as string[];

    const partnerName = network?.name ?? "Partner";
    const effectiveDate = new Date().toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const networkSlug = (partnerName)
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "");
    const filename = `GymGaze-SLA-${networkSlug}-v${proposal.version}.pdf`;

    const html = buildSlaHtml({
      partnerName,
      partnerContact: network?.primary_contact_name ?? "the Partner",
      proposalTitle: proposal.title,
      proposalVersion: String(proposal.version),
      effectiveDate,
      venuesList: venueNames.length > 0 ? venueNames.join(", ") : "To be confirmed",
      venueCount: String(venueNames.length || propVenues.length),
      revenueSplitPartner: String(proposal.revenue_split_partner_pct),
      revenueSplitGymgaze: String(proposal.revenue_split_gymgaze_pct),
      gracePeriod: String(proposal.grace_period_months),
      dedicatedSlots: String(proposal.dedicated_slots_count),
      slotDuration: String(proposal.dedicated_slot_seconds),
      paymentCycle: proposal.payment_cycle,
      proofOfFlight: proposal.proof_of_flight_required ? "required" : "not required",
      dataSharing: proposal.data_sharing_required ? "required" : "not required",
      sponsorshipsExcluded: proposal.sponsorships_excluded
        ? "excluded from revenue share"
        : "included in revenue share",
    });

    const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${token}`;

    const body = {
      html,
      options: {
        preferCSSPageSize: false,
        printBackground: true,
        format: "A4",
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
        displayHeaderFooter: false,
      },
    };

    const browserlessRes = await fetch(browserlessUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(body),
    });

    if (!browserlessRes.ok) {
      const errText = await browserlessRes.text();
      console.error("[sla-pdf] Browserless error:", browserlessRes.status, errText);
      return NextResponse.json(
        { error: "browserless_failed", status: browserlessRes.status, message: errText.slice(0, 500) },
        { status: 502 }
      );
    }

    const pdfBuffer = await browserlessRes.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[sla-pdf] error:", err);
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: "sla_render_failed", message }, { status: 500 });
  }
}

// ─── SLA HTML builder ─────────────────────────────────────────────────────────

interface SlaFields {
  partnerName: string;
  partnerContact: string;
  proposalTitle: string;
  proposalVersion: string;
  effectiveDate: string;
  venuesList: string;
  venueCount: string;
  revenueSplitPartner: string;
  revenueSplitGymgaze: string;
  gracePeriod: string;
  dedicatedSlots: string;
  slotDuration: string;
  paymentCycle: string;
  proofOfFlight: string;
  dataSharing: string;
  sponsorshipsExcluded: string;
}

function buildSlaHtml(f: SlaFields): string {
  return `<!DOCTYPE html>
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
    <div>Reference: GG-SLA-${f.proposalVersion}</div>
    <div>Effective Date: ${f.effectiveDate}</div>
    <div>Proposal: ${f.proposalTitle}</div>
  </div>
</div>

<h1>Service Level Agreement</h1>
<p style="color:#666;">This Service Level Agreement (&ldquo;Agreement&rdquo;) is entered into between GymGaze and ${f.partnerName} in respect of the GymGaze Media Network partnership.</p>

<div class="parties-box">
  <div class="party">
    <h3>Service Provider</h3>
    <p>GymGaze (Pty) Ltd</p>
    <p class="sub">Media Network Operator</p>
  </div>
  <div class="party">
    <h3>Partner</h3>
    <p>${f.partnerName}</p>
    <p class="sub">Gym Network Partner</p>
  </div>
</div>

<h2>1. Scope of Services</h2>
<p>GymGaze agrees to provide the following media network services across <strong>${f.venueCount} venue(s)</strong> operated by ${f.partnerName}:</p>
<ol>
  <li>Installation, operation, and maintenance of digital advertising screens and/or static media sites at the venues listed in Schedule A.</li>
  <li>Content scheduling, delivery, and proof of flight reporting for all advertising campaigns displayed within partner venues.</li>
  <li>Revenue sharing based on the terms set out in Section 4 of this Agreement.</li>
  <li>Dedicated advertising inventory of <strong>${f.dedicatedSlots} slots &times; ${f.slotDuration} seconds</strong> per loop for partner use.</li>
</ol>

<h2>2. Covered Venues (Schedule A)</h2>
<p>This Agreement covers the following ${f.partnerName} venues:</p>
<p><strong>${f.venuesList}</strong></p>
<p>Additional venues may be added by written amendment signed by both parties.</p>

<h2>3. Service Standards</h2>
<table>
  <tr><th>Service Metric</th><th>Standard</th></tr>
  <tr><td>Screen Uptime</td><td>Minimum 95% per calendar month</td></tr>
  <tr><td>Content Update Turnaround</td><td>Within 24 hours of approved creative receipt</td></tr>
  <tr><td>Proof of Flight Reporting</td><td>Monthly &mdash; ${f.proofOfFlight}</td></tr>
  <tr><td>Maintenance Response</td><td>Hardware fault reported &rarr; technician on-site within 48 hours</td></tr>
  <tr><td>Revenue Reporting</td><td>Monthly statements within 5 business days of month-end</td></tr>
  <tr><td>Payment Cycle</td><td>${f.paymentCycle}</td></tr>
</table>

<h2>4. Revenue Sharing</h2>
<p>Net advertising revenue generated from campaigns running within ${f.partnerName} venues shall be split as follows:</p>
<table>
  <tr><th>Party</th><th>Revenue Share</th></tr>
  <tr><td>${f.partnerName}</td><td><span class="highlight">${f.revenueSplitPartner}%</span></td></tr>
  <tr><td>GymGaze</td><td><span class="highlight">${f.revenueSplitGymgaze}%</span></td></tr>
</table>
<p>A grace period of <strong>${f.gracePeriod} month(s)</strong> applies from the installation date, during which no revenue share is required from the Partner.</p>
<p>Widget and sponsorship revenue is <strong>${f.sponsorshipsExcluded}</strong>.</p>
<p>Data sharing between parties is <strong>${f.dataSharing}</strong>.</p>

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
  <li>Pay the Partner&rsquo;s revenue share within the agreed payment cycle following month-end.</li>
  <li>Maintain all installed equipment in good working order throughout the term.</li>
  <li>Carry public liability insurance covering GymGaze equipment within partner venues.</li>
</ol>

<h2>7. Exclusions &amp; Advertiser Restrictions</h2>
<p>The following advertiser categories are excluded from campaigns running in ${f.partnerName} venues by default: direct competitor gym brands, tobacco products, and adult content. Any additional exclusions agreed during the proposal process are noted in the proposal terms.</p>

<h2>8. Term &amp; Termination</h2>
<ol>
  <li>This Agreement commences on the Effective Date and continues for an initial term of 24 months.</li>
  <li>Either party may terminate with 60 days written notice after the initial term.</li>
  <li>GymGaze may terminate immediately if the Partner prevents access to screens for more than 30 consecutive days.</li>
  <li>Upon termination, GymGaze retains the right to remove all installed equipment within 30 days.</li>
</ol>

<h2>9. Liability &amp; Indemnity</h2>
<p>GymGaze&rsquo;s total liability under this Agreement shall not exceed the total revenue share paid to the Partner in the preceding 3 months. Neither party shall be liable for indirect or consequential losses. The Partner indemnifies GymGaze against claims arising from Partner&rsquo;s breach of this Agreement.</p>

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
    <h3>For and on behalf of ${f.partnerName}</h3>
    <div class="sig-line"></div>
    <div class="sig-label">Authorised Signatory</div>
    <div class="sig-label" style="margin-top:8px;">Name: _______________________</div>
    <div class="sig-label">Title: ________________________</div>
    <div class="sig-label">Date: ________________________</div>
  </div>
</div>

<div class="footer">
  GymGaze (Pty) Ltd &middot; Media Network Services &middot; gymgaze.io &middot; This document is confidential and intended solely for ${f.partnerName}
</div>

</body>
</html>`;
}
