import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated — redirect to login (only for protected routes)
  if (!user && (pathname.startsWith("/admin") || pathname.startsWith("/portal"))) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Authenticated — check role
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Protect admin routes
    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/portal/dashboard", request.url));
    }

    // Protect portal routes — admins go to admin dashboard
    if (pathname.startsWith("/portal") && role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  // Only run middleware on protected routes — NOT on /auth/* to avoid redirect loops
  matcher: [
    "/admin/:path*",
    "/portal/:path*",
  ],
};
