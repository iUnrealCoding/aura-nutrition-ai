import { authenticated } from "@/lib/auth";
import { NextResponse as R } from "next/server";
export async function GET() {
  const { db, user } = await authenticated();
  if (!user) return R.json({ error: "Please sign in" }, { status: 401 });
  const output: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
  };
  for (const table of [
    "profiles",
    "food_logs",
    "scale_logs",
    "coach_chats",
    "complete_days",
  ]) {
    let rows: unknown[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db
        .from(table)
        .select(
          table === "profiles"
            ? "id,phase,target_calories,target_protein_g,target_carbs_g,target_fats_g"
            : "*",
        )
        .eq(table === "profiles" ? "id" : "user_id", user.id)
        .range(offset, offset + 999);
      if (error)
        return R.json(
          { error: "Export failed; please retry" },
          { status: 500 },
        );
      rows = rows.concat(data);
      if (data.length < 1000) break;
    }
    output[table] = rows;
  }
  return R.json(output, {
    headers: {
      "Content-Disposition": 'attachment; filename="aura-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
