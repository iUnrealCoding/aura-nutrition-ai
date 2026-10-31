"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Utensils,
  Plus,
  Pencil,
  Trash2,
  Copy,
  ArrowUpRight,
  Check,
  Scale as ScaleIcon,
} from "lucide-react";
import FoodLogModal from "./FoodLogModal";
import TrendChart from "./TrendChart";
import {
  api,
  json,
  localDate,
  localTime,
  macros,
  nutrientKeys,
  type Food,
  type Scale,
  type Profile,
} from "@/lib/models";
import { nutritionTrend } from "@/lib/nutrition";
export default function Dashboard({ profile }: { profile: Profile }) {
  const [food, setFood] = useState<Food[]>([]),
    [scale, setScale] = useState<Scale[]>([]),
    [days, setDays] = useState<string[]>([]),
    [date, setDate] = useState(localDate()),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [edit, setEdit] = useState<Food>(),
    [weight, setWeight] = useState(""),
    [weightDate, setWeightDate] = useState(localTime()),
    [weightId, setWeightId] = useState<string>(),
    [showWeights, setShowWeights] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setError("");
      const from = new Date();
      from.setDate(from.getDate() - 365);
      async function all<T>(path: string) {
        let rows: T[] = [];
        for (let offset = 0; ; offset += 500) {
          const out = await api<{ data: T[]; hasMore: boolean }>(
            path +
              "?from=" +
              encodeURIComponent(from.toISOString()) +
              "&offset=" +
              offset,
          );
          rows = rows.concat(out.data);
          if (!out.hasMore) break;
        }
        return rows;
      }
      const [f, s, d] = await Promise.all([
        all<Food>("/api/food"),
        all<Scale>("/api/scale"),
        api<{ data: string[] }>("/api/days"),
      ]);
      setFood(f);
      setScale(s);
      setDays(d.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const daily = food.filter((f) => localDate(f.created_at) === date);
  const sum = (k: keyof Food) =>
    daily.reduce((n, f) => n + Number(f[k] || 0), 0);
  const trend = nutritionTrend(scale, food, days);
  const latest = trend.points.at(-1);
  const prior = trend.points.at(-8);
  const change = latest && prior ? latest.ema - prior.ema : null;
  async function action(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveWeight(e: React.FormEvent) {
    e.preventDefault();
    await action(async () => {
      await api(
        "/api/scale" + (weightId ? "?id=" + weightId : ""),
        json(weightId ? "PATCH" : "POST", {
          raw_weight_lbs: Number(weight),
          created_at: new Date(weightDate).toISOString(),
        }),
      );
      setWeight("");
      setWeightId(undefined);
    });
  }
  function remove(kind: string, id: string) {
    if (confirm("Delete this entry? This cannot be undone."))
      void action(() =>
        api("/api/" + kind + "?id=" + id, { method: "DELETE" }),
      );
  }
  function copy(f: Food) {
    const { id, created_at, ...rest } = f;
    void id;
    void created_at;
    const body = Object.fromEntries(
      Object.entries(rest).filter(([k]) =>
        [
          "food_name",
          "meal_category",
          "image_url",
          ...macros,
          ...nutrientKeys,
        ].includes(k),
      ),
    );
    void action(() =>
      api(
        "/api/food",
        json("POST", { ...body, created_at: new Date().toISOString() }),
      ),
    );
  }
  const metricColors = ["#b6a0ff", "#a5dfc0", "#e4c18b", "#9abce9"];
  return (
    <main className="stack">
      <div className="page-heading" style={{ marginBottom: 4 }}>
        <div>
          <span className="eyebrow">Your daily perspective</span>
          <h1 style={{ marginTop: 9 }}>Nutrition overview</h1>
          <p className="muted">
            Small, consistent choices. A stronger understanding of you.
          </p>
        </div>
        <div className="row">
          <span className="chip">{profile.phase}</span>
          <FoodLogModal onSaved={() => void refresh()} />
        </div>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}{" "}
          <button className="ghost" onClick={() => void refresh()}>
            Retry
          </button>
        </div>
      )}
      <div className="between">
        <div className="row">
          <span className="eyebrow" style={{ color: "#a3a6b5" }}>
            Daily intake
          </span>
          <input
            className="date-input"
            aria-label="Selected date"
            type="date"
            max={localDate()}
            min={localDate(new Date(Date.now() - 364 * 86400000))}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Link href="/settings" className="muted" style={{ fontSize: 11 }}>
          Adjust targets ↗
        </Link>
      </div>
      <div className="metrics">
        {macros.map((k, i) => {
          const target =
              profile[
                (
                  [
                    "target_calories",
                    "target_protein_g",
                    "target_carbs_g",
                    "target_fats_g",
                  ] as const
                )[i]
              ],
            value = sum(k),
            pct = target ? Math.min(100, (value / target) * 100) : 0;
          return (
            <section className="panel metric" key={k}>
              <div className="between">
                <span className="muted" style={{ fontSize: 12 }}>
                  {["Energy", "Protein", "Carbohydrates", "Fat"][i]}
                </span>
                <span style={{ color: metricColors[i], fontSize: 12 }}>
                  {Math.round(target ? (value / target) * 100 : 0)}%
                </span>
              </div>
              <div className="metric-number">
                {loading ? "—" : Math.round(value).toLocaleString()}{" "}
                <small>{i ? "g" : "kcal"}</small>
              </div>
              <p className="muted" style={{ fontSize: 11 }}>
                of {target.toLocaleString()} {i ? "g" : "kcal"} daily target
              </p>
              <div className="progress">
                <div
                  style={{ width: pct + "%", background: metricColors[i] }}
                />
              </div>
            </section>
          );
        })}
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="between section-title">
            <div>
              <h2>Your food diary</h2>
              <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                {daily.length} entries ·{" "}
                {new Date(date + "T12:00").toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Utensils size={18} color="#b6a0ff" />
          </div>
          {loading ? (
            <p className="muted">Loading meals…</p>
          ) : daily.length ? (
            daily.map((f) => (
              <div className="meal-row" key={f.id}>
                <div className="meal-icon">
                  <Utensils size={16} />
                </div>
                <div>
                  <h3>{f.food_name}</h3>
                  <small>
                    {f.meal_category} · P {Math.round(f.protein_g)} / C{" "}
                    {Math.round(f.carbs_g)} / F {Math.round(f.fats_g)}
                  </small>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>{Math.round(f.calories)}</strong>
                  <br />
                  <small>kcal</small>
                </div>
                <div className="meal-actions">
                  <button
                    className="icon-button"
                    title="Repeat meal today"
                    aria-label={"Repeat " + f.food_name + " today"}
                    disabled={busy}
                    onClick={() => copy(f)}
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={"Edit " + f.food_name}
                    onClick={() => setEdit(f)}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={"Delete " + f.food_name}
                    disabled={busy}
                    onClick={() => remove("food", f.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">
              <Utensils color="#666076" size={28} />
              <h3>A fresh page for your day</h3>
              <p className="muted">
                Add your first meal to start building the picture.
              </p>
            </div>
          )}
          <label
            className="check-row"
            style={{ paddingTop: 20, borderTop: "1px solid var(--line)" }}
          >
            <input
              type="checkbox"
              checked={days.includes(date)}
              disabled={busy || loading}
              onChange={(e) =>
                void action(() =>
                  api(
                    "/api/days",
                    json("POST", { day: date, complete: e.target.checked }),
                  ),
                )
              }
            />
            <span>I’ve logged everything I ate on this day</span>
            <Check size={14} color="#a5dfc0" />
          </label>
          <p className="muted" style={{ fontSize: 10, marginTop: 8 }}>
            Complete days help make your energy estimate meaningful.
          </p>
        </section>
        <section className="panel">
          <div className="between section-title">
            <h2>Weight & trend</h2>
            <ScaleIcon size={18} color="#b6a0ff" />
          </div>
          <div className="between">
            <div className="weight-stat">
              {latest ? latest.raw.toFixed(1) : "—"} <small>lb</small>
            </div>
            {change !== null && (
              <span className="chip">
                {change > 0 ? "+" : ""}
                {change.toFixed(1)} lb trend
              </span>
            )}
          </div>
          <p className="muted" style={{ fontSize: 11 }}>
            {latest
              ? "Latest weigh-in · " +
                new Date(latest.date).toLocaleDateString()
              : "Your first weigh-in starts the trend"}
          </p>
          <TrendChart points={trend.points} />
          <form
            className="stack"
            style={{ gap: 10, marginTop: 20 }}
            onSubmit={saveWeight}
          >
            <div className="form-grid">
              <label>
                Weight (lb)
                <input
                  type="number"
                  min="50"
                  max="1000"
                  step="0.1"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 180.5"
                />
              </label>
              <label>
                When
                <input
                  type="datetime-local"
                  required
                  value={weightDate}
                  onChange={(e) => setWeightDate(e.target.value)}
                />
              </label>
            </div>
            <button className="secondary" disabled={busy}>
              <Plus size={14} />
              {weightId ? "Update weigh-in" : "Log weigh-in"}
            </button>
            {weightId && (
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setWeightId(undefined);
                  setWeight("");
                }}
              >
                Cancel edit
              </button>
            )}
          </form>
          <button
            className="ghost"
            style={{ width: "100%", marginTop: 12 }}
            onClick={() => setShowWeights(!showWeights)}
          >
            {showWeights ? "Hide" : "Manage"} weigh-ins
          </button>
          {showWeights && (
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              {scale.map((s) => (
                <div
                  className="between"
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                  key={s.id}
                >
                  <small>
                    {new Date(s.created_at).toLocaleDateString()} ·{" "}
                    {s.raw_weight_lbs} lb
                  </small>
                  <div className="row">
                    <button
                      className="ghost"
                      aria-label="Edit weigh-in"
                      onClick={() => {
                        setWeightId(s.id);
                        setWeight(String(s.raw_weight_lbs));
                        setWeightDate(localTime(s.created_at));
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      className="ghost danger"
                      aria-label="Delete weigh-in"
                      disabled={busy}
                      onClick={() => remove("scale", s.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="between">
            <div>
              <span className="eyebrow">Adaptive insight</span>
              <h2 style={{ marginTop: 8 }}>Your energy expenditure</h2>
            </div>
            <span style={{ fontSize: 28, fontWeight: 600, color: "#b6a0ff" }}>
              {trend.tdee ? Math.round(trend.tdee).toLocaleString() : "—"}{" "}
              <small style={{ fontSize: 11, color: "#979bad" }}>kcal/day</small>
            </span>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 15 }}>
            {trend.tdee
              ? "An estimate from your logged intake and smoothed weight change. It is not a measured metabolic rate; use it as a trend, not a prescription."
              : "Needs weigh-ins at least 14 days apart and every intervening day marked fully logged. Missing meals are never silently counted as zero."}
          </p>
        </section>
        <Link
          href="/coach"
          className="panel"
          style={{ background: "linear-gradient(130deg,#272036,#15161d)" }}
        >
          <div className="between">
            <span className="eyebrow">AURA coach</span>
            <ArrowUpRight size={19} />
          </div>
          <h2 style={{ margin: "12px 0 8px" }}>Make sense of the numbers.</h2>
          <p className="muted" style={{ fontSize: 12 }}>
            Talk through your intake, progress, or next meal with your personal
            nutrition assistant.
          </p>
        </Link>
      </div>
      <details className="panel">
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          Micronutrients & additional totals{" "}
          <span className="muted" style={{ fontWeight: 400, fontSize: 11 }}>
            {" "}
            · {date}
          </span>
        </summary>
        <p className="muted" style={{ fontSize: 11, marginTop: 12 }}>
          Totals reflect entered values only. A zero may mean the nutrient
          wasn’t recorded.
        </p>
        <div className="micro-grid" style={{ marginTop: 15 }}>
          {nutrientKeys.map((n) => (
            <div className="micro-item" key={n}>
              <span className="muted">{n.replaceAll("_", " ")}</span>
              <strong>{sum(n).toFixed(1)}</strong>
            </div>
          ))}
        </div>
      </details>
      {edit && (
        <FoodLogModal
          key={edit.id}
          initial={edit}
          onClose={() => setEdit(undefined)}
          onSaved={() => void refresh()}
        />
      )}
    </main>
  );
}
