import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const pathname = request.nextUrl.pathname;

  // Not authenticated — redirect to login
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

    // Protect portal routes
    if (pathname.startsWith("/portal")) {
      if (!role || role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }

    // Redirect logged-in users away from login page
    if (pathname === "/auth/login") {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (role === "owner") {
        return NextResponse.redirect(new URL("/portal/dashboard", request.url));
      } else if (role === "manager") {
        return NextResponse.redirect(new URL("/portal/manager", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
