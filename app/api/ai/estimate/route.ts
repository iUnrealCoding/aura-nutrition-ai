import { authenticated } from "@/lib/auth";
import { gemini } from "@/lib/ai";
import { NextResponse as R } from "next/server";
import { z } from "zod";
export const maxDuration = 60;
export async function POST(req: Request) {
  const { db, user } = await authenticated();
  if (!user) return R.json({ error: "Please sign in" }, { status: 401 });
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    return R.json(
      {
        error: "AI estimation is not configured yet. Enter nutrition manually.",
      },
      { status: 503 },
    );
  const form = await req.formData();
  const text = String(form.get("description") || "").slice(0, 2000);
  const file = form.get("file");
  if (!text && !(file instanceof File))
    return R.json(
      { error: "Describe your meal or add a photo" },
      { status: 400 },
    );
  const parts: (
    { text: string } | { inlineData: { data: string; mimeType: string } }
  )[] = [
    {
      text:
        "Estimate the total nutrition for this meal. Return ONLY JSON with food_name (string), calories, protein_g, carbs_g, fats_g (numbers), and notes (string explaining portion assumptions). Never imply precise measurement. Description: " +
        text,
    },
  ];
  if (file instanceof File) {
    if (
      file.size > 4 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      return R.json(
        { error: "Choose a JPG, PNG or WebP under 4 MB" },
        { status: 400 },
      );
    parts.push({
      inlineData: {
        data: Buffer.from(await file.arrayBuffer()).toString("base64"),
        mimeType: file.type,
      },
    });
  }
  const { data: allowed, error } = await db.rpc("consume_ai_request");
  if (error || !allowed)
    return R.json(
      { error: "AI request limit reached or unavailable. Try again later." },
      { status: 429 },
    );
  try {
    const result = await gemini(key).generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
      },
    });
    const schema = z.object({
      food_name: z.string().min(1).max(200),
      calories: z.number().min(0).max(10000),
      protein_g: z.number().min(0).max(2000),
      carbs_g: z.number().min(0).max(2000),
      fats_g: z.number().min(0).max(2000),
      notes: z.string().max(2000),
    });
    const data = schema.parse(JSON.parse(result.response.text()));
    return R.json({ data });
  } catch {
    return R.json(
      {
        error:
          "Could not estimate this meal. Try a clearer description or enter values manually.",
      },
      { status: 502 },
    );
  }
}
