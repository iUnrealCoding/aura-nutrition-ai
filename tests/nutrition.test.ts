import { describe, it, expect } from "vitest";
import { weightEma, estimateTdee, stallReview } from "../lib/nutrition";
describe("nutrition engine", () => {
  it("sorts logs chronologically and smooths", () => {
    const p = weightEma([
      { created_at: "2026-01-02", raw_weight_lbs: 190 },
      { created_at: "2026-01-01", raw_weight_lbs: 200 },
    ]);
    expect(p[0].ema).toBe(200);
    expect(p[1].ema).toBe(199);
  });
  it("rejects short TDEE windows", () =>
    expect(estimateTdee(2500, 200, 198, 3)).toBeNull());
  it("flags stable cut weights for review", () =>
    expect(stallReview("Cut", [200, 200.1, 200.1, 200])).toBe(true));
});

import { nutritionTrend } from "../lib/nutrition";
import type { Food } from "../lib/models";
describe("aligned energy estimate", () => {
  const logs = [
    { created_at: "2026-01-01T12:00:00Z", raw_weight_lbs: 200 },
    { created_at: "2026-01-15T12:00:00Z", raw_weight_lbs: 200 },
  ];
  const dates = Array.from(
    { length: 14 },
    (_, i) => `2026-01-${String(i + 1).padStart(2, "0")}`,
  );
  const meals = dates.map((d, i) => ({
    id: String(i),
    created_at: d + "T12:00:00Z",
    food_name: "Day total",
    meal_category: "Lunch",
    calories: 2400,
    protein_g: 180,
    carbs_g: 240,
    fats_g: 80,
  })) as Food[];
  it("uses matching complete-day intake and weight windows", () =>
    expect(nutritionTrend(logs, meals, dates).tdee).toBe(2400));
  it("does not treat incomplete days as zero intake", () =>
    expect(nutritionTrend(logs, meals, dates.slice(1)).tdee).toBeNull());
  it("ignores intake outside the weight window", () =>
    expect(
      nutritionTrend(
        logs,
        [
          ...meals,
          { ...meals[0], created_at: "2026-01-20T12:00:00Z", calories: 10000 },
        ],
        dates,
      ).tdee,
    ).toBe(2400));
  it("requires a two-week observation window", () =>
    expect(nutritionTrend(logs.slice(1), meals, dates).tdee).toBeNull());
  it("uses only the final weigh-in for a calendar day", () =>
    expect(
      weightEma([
        { created_at: "2026-01-01T09:00:00Z", raw_weight_lbs: 190 },
        { created_at: "2026-01-01T12:00:00Z", raw_weight_lbs: 200 },
      ]),
    ).toHaveLength(1));
});
