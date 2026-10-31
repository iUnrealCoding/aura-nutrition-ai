import { describe, it, expect } from "vitest";
import { foodSchema, scaleSchema, profileSchema } from "../lib/validation";
const meal = {
  food_name: "Rice",
  meal_category: "Lunch",
  calories: 200,
  protein_g: 4,
  carbs_g: 44,
  fats_g: 1,
};
describe("write validation", () => {
  it("accepts valid macros and micronutrients", () =>
    expect(foodSchema.safeParse({ ...meal, fiber_g: 3 }).success).toBe(true));
  it("rejects unknown fields and ownership injection", () =>
    expect(
      foodSchema.safeParse({ ...meal, user_id: "someone-else" }).success,
    ).toBe(false));
  it("rejects negative micronutrients", () =>
    expect(foodSchema.safeParse({ ...meal, iron_mg: -4 }).success).toBe(false));
  it("rejects non-finite values", () =>
    expect(foodSchema.safeParse({ ...meal, calories: Infinity }).success).toBe(
      false,
    ));
  it("rejects future timestamps", () =>
    expect(
      foodSchema.safeParse({ ...meal, created_at: "2099-01-01T00:00:00Z" })
        .success,
    ).toBe(false));
  it("rejects invalid weights", () =>
    expect(scaleSchema.safeParse({ raw_weight_lbs: 0 }).success).toBe(false));
  it("allows zero targets but rejects invalid phases", () => {
    expect(
      profileSchema.safeParse({
        phase: "Cut",
        target_calories: 0,
        target_protein_g: 0,
        target_carbs_g: 0,
        target_fats_g: 0,
      }).success,
    ).toBe(true);
    expect(profileSchema.safeParse({ phase: "Unknown" }).success).toBe(false);
  });
});
