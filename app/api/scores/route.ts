import { NextRequest, NextResponse } from "next/server";
import { getItems, getStats, recordResult } from "@/lib/storage";

export const dynamic = "force-dynamic";

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export async function GET() {
  try {
    const [items, stats] = await Promise.all([getItems(), getStats()]);
    return NextResponse.json({
      items,
      scores: stats.scores,
      tournaments: stats.tournaments,
    });
  } catch (e) {
    console.error("GET /api/scores failed:", e);
    return NextResponse.json({ error: errMessage(e) }, { status: 500 });
  }
}

function cleanCountMap(
  raw: unknown,
  validIds: Set<string>
): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [id, count] of Object.entries(raw as Record<string, unknown>)) {
    if (!validIds.has(id)) continue;
    const n = Number(count);
    if (!Number.isFinite(n) || n <= 0) continue;
    out[id] = Math.floor(n);
  }
  return out;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const championId =
    typeof body?.championId === "string" ? body.championId : "";

  try {
    const items = await getItems();
    const validIds = new Set(items.map((i) => i.id));
    const cleanedWins = cleanCountMap(body?.matchWins, validIds);
    const cleanedAppearances = cleanCountMap(body?.matchAppearances, validIds);
    const champ = validIds.has(championId) ? championId : "";
    const stats = await recordResult(cleanedWins, cleanedAppearances, champ);
    return NextResponse.json({
      items,
      scores: stats.scores,
      tournaments: stats.tournaments,
    });
  } catch (e) {
    console.error("POST /api/scores failed:", e);
    return NextResponse.json({ error: errMessage(e) }, { status: 500 });
  }
}
