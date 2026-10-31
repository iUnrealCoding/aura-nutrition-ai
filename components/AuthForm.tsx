"use client";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
export default function AuthForm({
  mode,
}: {
  mode: "sign-in" | "sign-up" | "recover";
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const db = createClient();
      const result =
        mode === "recover"
          ? await db.auth.resetPasswordForEmail(email, {
              redirectTo:
                location.origin + "/auth/callback?next=/reset-password",
            })
          : mode === "sign-up"
            ? await db.auth.signUp({
                email,
                password,
                options: {
                  emailRedirectTo: location.origin + "/auth/callback",
                },
              })
            : await db.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (
        mode === "sign-in" ||
        ("data" in result &&
          result.data &&
          "session" in result.data &&
          result.data.session)
      ) {
        router.push("/dashboard");
        router.refresh();
      } else
        setMessage(
          "Check your email for the next step. Open the link in this browser.",
        );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-wrap">
      <form onSubmit={submit} className="panel">
        <div>
          <span className="eyebrow">Your personal workspace</span>
          <h1 style={{ marginTop: 12 }}>
            {mode === "recover"
              ? "Find your way back."
              : mode === "sign-up"
                ? "Start your next chapter."
                : "Welcome back."}
          </h1>
          <p className="muted" style={{ marginTop: 12 }}>
            {mode === "recover"
              ? "We’ll send you a password reset link."
              : mode === "sign-up"
                ? "Build a clearer picture of your nutrition."
                : "Your progress is right where you left it."}
          </p>
        </div>
        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        {mode !== "recover" && (
          <label>
            Password
            <input
              type="password"
              minLength={8}
              required
              autoComplete={
                mode === "sign-up" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
        )}
        <button disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "sign-in"
              ? "Sign in"
              : mode === "sign-up"
                ? "Create account"
                : "Send reset link"}
          <ArrowRight size={16} />
        </button>
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        <div className="auth-links">
          <Link href={mode === "sign-in" ? "/sign-up" : "/sign-in"}>
            {mode === "sign-in" ? "Create an account" : "Back to sign in"}
          </Link>
          <Link href="/recover">Forgot password?</Link>
        </div>
      </form>
    </main>
  );
}
