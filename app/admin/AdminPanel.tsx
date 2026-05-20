"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Item } from "@/lib/storage";

type Props = { initialItems: Item[] };

export default function AdminPanel({ initialItems }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function readError(res: Response, fallback: string): Promise<string> {
    try {
      const data = (await res.json()) as { error?: string };
      return data?.error || fallback;
    } catch {
      return fallback;
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) {
        setError(await readError(res, "추가에 실패했습니다."));
        return;
      }
      const { item } = (await res.json()) as { item: Item };
      setItems((cur) => [...cur, item]);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("정말 삭제할까요?")) return;
    setError(null);
    const res = await fetch(`/api/items?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setError(await readError(res, "삭제에 실패했습니다."));
      return;
    }
    setItems((cur) => cur.filter((i) => i.id !== id));
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditingText(item.text);
  }

  async function saveEdit() {
    if (!editingId) return;
    const trimmed = editingText.trim();
    if (!trimmed) return;
    setError(null);
    const res = await fetch("/api/items", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: editingId, text: trimmed }),
    });
    if (!res.ok) {
      setError(await readError(res, "수정에 실패했습니다."));
      return;
    }
    const { item } = (await res.json()) as { item: Item };
    setItems((cur) => cur.map((i) => (i.id === item.id ? item : i)));
    setEditingId(null);
    setEditingText("");
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section className="panel">
        <div className="row between" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>새 후보 추가</div>
          <button className="btn ghost" onClick={logout}>로그아웃</button>
        </div>
        <form onSubmit={add}>
          <div className="field">
            <textarea
              className="textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="예: 회의 시간에 항상 지각하면서 변명만 하는 사람"
            />
          </div>
          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? "추가 중..." : "추가"}
          </button>
          {error && <div className="error">{error}</div>}
        </form>
      </section>

      <section className="panel">
        <div className="row between">
          <div style={{ fontWeight: 700 }}>등록된 후보 ({items.length})</div>
        </div>
        {items.length === 0 ? (
          <div className="empty">아직 등록된 후보가 없습니다.</div>
        ) : (
          <div className="list">
            {items.map((item) => (
              <div className="list-item" key={item.id}>
                {editingId === item.id ? (
                  <>
                    <textarea
                      className="textarea"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      autoFocus
                    />
                    <button className="btn primary" onClick={saveEdit}>저장</button>
                    <button className="btn ghost" onClick={() => setEditingId(null)}>취소</button>
                  </>
                ) : (
                  <>
                    <div className="text">{item.text}</div>
                    <button className="btn" onClick={() => startEdit(item)}>수정</button>
                    <button className="btn danger" onClick={() => remove(item.id)}>삭제</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
