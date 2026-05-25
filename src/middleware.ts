import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolvePermissions, type RolePreset, type NavSlug } from "@/lib/permissions";

// Roles that belong on the admin side (vs portal-side owner/manager)
const ADMIN_SIDE_ROLES = ["admin", "sales", "viewer", "custom"];
const PORTAL_SIDE_ROLES = ["owner", "manager"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;

  // Skip auth checks if Supabase env vars not configured yet
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Not authenticated → login (only for protected routes)
  if (!user && (pathname.startsWith("/admin") || pathname.startsWith("/portal"))) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (user) {
    // Use service role client to bypass RLS
    const serviceClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("role, permissions")
      .eq("id", user.id)
      .single();

    const role = (profile?.role ?? "admin") as RolePreset;
    const perms = (profile?.permissions ?? null) as NavSlug[] | null;

    // ── Admin-side routes ────────────────────────────────────────────
    if (pathname.startsWith("/admin")) {
      // Portal-side roles (owner/manager) don't belong in admin
      if (profile?.role && PORTAL_SIDE_ROLES.includes(profile.role)) {
        return NextResponse.redirect(new URL("/portal/dashboard", request.url));
      }

      // Per-page permission enforcement
      // Extract slug from /admin/<slug>...
      const match = pathname.match(/^\/admin\/([^/?]+)/);
      if (match) {
        const slug = match[1] as NavSlug;
        const allowedSlugs = resolvePermissions(role, perms);
        if (!allowedSlugs.includes(slug)) {
          // Redirect to their first allowed page (always at least dashboard for safety)
          const fallback = allowedSlugs[0] ?? "dashboard";
          return NextResponse.redirect(new URL(`/admin/${fallback}`, request.url));
        }
      }
    }

    // ── Portal-side routes ───────────────────────────────────────────
    if (pathname.startsWith("/portal")) {
      // Admin-side roles (admin/sales/viewer/custom) don't belong in the portal
      if (profile?.role && ADMIN_SIDE_ROLES.includes(profile.role)) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
  ],
};
