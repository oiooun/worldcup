import Link from "next/link";
import { getItems, getStats } from "@/lib/storage";
import { isAdminAuthed } from "@/lib/auth";
import { nextPowerOfTwo } from "@/lib/tournament";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const isAdmin = isAdminAuthed();
  let items: Awaited<ReturnType<typeof getItems>> = [];
  let tournaments = 0;
  let storageError: string | null = null;
  try {
    if (isAdmin) {
      const [it, stats] = await Promise.all([getItems(), getStats()]);
      items = it;
      tournaments = stats.tournaments;
    } else {
      items = await getItems();
    }
  } catch (e) {
    storageError = e instanceof Error ? e.message : String(e);
  }

  const canStart = items.length >= 2;
  const bracket = nextPowerOfTwo(items.length);
  const byes = Math.max(0, bracket - items.length);

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1 className="title">
            <span className="title-emoji">👎</span>
            최악고르기 월드컵
          </h1>
          <div className="subtitle">토너먼트로 가장 별로인 사람을 가려봅시다</div>
        </div>
        <nav className="nav-links">
          <Link className="btn ghost" href="/admin">관리자</Link>
        </nav>
      </header>

      {storageError && (
        <section className="panel" style={{ marginBottom: 16, borderColor: "#fca5a5" }}>
          <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 6 }}>
            ⚠ 스토리지 연결 오류
          </div>
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
            {storageError}
          </div>
        </section>
      )}

      <section className="hero">
        <div className="hero-stat">
          <div className="hero-label">등록된 후보</div>
          <div className="hero-num">{items.length}<span className="unit">명</span></div>
        </div>

        {canStart ? (
          <div className="hero-actions">
            <div className="badge-row">
              <span className="badge accent">{bracket}강 토너먼트</span>
              {byes > 0 && (
                <span className="badge muted-badge">
                  {byes}명 부전승
                </span>
              )}
              {isAdmin && tournaments > 0 && (
                <span className="badge muted-badge">
                  지금까지 {tournaments}번 진행됨
                </span>
              )}
            </div>
            <Link className="btn primary xl" href="/play">
              월드컵 시작하기 →
            </Link>
            <div className="muted center" style={{ fontSize: 13 }}>
              총 {items.length - 1}경기로 최악의 한 명이 결정됩니다
            </div>
          </div>
        ) : (
          <div className="hero-actions">
            <div className="muted center">
              {items.length === 0
                ? "아직 등록된 후보가 없습니다."
                : "후보가 2명 이상이어야 시작할 수 있습니다."}
            </div>
            <Link className="btn primary xl" href="/admin">
              관리자로 후보 추가 →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
