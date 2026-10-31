"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
export default function Reset() {
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords must match.");
      return;
    }
    setBusy(true);
    try {
      const db = createClient();
      const {
        data: { user },
      } = await db.auth.getUser();
      if (!user)
        throw Error("Open the reset link from your email, or sign in first.");
      const { error } = await db.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. You can return to your dashboard.");
      setPassword("");
      setConfirm("");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-wrap">
      <form className="panel" onSubmit={submit}>
        <h1>Set a new password</h1>
        <label>
          New password
          <input
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        <button disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <Link className="muted" href="/dashboard">
          Back to dashboard
        </Link>
      </form>
    </main>
  );
}
