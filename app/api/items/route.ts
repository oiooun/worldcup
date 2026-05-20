import { NextRequest, NextResponse } from "next/server";
import { addItem, deleteItem, getItems, updateItem } from "@/lib/storage";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getItems();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  const item = await addItem(text);
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!id || !text) {
    return NextResponse.json({ error: "id and text required" }, { status: 400 });
  }
  const item = await updateItem(id, text);
  if (!item) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ item });
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthed()) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const ok = await deleteItem(id);
  if (!ok) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
