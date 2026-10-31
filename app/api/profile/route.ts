import { authenticated } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";
import { NextResponse as R } from "next/server";
export async function PATCH(req: Request) {
  const { db, user } = await authenticated();
  if (!user) return R.json({ error: "Please sign in" }, { status: 401 });
  const p = profileSchema.safeParse(await req.json().catch(() => null));
  if (!p.success)
    return R.json({ error: "Enter valid nutrition targets" }, { status: 400 });
  const { error } = await db
    .from("profiles")
    .upsert({ ...p.data, id: user.id });
  return R.json(error ? { error: "Could not save targets" } : { saved: true }, {
    status: error ? 500 : 200,
  });
}
