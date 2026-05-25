import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Generates the rate card PDF via Browserless.io.
 *
 * Flow:
 * 1. Build the absolute /rate-card-print URL with the user's params
 * 2. Forward the auth cookie so Browserless can render the protected page
 * 3. POST to Browserless /pdf with the URL + landscape A4 options
 * 4. Stream the PDF back to the browser as a download
 */
export async function GET(req: NextRequest) {
  const token = process.env.BROWSERLESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "missing_browserless_token", message: "Set BROWSERLESS_TOKEN in Vercel env vars" },
      { status: 500 }
    );
  }

  try {
    const sp = req.nextUrl.searchParams;
    const origin = req.nextUrl.origin;
    const filename = sp.get("filename") || "GymGaze-Rate-Card.pdf";

    // source=static-sites → render /static-sites-print instead of /rate-card-print
    const source = sp.get("source");
    const printRoute = source === "static-sites" ? "/static-sites-print" : "/rate-card-print";

    // Build the print page URL with all rate card params forwarded
    const printUrl = new URL(printRoute, origin);
    sp.forEach((value, key) => {
      if (key !== "filename" && key !== "source") printUrl.searchParams.set(key, value);
    });
    printUrl.searchParams.set("noAutoPrint", "1");

    // Forward the user's auth cookie via the request body's `cookies` array
    const cookieHeader = req.headers.get("cookie") ?? "";
    const cookies = cookieHeader
      ? cookieHeader.split(";").map(c => {
          const [name, ...rest] = c.trim().split("=");
          return {
            name,
            value: rest.join("="),
            domain: new URL(origin).hostname,
            path: "/",
            secure: true,
          };
        }).filter(c => c.name && c.value)
      : [];

    // Browserless PDF endpoint
    // Region: production-sfo (default — closest to most users)
    const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${token}`;

    const body = {
      url: printUrl.toString(),
      cookies,
      gotoOptions: {
        waitUntil: "networkidle2",
        timeout: 45000,
      },
      // Wait for the print pages to render before capturing
      waitForSelector: {
        selector: '[data-print-page="true"]',
        timeout: 20000,
      },
      // Force print media so our @media print rules apply
      emulateMediaType: "print",
      options: {
        // Use our CSS @page rule (297mm x 210mm A4 landscape)
        preferCSSPageSize: true,
        printBackground: true,
        // Fallback dimensions if CSS @page is ignored — explicit landscape A4
        width: "297mm",
        height: "210mm",
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
        // Force colors (dark backgrounds, lime accents)
        displayHeaderFooter: false,
        // Tag PDF (smaller, more compatible)
        tagged: true,
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
      console.error("[rate-card-pdf] Browserless error:", browserlessRes.status, errText);
      return NextResponse.json(
        {
          error: "browserless_failed",
          status: browserlessRes.status,
          message: errText.slice(0, 500),
        },
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
    console.error("[rate-card-pdf] error:", err);
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: "pdf_render_failed", message }, { status: 500 });
  }
}
