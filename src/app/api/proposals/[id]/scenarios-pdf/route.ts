import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Generates the occupancy scenarios PDF via Browserless.io.
 *
 * Flow:
 * 1. Build the absolute /proposal-scenarios-print/[id] URL
 * 2. Forward the auth cookie so Browserless can render the protected page
 * 3. POST to Browserless /pdf with landscape A4 options
 * 4. Stream the PDF back as a download
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = process.env.BROWSERLESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error: "missing_browserless_token",
        message: "Set BROWSERLESS_TOKEN in Vercel env vars",
      },
      { status: 500 }
    );
  }

  try {
    const origin = req.nextUrl.origin;
    const filename =
      req.nextUrl.searchParams.get("filename") ||
      `GymGaze-Occupancy-Scenarios-${id}.pdf`;

    const printUrl = new URL(`/proposal-scenarios-print/${id}`, origin);
    printUrl.searchParams.set("noAutoPrint", "1");

    // Forward the user's auth cookie
    const cookieHeader = req.headers.get("cookie") ?? "";
    const cookies = cookieHeader
      ? cookieHeader
          .split(";")
          .map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return {
              name,
              value: rest.join("="),
              domain: new URL(origin).hostname,
              path: "/",
              secure: true,
            };
          })
          .filter((c) => c.name && c.value)
      : [];

    const browserlessUrl = `https://production-sfo.browserless.io/pdf?token=${token}`;

    const body = {
      url: printUrl.toString(),
      cookies,
      gotoOptions: {
        waitUntil: "networkidle2",
        timeout: 45000,
      },
      waitForSelector: {
        selector: '[data-print-page="true"]',
        timeout: 20000,
      },
      emulateMediaType: "print",
      options: {
        preferCSSPageSize: true,
        printBackground: true,
        width: "297mm",
        height: "210mm",
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
        displayHeaderFooter: false,
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
      console.error(
        "[scenarios-pdf] Browserless error:",
        browserlessRes.status,
        errText
      );
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
    console.error("[scenarios-pdf] error:", err);
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "pdf_render_failed", message },
      { status: 500 }
    );
  }
}
