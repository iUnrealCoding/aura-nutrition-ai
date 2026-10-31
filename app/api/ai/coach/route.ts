import { authenticated } from "@/lib/auth";
import { gemini } from "@/lib/ai";
import { NextResponse as R } from "next/server";
import { z } from "zod";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET() {
  const { db, user } = await authenticated();
  if (!user) return R.json({ error: "Please sign in" }, { status: 401 });
  const { data, error } = await db
    .from("coach_chats")
    .select("id,role,content,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  return R.json(
    error
      ? { error: "Could not load conversation" }
      : { data: data.reverse(), configured: !!process.env.GEMINI_API_KEY },
    { status: error ? 500 : 200 },
  );
}
export async function DELETE() {
  const { db, user } = await authenticated();
  if (!user) return R.json({ error: "Please sign in" }, { status: 401 });
  const { error } = await db
    .from("coach_chats")
    .delete()
    .eq("user_id", user.id);
  return R.json(
    error ? { error: "Could not clear conversation" } : { deleted: true },
    { status: error ? 500 : 200 },
  );
}
export async function POST(req: Request) {
  const { db, user } = await authenticated();
  if (!user) return R.json({ error: "Please sign in" }, { status: 401 });
  const p = z
    .object({ message: z.string().trim().min(1).max(4000) })
    .safeParse(await req.json().catch(() => null));
  if (!p.success)
    return R.json(
      { error: "Enter a message up to 4,000 characters" },
      { status: 400 },
    );
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    return R.json(
      {
        error:
          "AI coaching is not configured yet. Your food and weight tracking still work.",
      },
      { status: 503 },
    );
  const { data: allowed, error: limitError } =
    await db.rpc("consume_ai_request");
  if (limitError)
    return R.json(
      { error: "Could not verify AI usage. Please try again." },
      { status: 503 },
    );
  if (!allowed)
    return R.json(
      { error: "Hourly AI limit reached. Please try again later." },
      { status: 429 },
    );
  const [profile, food, scale, history] = await Promise.all([
    db
      .from("profiles")
      .select(
        "phase,target_calories,target_protein_g,target_carbs_g,target_fats_g",
      )
      .eq("id", user.id)
      .single(),
    db
      .from("food_logs")
      .select("food_name,calories,protein_g,carbs_g,fats_g,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("scale_logs")
      .select("created_at,raw_weight_lbs")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    db
      .from("coach_chats")
      .select("role,content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if ([profile, food, scale, history].some((x) => x.error))
    return R.json(
      { error: "Could not load your context. Please try again." },
      { status: 503 },
    );
  try {
    const context = JSON.stringify({
      profile: profile.data,
      recentMeals: food.data,
      recentWeights: scale.data,
    });
    const chat = gemini(key).startChat({
      history: [
        {
          role: "user",
          parts: [
            { text: "My logged context, which may be incomplete: " + context },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "I will use these records as context and explain uncertainty.",
            },
          ],
        },
        ...(history.data ?? [])
          .reverse()
          .map((x) => ({
            role: x.role === "assistant" ? "model" : "user",
            parts: [{ text: x.content }],
          })),
      ],
    });
    const result = await chat.sendMessageStream(p.data.message);
    let answer = "";
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (v: unknown) =>
          controller.enqueue(
            new TextEncoder().encode(JSON.stringify(v) + "\n"),
          );
        try {
          for await (const part of result.stream) {
            const text = part.text();
            answer += text;
            emit({ text });
          }
          if (!answer.trim()) throw Error("Empty response");
          const { error } = await db.from("coach_chats").insert([
            { user_id: user.id, role: "user", content: p.data.message },
            {
              user_id: user.id,
              role: "assistant",
              content: answer.slice(0, 20000),
              created_at: new Date(Date.now() + 1).toISOString(),
            },
          ]);
          if (error)
            emit({
              error:
                "Reply received, but conversation could not be saved. Please refresh before continuing.",
            });
          else emit({ done: true });
          controller.close();
        } catch {
          emit({ error: "The response was interrupted. Please try again." });
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "content-type": "application/x-ndjson",
        "cache-control": "no-store",
      },
    });
  } catch {
    return R.json(
      {
        error:
          "AI is temporarily unavailable. Check the configured model and API key, then retry.",
      },
      { status: 502 },
    );
  }
}
