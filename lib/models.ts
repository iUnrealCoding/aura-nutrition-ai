export const nutrientKeys = [
  "fiber_g",
  "sugar_g",
  "sodium_mg",
  "potassium_mg",
  "magnesium_mg",
  "calcium_mg",
  "iron_mg",
  "zinc_mg",
  "vitamin_a_rae_mcg",
  "vitamin_c_mg",
  "vitamin_d_iu",
  "vitamin_e_mg",
  "vitamin_k_mcg",
  "vitamin_b1_mg",
  "vitamin_b2_mg",
  "vitamin_b3_mg",
  "vitamin_b5_mg",
  "vitamin_b6_mg",
  "vitamin_b7_mcg",
  "vitamin_b9_mcg",
  "vitamin_b12_mcg",
  "cholesterol_mg",
  "saturated_fat_g",
] as const;
export const macros = ["calories", "protein_g", "carbs_g", "fats_g"] as const;
export type Food = {
  id: string;
  food_name: string;
  meal_category: string;
  created_at: string;
  image_url?: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
} & Partial<Record<(typeof nutrientKeys)[number], number>>;
export type Scale = { id: string; created_at: string; raw_weight_lbs: number };
export type Profile = {
  phase: string;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fats_g: number;
};
export function localDate(d: Date | string = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}
export function localTime(d: Date | string = new Date()) {
  const x = new Date(d);
  return `${localDate(x)}T${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
}
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const r = await fetch(url, options);
  const data = await r.json();
  if (!r.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
export const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
