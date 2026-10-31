import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next =
    url.searchParams.get("next") === "/reset-password"
      ? "/reset-password"
      : "/dashboard";
  if (code) {
    const db = await createClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(
    new URL("/sign-in?error=confirmation", url.origin),
  );
}
