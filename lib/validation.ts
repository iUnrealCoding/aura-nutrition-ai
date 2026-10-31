import { z } from "zod";
import { nutrientKeys } from "./models";
const timestamp = z
  .string()
  .datetime({ offset: true })
  .refine(
    (x) => Date.parse(x) <= Date.now() + 300000,
    "Date cannot be in the future",
  );
const nutrients = Object.fromEntries(
  nutrientKeys.map((k) => [
    k,
    z.number().finite().min(0).max(1000000).optional(),
  ]),
);
export const foodSchema = z
  .object({
    food_name: z.string().trim().min(1).max(200),
    meal_category: z.enum([
      "Breakfast",
      "Lunch",
      "Dinner",
      "Snack",
      "IntraWorkout",
    ]),
    calories: z.number().finite().min(0).max(10000),
    protein_g: z.number().finite().min(0).max(2000),
    carbs_g: z.number().finite().min(0).max(2000),
    fats_g: z.number().finite().min(0).max(2000),
    created_at: timestamp.optional(),
    image_url: z.string().max(300).nullable().optional(),
    ...nutrients,
  })
  .strict();
export const scaleSchema = z
  .object({
    raw_weight_lbs: z.number().finite().min(50).max(1000),
    created_at: timestamp.optional(),
  })
  .strict();
export const profileSchema = z
  .object({
    phase: z.enum(["Cut", "Bulking", "Recomp", "ContestPrep"]),
    target_calories: z.number().finite().min(0).max(10000),
    target_protein_g: z.number().finite().min(0).max(2000),
    target_carbs_g: z.number().finite().min(0).max(2000),
    target_fats_g: z.number().finite().min(0).max(2000),
  })
  .strict();
export const idSchema = z.string().uuid();
