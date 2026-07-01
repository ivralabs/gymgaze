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
        margin: { top: "60px", right: "60px", bottom: "60px", left: "60px" },
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
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11pt; color: #1a1a1a; background: #fff; padding: 0; line-height: 1.7; }
  .header { border-bottom: 3px solid #D4FF4F; padding-bottom: 24px; margin-bottom: 36px; display: flex; justify-content: space-between; align-items: flex-end; }
  .logo-name { font-size: 22pt; font-weight: 800; letter-spacing: -1px; color: #0F0F0F; }
  .logo-name span { color: #D4FF4F; background: #0F0F0F; padding: 2px 8px; border-radius: 3px; }
  .doc-meta { text-align: right; font-size: 9pt; color: #555; line-height: 1.8; }
  .doc-meta strong { font-size: 10pt; display: block; margin-bottom: 4px; }
  h1 { font-size: 17pt; font-weight: 800; margin-bottom: 4px; }
  .subtitle { font-size: 10pt; color: #666; margin-bottom: 28px; }
  h2 { font-size: 11.5pt; font-weight: 700; margin: 40px 0 10px; color: #0F0F0F; border-left: 4px solid #D4FF4F; padding-left: 10px; text-transform: uppercase; letter-spacing: 0.3px; page-break-after: avoid; }
  p { margin-bottom: 10px; font-size: 10.5pt; }
  .parties-box { display: flex; gap: 0; margin: 20px 0 28px; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; page-break-inside: avoid; }
  .party { flex: 1; padding: 18px 22px; }
  .party:first-child { border-right: 1px solid #e0e0e0; background: #0F0F0F; color: #fff; }
  .party:last-child { background: #fafafa; }
  .party .party-label { font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.6; margin-bottom: 6px; }
  .party .party-name { font-size: 13pt; font-weight: 700; margin-bottom: 2px; }
  .party .party-role { font-size: 9pt; opacity: 0.7; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0 6px; font-size: 10pt; page-break-inside: avoid; }
  thead tr th { background: #0F0F0F; color: #fff; padding: 9px 14px; text-align: left; font-weight: 600; font-size: 9.5pt; }
  tbody tr td { padding: 9px 14px; border-bottom: 1px solid #ececec; vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:nth-child(even) td { background: #f9f9f9; }
  .highlight { background: #D4FF4F; color: #0F0F0F; padding: 2px 8px; border-radius: 3px; font-weight: 700; font-size: 10pt; display: inline-block; }
  .info-box { background: #f5f5f5; border-left: 4px solid #D4FF4F; padding: 14px 18px; margin: 12px 0; border-radius: 0 4px 4px 0; font-size: 10pt; page-break-inside: avoid; }
  ol { padding-left: 22px; margin: 8px 0; }
  ol li { margin-bottom: 8px; font-size: 10.5pt; page-break-inside: avoid; }
  ol li strong { color: #0F0F0F; }
  .signature-section { margin-top: 52px; padding-top: 28px; border-top: 2px solid #0F0F0F; display: flex; gap: 60px; page-break-inside: avoid; }
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
    <span>Reference: GG-SLA-${f.proposalVersion}</span>
    <span>Effective Date: ${f.effectiveDate}</span>
    <span>Proposal: ${f.proposalTitle}</span>
  </div>
</div>

<h1>Service Level Agreement</h1>
<p class="subtitle">This Service Level Agreement (&ldquo;Agreement&rdquo;) governs the media network services provided by GymGaze to ${f.partnerName} and sets out the obligations, performance standards, and commercial terms applicable to the partnership.</p>

<div class="parties-box">
  <div class="party">
    <div class="party-label">Service Provider</div>
    <div class="party-name">GymGaze (Pty) Ltd</div>
    <div class="party-role">Media Network Operator</div>
  </div>
  <div class="party">
    <div class="party-label">Partner</div>
    <div class="party-name">${f.partnerName}</div>
    <div class="party-role">Gym Network Partner</div>
  </div>
</div>

<h2>1. Definitions</h2>
<ol>
  <li><strong>&ldquo;Gross Ad Revenue&rdquo;</strong> means the total invoiced advertising revenue received by GymGaze from advertisers for campaigns displayed within Partner venues, before any deductions, commissions, or expenses.</li>
  <li><strong>&ldquo;Campaign&rdquo;</strong> means any advertising content scheduled to run on GymGaze screens or static media within Partner venues for a defined flight period.</li>
  <li><strong>&ldquo;Proof of Flight&rdquo;</strong> means a verified report confirming that a Campaign was delivered as scheduled, including play counts, duration, and time-of-day breakdown.</li>
  <li><strong>&ldquo;Dedicated Inventory&rdquo;</strong> means advertising slots reserved exclusively for Partner&rsquo;s own use or Partner-approved campaigns.</li>
  <li><strong>&ldquo;Uptime&rdquo;</strong> means the percentage of scheduled operating hours during which GymGaze screens are displaying content correctly.</li>
</ol>

<h2>2. Scope of Services</h2>
<p>GymGaze agrees to provide the following services across the <strong>${f.venueCount} venue(s)</strong> specified in this Agreement:</p>
<ol>
  <li>Operation, content management, and maintenance of digital advertising screens and/or static media across Partner venues.</li>
  <li>End-to-end campaign management including scheduling, delivery, monitoring, and post-campaign reporting.</li>
  <li>Provision of <strong>${f.dedicatedSlots} dedicated advertising slots of ${f.slotDuration} seconds each</strong> per loop cycle, reserved for Partner&rsquo;s own promotional use or Partner-approved advertisers.</li>
  <li>Monthly Gross Ad Revenue reporting and Partner revenue share payments in accordance with Section 5.</li>
  <li>A 24/7 monitoring service for screen uptime with automated alerts for any offline events.</li>
</ol>

<h2>3. Covered Venues</h2>
<p>This Agreement covers the following venues operated by ${f.partnerName}:</p>
<div class="info-box">
  <strong>${f.venuesList}</strong>
</div>
<p>Additional venues may be added to this Agreement by written addendum signed by both parties. Each addendum shall specify the venue name, location, and any venue-specific commercial terms.</p>

<h2>4. Service Standards &amp; Performance</h2>
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
      <td>${f.proofOfFlight} &mdash; delivered within 5 business days of campaign end</td>
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
      <td>${f.paymentCycle} following revenue statement delivery</td>
      <td>Per payment cycle</td>
    </tr>
    <tr>
      <td><strong>Data Sharing</strong></td>
      <td>${f.dataSharing}</td>
      <td>Monthly</td>
    </tr>
  </tbody>
</table>

<h2>5. Gross Ad Revenue Sharing</h2>
<p>All revenue sharing under this Agreement is calculated on <strong>Gross Ad Revenue</strong> &mdash; the total invoiced advertising revenue received by GymGaze for campaigns running within Partner venues, prior to any deductions.</p>
<table>
  <thead>
    <tr><th>Party</th><th>Revenue Share</th><th>Basis</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>${f.partnerName}</strong></td>
      <td><span class="highlight">${f.revenueSplitPartner}%</span></td>
      <td>Of Gross Ad Revenue from Partner venues, paid monthly</td>
    </tr>
    <tr>
      <td><strong>GymGaze</strong></td>
      <td><span class="highlight">${f.revenueSplitGymgaze}%</span></td>
      <td>Of Gross Ad Revenue from Partner venues</td>
    </tr>
  </tbody>
</table>

<div class="info-box">
  <strong>Grace Period:</strong> A grace period of <strong>${f.gracePeriod} month(s)</strong> applies from the date the first screen goes live in each venue. No revenue share is payable by GymGaze to the Partner during this period. The grace period allows for audience calibration, campaign pipeline development, and baseline data collection.
</div>

<div class="info-box" style="margin-top:12px;">
  <strong>Venue Rental Trigger:</strong> The Partner&rsquo;s <strong>${f.revenueSplitPartner}% Gross Ad Revenue share is payable from the first month following the grace period</strong>, regardless of occupancy level. In addition, once GymGaze reaches <strong>35% marketing slot occupancy</strong> across the Partner&rsquo;s venues, a monthly venue rental fee (as separately agreed in writing between both parties) shall become payable by GymGaze to the Partner. The venue rental is payable in addition to the ongoing ${f.revenueSplitPartner}% revenue share and does not replace it.
</div>

<p><strong>Widget &amp; Sponsorship Revenue</strong> is ${f.sponsorshipsExcluded}. This applies to branded widget sponsorships (news, sports, weather) which carry a fixed sponsorship fee structure separate from CPM-based ad campaigns.</p>

<p><strong>Minimum Guarantee:</strong> GymGaze does not provide a minimum monthly revenue guarantee unless separately agreed in writing. Revenue is performance-based and subject to advertiser demand, campaign fill rates, and seasonal variation.</p>

<div class="info-box" style="margin-top:12px;">
  <strong>Payment Timeline:</strong> Advertising agencies and direct clients are invoiced by GymGaze on standard <strong>45-day payment terms</strong>. As a result, Partner revenue share payments will reflect this cycle &mdash; the Partner&rsquo;s share for any given month will be paid within 10 business days of GymGaze receiving payment from the advertiser, which is typically <strong>45 days after the invoice issue date</strong>. GymGaze shall notify the Partner of any payment delays caused by late advertiser settlement.
</div>

<h2>6. Revenue Reporting &amp; Audit Rights</h2>
<ol>
  <li>GymGaze shall provide the Partner with a monthly Gross Ad Revenue statement for each venue, detailing total campaigns run, total revenue generated, and the Partner&rsquo;s calculated share.</li>
  <li>Statements shall be delivered to the Partner&rsquo;s nominated email address within 5 business days of month-end.</li>
  <li>The Partner has the right to request a revenue audit once per calendar year, with 14 days written notice. GymGaze shall provide reasonable access to campaign booking records and invoicing data for the period under audit.</li>
  <li>Any revenue discrepancy identified through audit must be resolved and any shortfall paid within 30 days of audit completion.</li>
  <li>GymGaze shall maintain accurate records of all campaign bookings and revenue for a minimum of 5 years.</li>
</ol>

<h2>7. Advertiser Standards &amp; Exclusions</h2>
<ol>
  <li>GymGaze shall ensure all advertising content complies with the Advertising Regulatory Board (ARB) Code of Advertising Practice applicable in South Africa.</li>
  <li>The Partner shall compile and submit a list of brands, advertisers, and categories to be excluded from campaigns running within their venues. GymGaze will implement all Partner-specified exclusions upon signing and within 5 business days of any subsequent written request.</li>
  <li>GymGaze retains the right to decline any campaign that conflicts with Partner&rsquo;s brand values, provided the Partner communicates such conflicts in writing.</li>
</ol>

<div style="margin: 20px 0; page-break-inside: avoid;">
  <p style="font-size:10pt; font-weight:700; margin-bottom:10px;">Partner-Specified Brand &amp; Advertiser Exclusions</p>
  <p style="font-size:9.5pt; color:#555; margin-bottom:14px;">The Partner may list below any specific brands, advertisers, or categories to be excluded from campaigns running within their venues. GymGaze will implement these exclusions upon signing.</p>
  <table style="width:100%; border-collapse:collapse; font-size:10pt;">
    <thead>
      <tr><th style="background:#0F0F0F;color:#fff;padding:8px 12px;text-align:left;font-size:9pt;">Brand / Advertiser / Category</th><th style="background:#0F0F0F;color:#fff;padding:8px 12px;text-align:left;font-size:9pt;">Reason (optional)</th></tr>
    </thead>
    <tbody>
      <tr><td style="padding:16px 12px;border-bottom:1px solid #ddd;">&nbsp;</td><td style="padding:16px 12px;border-bottom:1px solid #ddd;">&nbsp;</td></tr>
      <tr><td style="padding:16px 12px;border-bottom:1px solid #ddd;background:#fafafa;">&nbsp;</td><td style="padding:16px 12px;border-bottom:1px solid #ddd;background:#fafafa;">&nbsp;</td></tr>
      <tr><td style="padding:16px 12px;border-bottom:1px solid #ddd;">&nbsp;</td><td style="padding:16px 12px;border-bottom:1px solid #ddd;">&nbsp;</td></tr>
      <tr><td style="padding:16px 12px;border-bottom:1px solid #ddd;background:#fafafa;">&nbsp;</td><td style="padding:16px 12px;border-bottom:1px solid #ddd;background:#fafafa;">&nbsp;</td></tr>
      <tr><td style="padding:16px 12px;border-bottom:1px solid #ddd;">&nbsp;</td><td style="padding:16px 12px;border-bottom:1px solid #ddd;">&nbsp;</td></tr>
      <tr><td style="padding:16px 12px;border-bottom:1px solid #ddd;background:#fafafa;">&nbsp;</td><td style="padding:16px 12px;border-bottom:1px solid #ddd;background:#fafafa;">&nbsp;</td></tr>
      <tr><td style="padding:16px 12px;border-bottom:1px solid #ddd;">&nbsp;</td><td style="padding:16px 12px;border-bottom:1px solid #ddd;">&nbsp;</td></tr>
      <tr><td style="padding:16px 12px;border-bottom:1px solid #ddd;background:#fafafa;">&nbsp;</td><td style="padding:16px 12px;border-bottom:1px solid #ddd;background:#fafafa;">&nbsp;</td></tr>
      <tr><td style="padding:16px 12px;border-bottom:1px solid #ddd;">&nbsp;</td><td style="padding:16px 12px;border-bottom:1px solid #ddd;">&nbsp;</td></tr>
      <tr><td style="padding:16px 12px;border-bottom:1px solid #ddd;background:#fafafa;">&nbsp;</td><td style="padding:16px 12px;border-bottom:1px solid #ddd;background:#fafafa;">&nbsp;</td></tr>
    </tbody>
  </table>
  <p style="font-size:8.5pt;color:#999;margin-top:8px;">Additional exclusions may be submitted in writing at any time during the term of this Agreement.</p>
</div>

<h2>8. Dedicated Inventory</h2>
<ol>
  <li>GymGaze shall reserve <strong>${f.dedicatedSlots} slots of ${f.slotDuration} seconds each</strong> per loop cycle across Partner venues for the Partner&rsquo;s exclusive use.</li>
  <li>Dedicated slots unused by the Partner in any given week revert to GymGaze&rsquo;s general advertising inventory for that period. Unused slots do not accumulate or carry over.</li>
  <li>The Partner shall submit creative for dedicated slots in the correct format and dimensions specified by GymGaze&rsquo;s technical guidelines. GymGaze accepts no liability for display quality arising from incorrectly formatted creative.</li>
</ol>

<h2>9. GymGaze Obligations</h2>
<ol>
  <li>Maintain all media equipment in good operational order throughout the term of this Agreement.</li>
  <li>Carry adequate public liability insurance covering GymGaze operations within Partner venues.</li>
  <li>Ensure the Partner&rsquo;s brand, logo, and venue information is never used in external advertising or marketing without prior written consent.</li>
  <li>Notify the Partner of any planned maintenance that will result in screen downtime, with a minimum of 24 hours advance notice.</li>
  <li>Keep all Partner revenue and operational data strictly confidential and not share it with third parties without written consent, except as required by law.</li>
  <li>Provide the Partner with a dedicated account contact for operational queries, reachable during business hours (Monday&ndash;Friday, 08:00&ndash;17:00 SAST).</li>
</ol>

<h2>10. Partner Obligations</h2>
<ol>
  <li>Provide access to venues to allow GymGaze&rsquo;s appointed electrician to install dedicated electrical points (220V, minimum 10A) for GymGaze screens at agreed locations. GymGaze shall be responsible for all electrical installation costs and for providing and managing internet connectivity to its own screens.</li>
  <li>Notify GymGaze at least 14 days in advance of any venue renovation, closure, or change in operating hours that may affect GymGaze equipment or audience traffic.</li>
  <li>Grant GymGaze exclusive rights to sell and manage all in-venue advertising inventory within Partner venues for the duration of this Agreement. The Partner shall not independently sell, license, or grant advertising rights within Partner venues to any third party without prior written consent from GymGaze.</li>
  <li>Provide GymGaze with access to venues during business hours for maintenance and equipment checks, and outside business hours by prior arrangement for urgent repairs.</li>
  <li>Not reproduce, copy, or share GymGaze&rsquo;s campaign data, rate cards, or reporting with any third party without written consent.</li>
</ol>

<h2>11. Confidentiality</h2>
<p>Both parties agree to keep confidential all financial terms, revenue figures, campaign data, and operational information disclosed under this Agreement. This obligation survives termination for a period of 3 years. Neither party shall make public statements about the commercial terms of this Agreement without prior written consent from the other party.</p>

<h2>12. Intellectual Property</h2>
<p>All advertising creative, campaign materials, and content displayed on GymGaze screens remains the property of the respective advertiser or agency. GymGaze retains ownership of its platform, scheduling software, and reporting systems. The Partner retains ownership of its brand assets. Neither party acquires any IP rights of the other through this Agreement.</p>

<h2>13. Term &amp; Termination</h2>
<ol>
  <li>This Agreement commences on the Effective Date and continues for an initial term of <strong>24 months</strong>.</li>
  <li>Following the initial term, the Agreement renews automatically on a 12-month basis unless either party gives 60 days written notice of non-renewal before the renewal date.</li>
  <li>Either party may terminate this Agreement during the initial term with 90 days written notice if the other party commits a material breach that remains unremedied after 30 days written notice of the breach.</li>
  <li>GymGaze may suspend services immediately and terminate with 14 days notice if the Partner&rsquo;s venues cease operations, are sold, or transferred to new ownership without prior written notification to GymGaze.</li>
  <li>Upon termination for any reason, all outstanding revenue share payments due to the Partner shall be settled within 30 days of the effective termination date.</li>
</ol>

<h2>14. Dispute Resolution</h2>
<ol>
  <li>Both parties agree to attempt to resolve any dispute through good-faith negotiation within 20 business days of written notice of a dispute.</li>
  <li>If negotiation fails, the parties shall refer the dispute to mediation before a mutually agreed mediator in Johannesburg, Gauteng, within 30 days.</li>
  <li>If mediation fails, either party may refer the matter to the courts of the Republic of South Africa, Gauteng Division.</li>
</ol>

<h2>15. Governing Law</h2>
<p>This Agreement is governed by the laws of the Republic of South Africa. The parties consent to the non-exclusive jurisdiction of the High Court of South Africa, Gauteng Division, Johannesburg.</p>

<h2>16. General</h2>
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
    <div class="sig-party">For and on behalf of ${f.partnerName}</div>
    <div class="sig-line"></div>
    <div class="sig-label">Signature</div>
    <div class="sig-label" style="margin-top:12px;">Full Name: ___________________________</div>
    <div class="sig-label" style="margin-top:8px;">Title / Designation: __________________</div>
    <div class="sig-label" style="margin-top:8px;">Date: ________________________________</div>
  </div>
</div>

<div class="footer">
  GymGaze (Pty) Ltd &middot; Media Network Services &middot; gymgaze.io<br>
  This document is confidential and intended solely for ${f.partnerName}. Reference: GG-SLA-${f.proposalVersion} &middot; Effective ${f.effectiveDate}
</div>

</body>
</html>`;
}
