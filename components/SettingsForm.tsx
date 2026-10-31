"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, Check, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { api, json, type Profile } from "@/lib/models";
export default function SettingsForm({ initial }: { initial: Profile }) {
  const [data, setData] = useState(initial),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await api("/api/profile", json("PATCH", data));
      setStatus("Your targets are saved.");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.push("/sign-in");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <main>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Make it yours</span>
          <h1 style={{ marginTop: 10 }}>Goals & settings</h1>
          <p className="muted">
            Set your direction. Keep control of your data.
          </p>
        </div>
      </div>
      <div className="settings-grid">
        <form onSubmit={save} className="panel stack">
          <div className="between">
            <h2>Nutrition targets</h2>
            <SlidersHorizontal size={18} color="#b6a0ff" />
          </div>
          <label>
            Current phase
            <select
              value={data.phase}
              onChange={(e) => setData({ ...data, phase: e.target.value })}
            >
              {["Cut", "Bulking", "Recomp", "ContestPrep"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            {(
              [
                "target_calories",
                "target_protein_g",
                "target_carbs_g",
                "target_fats_g",
              ] as const
            ).map((k, i) => (
              <label key={k}>
                {
                  [
                    "Energy (kcal)",
                    "Protein (g)",
                    "Carbohydrates (g)",
                    "Fat (g)",
                  ][i]
                }
                <input
                  type="number"
                  min="0"
                  max={i ? 2000 : 10000}
                  step="1"
                  required
                  value={data[k]}
                  onChange={(e) =>
                    setData({ ...data, [k]: Number(e.target.value) })
                  }
                />
              </label>
            ))}
          </div>
          <p className="notice">
            Your macros provide approximately{" "}
            {Math.round(
              data.target_protein_g * 4 +
                data.target_carbs_g * 4 +
                data.target_fats_g * 9,
            ).toLocaleString()}{" "}
            kcal. Use targets suited to your circumstances; AURA never changes
            them automatically.
          </p>
          <button disabled={busy}>
            {busy ? "Saving…" : "Save targets"}
            <Check size={15} />
          </button>
          {status && (
            <p role="status" style={{ color: "#b8eccd" }}>
              {status}
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
        <div className="stack" style={{ alignContent: "start" }}>
          <section className="panel stack">
            <h2>Your data belongs to you</h2>
            <p className="muted">
              Download your profile, food diary, weigh-ins, and saved coaching
              history as JSON.
            </p>
            <a href="/api/export" className="button secondary">
              <Download size={15} />
              Export my data
            </a>
            <p className="muted" style={{ fontSize: 11 }}>
              Food photos are kept in private storage. AI features send your
              chosen photo or relevant records to Google Gemini only when you
              request them.
            </p>
          </section>
          <section className="panel stack">
            <h2>Account</h2>
            <a className="button secondary" href="/reset-password">
              Change password
            </a>
            <button className="ghost" disabled={busy} onClick={signOut}>
              <LogOut size={14} />
              Sign out
            </button>
          </section>
          <section className="panel">
            <h2>About your estimates</h2>
            <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
              Nutrition estimates and energy expenditure are approximate.
              Accurate logging and consistent weigh-ins improve their
              usefulness. For medical or competition-specific decisions, consult
              a qualified professional.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
