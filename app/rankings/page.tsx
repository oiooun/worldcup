import Link from "next/link";
import { getItems, getStats, type Item, type Scores } from "@/lib/storage";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatRate(numer: number, denom: number): string {
  if (!denom || denom <= 0) return "—";
  const pct = Math.min(100, Math.round((numer / denom) * 100));
  return `${pct}%`;
}

export default async function RankingsPage() {
  const isAdmin = isAdminAuthed();
  let items: Item[] = [];
  let scores: Scores = {};
  let tournaments = 0;
  let storageError: string | null = null;
  try {
    const [it, stats] = await Promise.all([getItems(), getStats()]);
    items = it;
    scores = stats.scores;
    tournaments = stats.tournaments;
  } catch (e) {
    storageError = e instanceof Error ? e.message : String(e);
  }

  const ranked = items
    .map((item) => {
      const s = scores[item.id] ?? { wins: 0, championships: 0, appearances: 0 };
      return {
        item,
        wins: s.wins,
        championships: s.championships,
        appearances: s.appearances,
      };
    })
    .filter((r) => r.wins > 0 || r.championships > 0)
    .sort((a, b) => {
      if (b.championships !== a.championships)
        return b.championships - a.championships;
      return b.wins - a.wins;
    });
  const maxWins = ranked[0]?.wins ?? 1;

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1 className="title">
            <span className="title-emoji">📊</span>
            친구들의 순위
          </h1>
          <div className="subtitle">
            모든 사용자가 진행한 토너먼트 결과 합산
          </div>
        </div>
        <Link className="btn ghost" href="/"><span className="arrow-back">←</span>처음으로</Link>
      </header>

      {storageError && (
        <section
          className="panel"
          style={{ marginBottom: 16, borderColor: "#fca5a5" }}
        >
          <div
            style={{ fontWeight: 700, color: "#b91c1c", marginBottom: 6 }}
          >
            ⚠ 스토리지 연결 오류
          </div>
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
            {storageError}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="row between" style={{ marginBottom: 4 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>누적 순위</div>
            <div className="muted" style={{ fontSize: 13 }}>
              🏆 우승 횟수 · 우승비율 &nbsp;|&nbsp; ⚔ 매치 승리/출전 · 승률
            </div>
          </div>
          {isAdmin && tournaments > 0 && (
            <div className="tourney-counter">
              <span className="tourney-counter-num">{tournaments}</span>
              <span className="tourney-counter-label">번째 진행</span>
            </div>
          )}
        </div>

        {ranked.length === 0 ? (
          <div className="empty">
            <p>아직 집계된 결과가 없습니다.</p>
            <Link className="btn primary" href="/play">월드컵 시작하기 →</Link>
          </div>
        ) : (
          <ol className="rank-list">
            {ranked.map((r, idx) => {
              const champRate = formatRate(r.championships, tournaments);
              const winRate = formatRate(r.wins, r.appearances);
              return (
                <li key={r.item.id} className="rank-item">
                  <div className={`rank-num rank-${idx + 1}`}>
                    {idx === 0
                      ? "🥇"
                      : idx === 1
                      ? "🥈"
                      : idx === 2
                      ? "🥉"
                      : idx + 1}
                  </div>
                  <div className="rank-body">
                    <div className="rank-text">{r.item.text}</div>
                    <div className="rank-bar">
                      <div
                        className="rank-bar-fill"
                        style={{
                          width: `${Math.max(
                            4,
                            (r.wins / Math.max(1, maxWins)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="rank-stats">
                    <span title="우승 횟수 · 우승비율">
                      🏆 {r.championships}회 · {champRate}
                    </span>
                    <span title="매치 승리 / 출전 · 승률">
                      ⚔ {r.wins}/{r.appearances} · {winRate}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
