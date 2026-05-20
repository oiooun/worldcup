import { NextRequest, NextResponse } from "next/server";
import { addItem, deleteItem, getItems, updateItem } from "@/lib/storage";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export async function GET() {
  try {
    const items = await getItems();
    return NextResponse.json({ items });
  } catch (e) {
    console.error("GET /api/items failed:", e);
    return NextResponse.json({ error: errMessage(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "내용을 입력하세요." }, { status: 400 });
  }
  try {
    const item = await addItem(text);
    return NextResponse.json({ item });
  } catch (e) {
    console.error("POST /api/items failed:", e);
    return NextResponse.json({ error: errMessage(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!id || !text) {
    return NextResponse.json({ error: "id와 내용이 필요합니다." }, { status: 400 });
  }
  try {
    const item = await updateItem(id, text);
    if (!item) {
      return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (e) {
    console.error("PUT /api/items failed:", e);
    return NextResponse.json({ error: errMessage(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "관리자 로그인이 필요합니다." }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }
  try {
    const ok = await deleteItem(id);
    if (!ok) {
      return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/items failed:", e);
    return NextResponse.json({ error: errMessage(e) }, { status: 500 });
  }
}
