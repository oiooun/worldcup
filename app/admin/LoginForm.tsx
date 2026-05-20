"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("비밀번호가 올바르지 않습니다.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <section className="panel" style={{ maxWidth: 420, margin: "0 auto" }}>
      <form onSubmit={submit}>
        <div className="field">
          <label>관리자 비밀번호</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            autoFocus
          />
        </div>
        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "확인 중..." : "로그인"}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    </section>
  );
}
