import { localDate, type Food } from "./models";
export type WeightLog = { created_at: string; raw_weight_lbs: number };
export function weightEma(logs: WeightLog[], alpha = 0.1) {
  const byDay = new Map<string, WeightLog>();
  for (const l of [...logs].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  ))
    byDay.set(localDate(l.created_at), l);
  return [...byDay.values()].reduce<
    { date: string; raw: number; ema: number }[]
  >((acc, l) => {
    const prev = acc.at(-1)?.ema ?? Number(l.raw_weight_lbs);
    acc.push({
      date: l.created_at,
      raw: Number(l.raw_weight_lbs),
      ema: alpha * Number(l.raw_weight_lbs) + (1 - alpha) * prev,
    });
    return acc;
  }, []);
}
export function estimateTdee(
  caloriesPerDay: number,
  firstWeight: number,
  lastWeight: number,
  days: number,
) {
  if (
    days < 7 ||
    ![caloriesPerDay, firstWeight, lastWeight, days].every(Number.isFinite)
  )
    return null;
  return Math.max(
    0,
    caloriesPerDay + ((firstWeight - lastWeight) * 3500) / days,
  );
}
export function stallReview(phase: string, weights: number[]) {
  if (phase !== "Cut" || weights.length < 4) return false;
  const recent = weights.slice(-4);
  return Math.max(...recent) - Math.min(...recent) < 0.3;
}
export function nutritionTrend(
  logs: WeightLog[],
  food: Food[],
  completeDays: string[],
) {
  const points = weightEma(logs);
  const end = points.at(-1);
  if (!end) return { points, tdee: null, coverage: 0 };
  const start = [...points]
    .reverse()
    .find((p) => Date.parse(end.date) - Date.parse(p.date) >= 14 * 86400000);
  if (!start) return { points, tdee: null, coverage: 0 };
  const a = new Date(localDate(start.date) + "T12:00:00"),
    b = new Date(localDate(end.date) + "T12:00:00");
  const days: string[] = [];
  for (const d = new Date(a); d < b; d.setDate(d.getDate() + 1))
    days.push(localDate(d));
  const coverage =
    days.filter((d) => completeDays.includes(d)).length / days.length;
  // Only explicitly complete days count; no silent assumption that missing meals are zero.
  const total = food
    .filter((f) => days.includes(localDate(f.created_at)))
    .reduce((s, f) => s + Number(f.calories), 0);
  const tdee =
    coverage === 1
      ? estimateTdee(total / days.length, start.ema, end.ema, days.length)
      : null;
  return { points, tdee, coverage, days: days.length };
}
