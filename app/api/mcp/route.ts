import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json(
    {
      name: "AURA MCP",
      status: "not configured",
      message:
        "OAuth authorization and token validation are required before enabling remote MCP tools.",
    },
    { status: 503 },
  );
}
export async function POST() {
  return NextResponse.json(
    {
      error:
        "MCP disabled until OAuth authorization is implemented and security reviewed",
    },
    { status: 503 },
  );
}
