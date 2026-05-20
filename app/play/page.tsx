import Link from "next/link";
import { getItems } from "@/lib/storage";
import { isAdminAuthed } from "@/lib/auth";
import PlayClient from "./PlayClient";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const items = await getItems();
  const isAdmin = isAdminAuthed();

  if (items.length < 2) {
    return (
      <main className="container">
        <header className="header">
          <h1 className="title">
            <span className="title-emoji">👎</span>
            최악고르기 월드컵
          </h1>
          <Link className="btn ghost" href="/"><span className="arrow-back">←</span>처음으로</Link>
        </header>
        <div className="panel empty">
          <p>후보가 2명 이상이어야 시작할 수 있습니다.</p>
          <Link className="btn primary" href="/admin">관리자로 이동</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1 className="title">
            <span className="title-emoji">👎</span>
            최악고르기 월드컵
          </h1>
          <div className="subtitle">더 별로인 쪽을 선택하세요</div>
        </div>
        <Link className="btn ghost" href="/"><span className="arrow-back">←</span>처음으로</Link>
      </header>
      <PlayClient items={items} isAdmin={isAdmin} />
    </main>
  );
}
