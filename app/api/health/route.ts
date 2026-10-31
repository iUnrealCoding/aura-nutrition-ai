import { NextResponse } from "next/server";
export const maxDuration = 15;
export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key)
    return NextResponse.json({ application: "ok", ai: "not_configured" });
  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        encodeURIComponent(model),
      {
        headers: { "x-goog-api-key": key },
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(10000),
      },
    );
    return NextResponse.json(
      {
        application: "ok",
        ai: r.ok
          ? "ready"
          : [400, 401, 403].includes(r.status)
            ? "credentials_rejected"
            : r.status === 404
              ? "model_unavailable"
              : "unavailable",
      },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch {
    return NextResponse.json({ application: "ok", ai: "unavailable" });
  }
}
