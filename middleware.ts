import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function middleware(req: NextRequest) {
  if (
    req.nextUrl.pathname.startsWith("/api/") &&
    !["GET", "HEAD", "OPTIONS"].includes(req.method)
  ) {
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin)
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 },
      );
  }
  let res = NextResponse.next({ request: req });
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(
          items: { name: string; value: string; options?: CookieOptions }[],
        ) {
          items.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          items.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await db.auth.getUser();
  if (
    !user &&
    ["/dashboard", "/coach", "/settings"].some(
      (p) =>
        req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p + "/"),
    )
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    const redirect = NextResponse.redirect(url);
    res.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/coach/:path*",
    "/settings/:path*",
    "/api/:path*",
    "/auth/:path*",
    "/reset-password",
  ],
};
