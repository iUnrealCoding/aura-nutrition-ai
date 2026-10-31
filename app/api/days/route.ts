import { authenticated } from "@/lib/auth";
import { NextResponse as R } from "next/server";
import { z } from "zod";
export async function GET() {
  const { db, user } = await authenticated();
  if (!user) return R.json({ error: "Please sign in" }, { status: 401 });
  const { data, error } = await db
    .from("complete_days")
    .select("day")
    .eq("user_id", user.id)
    .order("day", { ascending: false })
    .limit(400);
  return R.json(
    error
      ? { error: "Could not load completed days" }
      : { data: data.map((x) => x.day) },
    { status: error ? 500 : 200 },
  );
}
export async function POST(req: Request) {
  const { db, user } = await authenticated();
  if (!user) return R.json({ error: "Please sign in" }, { status: 401 });
  const p = z
    .object({ day: z.string().date(), complete: z.boolean() })
    .safeParse(await req.json().catch(() => null));
  if (!p.success) return R.json({ error: "Invalid date" }, { status: 400 });
  const { error } = p.data.complete
    ? await db
        .from("complete_days")
        .upsert({ user_id: user.id, day: p.data.day })
    : await db
        .from("complete_days")
        .delete()
        .eq("user_id", user.id)
        .eq("day", p.data.day);
  return R.json(error ? { error: "Could not update day" } : { saved: true }, {
    status: error ? 500 : 200,
  });
}
