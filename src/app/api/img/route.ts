import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Image resize proxy.
 *
 * Usage:  /api/img?url=<source-url>&w=800&q=75
 *
 * - Only accepts URLs from our own Supabase storage (security)
 * - Returns JPEG (smaller than PNG/WebP, universal support)
 * - Cached aggressively at the edge (1 year, immutable per URL+params)
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const url = sp.get("url");
  const width = Math.min(parseInt(sp.get("w") ?? "800"), 2000);
  const quality = Math.min(Math.max(parseInt(sp.get("q") ?? "75"), 30), 95);

  if (!url) return NextResponse.json({ error: "missing_url" }, { status: 400 });

  // Whitelist: only allow our Supabase storage URLs
  const allowedHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://wegqfhqopkrrofsuoufz.supabase.co").host;
  let src: URL;
  try {
    src = new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }
  if (src.host !== allowedHost) {
    return NextResponse.json({ error: "host_not_allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(src.toString());
    if (!upstream.ok) {
      return NextResponse.json({ error: "upstream_failed", status: upstream.status }, { status: 502 });
    }
    const buffer = Buffer.from(await upstream.arrayBuffer());

    const resized = await sharp(buffer)
      .rotate() // honour EXIF orientation
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality, progressive: true, mozjpeg: true })
      .toBuffer();

    return new NextResponse(resized as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[img] error:", message);
    return NextResponse.json({ error: "resize_failed", message }, { status: 500 });
  }
}
