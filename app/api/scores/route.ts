import { NextRequest, NextResponse } from "next/server";
import { getItems, getScores, recordResult } from "@/lib/storage";

export const dynamic = "force-dynamic";

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export async function GET() {
  try {
    const [items, scores] = await Promise.all([getItems(), getScores()]);
    return NextResponse.json({ items, scores });
  } catch (e) {
    console.error("GET /api/scores failed:", e);
    return NextResponse.json({ error: errMessage(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const championId =
    typeof body?.championId === "string" ? body.championId : "";
  const matchWins =
    body?.matchWins && typeof body.matchWins === "object"
      ? (body.matchWins as Record<string, number>)
      : {};

  try {
    const items = await getItems();
    const validIds = new Set(items.map((i) => i.id));
    const cleaned: Record<string, number> = {};
    for (const [id, count] of Object.entries(matchWins)) {
      if (!validIds.has(id)) continue;
      const n = Number(count);
      if (!Number.isFinite(n) || n <= 0) continue;
      cleaned[id] = Math.floor(n);
    }
    const champ = validIds.has(championId) ? championId : "";
    const scores = await recordResult(cleaned, champ);
    return NextResponse.json({ items, scores });
  } catch (e) {
    console.error("POST /api/scores failed:", e);
    return NextResponse.json({ error: errMessage(e) }, { status: 500 });
  }
}
