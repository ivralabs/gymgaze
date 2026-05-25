import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Local dev: use system Chrome if available; on Vercel: use @sparticuz/chromium
async function getBrowser() {
  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    return puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote",
      ],
      defaultViewport: { width: 1200, height: 800 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  // Local dev — try common Chrome paths
  const localChromePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    process.env.PUPPETEER_EXECUTABLE_PATH,
  ].filter(Boolean) as string[];

  return puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1400, height: 900 },
    executablePath: localChromePaths[0],
    headless: true,
  });
}

export async function GET(req: NextRequest) {
  let browser: Awaited<ReturnType<typeof getBrowser>> | null = null;
  try {
    const sp = req.nextUrl.searchParams;

    // Construct the absolute URL to the print page on the same deployment
    const origin = req.nextUrl.origin;
    const printUrl = new URL("/rate-card-print", origin);
    // Forward all params
    sp.forEach((value, key) => {
      if (key !== "filename") printUrl.searchParams.set(key, value);
    });
    // Disable the auto-print behaviour for the headless render
    printUrl.searchParams.set("noAutoPrint", "1");

    // Forward auth cookie so the middleware-protected route accepts our request
    const cookieHeader = req.headers.get("cookie") ?? "";

    browser = await getBrowser();
    const page = await browser.newPage();

    if (cookieHeader) {
      // Parse cookie header into puppeteer cookie array for the target origin
      const url = new URL(origin);
      const cookies = cookieHeader.split(";").map(c => {
        const [name, ...rest] = c.trim().split("=");
        return {
          name,
          value: rest.join("="),
          domain: url.hostname,
          path: "/",
        };
      }).filter(c => c.name);
      await page.setCookie(...cookies);
    }

    await page.setViewport({ width: 1200, height: 800 });

    // Force print media BEFORE navigation so the right CSS applies on first paint
    await page.emulateMediaType("print");

    await page.goto(printUrl.toString(), { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for the actual print pages to be in the DOM
    try {
      await page.waitForSelector('[data-print-page="true"]', { timeout: 12000 });
    } catch {
      // continue anyway
    }

    // Give images a moment to settle
    await new Promise(r => setTimeout(r, 2000));

    const pdf = await page.pdf({
      width: "297mm",
      height: "210mm",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: false,
    });

    const filename = sp.get("filename") || "GymGaze-Rate-Card.pdf";

    return new NextResponse(pdf as unknown as BodyInit, {
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
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}
