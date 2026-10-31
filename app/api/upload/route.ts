import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
export async function POST(req: Request) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    file.size > 5_242_880 ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    return NextResponse.json(
      { error: "Invalid image (max 5 MB)" },
      { status: 400 },
    );
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[
    file.type
  ];
  const path = user.id + "/" + randomUUID() + "." + ext;
  const { error } = await db.storage
    .from("food-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  return NextResponse.json(error ? { error: error.message } : { path }, {
    status: error ? 400 : 201,
  });
}
