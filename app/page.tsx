import Link from "next/link";
import { getItems } from "@/lib/storage";
import { availableBracketSizes } from "@/lib/tournament";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const items = await getItems();
  const sizes = availableBracketSizes(items.length);

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1 className="title">최악고르기 월드컵</h1>
          <div className="subtitle">토너먼트로 가장 별로인 사람을 가려봅시다</div>
        </div>
        <nav className="nav-links">
          <Link className="btn ghost" href="/admin">관리자</Link>
        </nav>
      </header>

      <section className="panel">
        <div className="row between">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>총 후보 수</div>
            <div className="muted" style={{ fontSize: 13 }}>등록된 항목 기준</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{items.length}명</div>
        </div>

        {sizes.length === 0 ? (
          <div className="empty">
            <p>후보가 2명 이상이어야 시작할 수 있습니다.</p>
            <Link className="btn primary" href="/admin">관리자로 항목 추가</Link>
          </div>
        ) : (
          <>
            <div style={{ marginTop: 16, fontWeight: 700 }}>강 선택</div>
            <div className="muted" style={{ fontSize: 13 }}>
              후보 수에 따라 자동으로 가능한 강이 표시됩니다.
            </div>
            <div className="size-grid">
              {sizes.map((s) => (
                <Link key={s} href={`/play?size=${s}`} className="size-btn">
                  {s === 2 ? "결승" : s === 4 ? "4강" : `${s}강`}
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
