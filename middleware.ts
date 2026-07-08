import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  // Guard the auth call: if Supabase is slow or unreachable, don't let the
  // middleware hang until Vercel kills it (MIDDLEWARE_INVOCATION_TIMEOUT).
  // On timeout/error, treat the request as unauthenticated so protected routes
  // redirect cleanly instead of 504-ing every route.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("supabase.auth.getUser timed out")), 3000)
    );
    const result = await Promise.race([supabase.auth.getUser(), timeout]);
    user = result.data.user;
  } catch (err) {
    console.error("[middleware] auth check failed, treating as unauthenticated:", err);
  }

  const { pathname } = request.nextUrl;

  const publicPaths = ["/", "/auth/callback", "/invite", "/mockup", "/memory"];
  const isPublic =
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/auth");

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
