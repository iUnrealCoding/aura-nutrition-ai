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
    file.size > 4_194_304 ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    return NextResponse.json(
      { error: "Invalid image (max 4 MB)" },
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

export async function GET(req: Request) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const path = new URL(req.url).searchParams.get("path");
  if (!path || !path.startsWith(user.id + "/") || path.includes(".."))
    return NextResponse.json({ error: "Invalid image path" }, { status: 400 });
  const { data, error } = await db.storage
    .from("food-images")
    .createSignedUrl(path, 60);
  if (error)
    return NextResponse.json({ error: "Image unavailable" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
