import { NextRequest, NextResponse } from "next/server";
import { isAdminPassword, setAdminCookie, clearAdminCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!isAdminPassword(password)) {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }
  setAdminCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearAdminCookie();
  return NextResponse.json({ ok: true });
}
