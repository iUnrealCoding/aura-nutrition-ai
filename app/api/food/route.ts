import { authenticated } from "@/lib/auth";
import { foodSchema, idSchema } from "@/lib/validation";
import { NextResponse as R } from "next/server";
export async function GET(req: Request) {
  const { db, user } = await authenticated();
  if (!user) return R.json({ error: "Please sign in" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const offset = Number(q.get("offset") || 0);
  if (!Number.isInteger(offset) || offset < 0 || offset > 100000)
    return R.json({ error: "Invalid page" }, { status: 400 });
  let query = db
    .from("food_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  const from = q.get("from"),
    to = q.get("to");
  if (
    (from && !Number.isFinite(Date.parse(from))) ||
    (to && !Number.isFinite(Date.parse(to)))
  )
    return R.json({ error: "Invalid date range" }, { status: 400 });
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lt("created_at", to);
  const { data, error } = await query.range(offset, offset + 499);
  return R.json(
    error
      ? { error: "Could not load entries" }
      : { data, hasMore: data.length === 500 },
    { status: error ? 500 : 200 },
  );
}
async function write(req: Request, update = false) {
  const { db, user } = await authenticated();
  if (!user) return R.json({ error: "Please sign in" }, { status: 401 });
  const parsed = foodSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return R.json(
      { error: parsed.error.issues[0]?.message || "Invalid entry" },
      { status: 400 },
    );
  if (parsed.data.image_url && !parsed.data.image_url.startsWith(user.id + "/"))
    return R.json({ error: "Invalid image path" }, { status: 400 });
  let query;
  if (update) {
    const id = new URL(req.url).searchParams.get("id");
    if (!idSchema.safeParse(id).success)
      return R.json({ error: "Invalid ID" }, { status: 400 });
    query = db
      .from("food_logs")
      .update(parsed.data)
      .eq("id", id!)
      .eq("user_id", user.id);
  } else
    query = db.from("food_logs").insert({ ...parsed.data, user_id: user.id });
  const { data, error } = await query.select().single();
  return R.json(error ? { error: "Could not save entry" } : { data }, {
    status: error ? 400 : update ? 200 : 201,
  });
}
export async function POST(req: Request) {
  return write(req);
}
export async function PATCH(req: Request) {
  return write(req, true);
}
export async function DELETE(req: Request) {
  const { db, user } = await authenticated();
  if (!user) return R.json({ error: "Please sign in" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!idSchema.safeParse(id).success)
    return R.json({ error: "Invalid ID" }, { status: 400 });
  const { data, error } = await db
    .from("food_logs")
    .delete()
    .eq("id", id!)
    .eq("user_id", user.id)
    .select("id");
  return R.json(
    error ? { error: "Could not delete entry" } : { deleted: data.length },
    { status: error ? 500 : 200 },
  );
}
