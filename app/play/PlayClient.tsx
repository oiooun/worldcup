"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Item, Scores } from "@/lib/storage";
import { buildFirstRound, roundLabel } from "@/lib/tournament";

type Props = {
  items: Item[];
  isAdmin: boolean;
};

type Stage = "playing" | "done";

function formatRate(numer: number, denom: number): string {
  if (!denom || denom <= 0) return "—";
  const pct = Math.min(100, Math.round((numer / denom) * 100));
  return `${pct}%`;
}

export default function PlayClient({ items, isAdmin }: Props) {
  const [setup] = useState(() => buildFirstRound(items));
  const [roundSize, setRoundSize] = useState<number>(setup.roundSize);
  const [pending, setPending] = useState<Item[]>(setup.matches);
  const [advancing, setAdvancing] = useState<Item[]>(setup.byes);
  const [matchIdx, setMatchIdx] = useState(0);
  const [stage, setStage] = useState<Stage>("playing");
  const [matchesPlayed, setMatchesPlayed] = useState(0);
  const [matchWins, setMatchWins] = useState<Record<string, number>>({});
  const [matchAppearances, setMatchAppearances] = useState<
    Record<string, number>
  >({});
  const [champion, setChampion] = useState<Item | null>(null);
  const [rankingItems, setRankingItems] = useState<Item[]>([]);
  const [scores, setScores] = useState<Scores>({});
  const [tournaments, setTournaments] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitOnceRef = useRef(false);

  const totalMatchesThisRound = pending.length / 2;
  const totalMatchesOverall = Math.max(0, items.length - 1);
  const left = pending[matchIdx * 2];
  const right = pending[matchIdx * 2 + 1];
  const label = roundLabel(roundSize);

  const percent = useMemo(() => {
    if (totalMatchesOverall <= 0) return 0;
    return Math.round((matchesPlayed / totalMatchesOverall) * 100);
  }, [matchesPlayed, totalMatchesOverall]);

  function pick(winner: Item) {
    const newAdvancing = [...advancing, winner];
    const nextMatchWins = {
      ...matchWins,
      [winner.id]: (matchWins[winner.id] ?? 0) + 1,
    };
    const nextMatchAppearances = {
      ...matchAppearances,
      [left.id]: (matchAppearances[left.id] ?? 0) + 1,
      [right.id]: (matchAppearances[right.id] ?? 0) + 1,
    };
    setMatchWins(nextMatchWins);
    setMatchAppearances(nextMatchAppearances);
    setMatchesPlayed(matchesPlayed + 1);

    if (matchIdx + 1 < totalMatchesThisRound) {
      setAdvancing(newAdvancing);
      setMatchIdx(matchIdx + 1);
      return;
    }
    if (newAdvancing.length === 1) {
      setAdvancing(newAdvancing);
      setChampion(newAdvancing[0]);
      setStage("done");
      return;
    }
    setRoundSize(Math.max(1, roundSize / 2));
    setPending(newAdvancing);
    setAdvancing([]);
    setMatchIdx(0);
  }

  useEffect(() => {
    if (stage !== "done") return;
    if (submitOnceRef.current) return;
    submitOnceRef.current = true;
    (async () => {
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            championId: champion?.id ?? "",
            matchWins,
            matchAppearances,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            items: Item[];
            scores: Scores;
            tournaments?: number;
          };
          setRankingItems(data.items);
          setScores(data.scores);
          if (typeof data.tournaments === "number") {
            setTournaments(data.tournaments);
          }
        } else {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setSubmitError(data?.error || `결과 저장 실패 (HTTP ${res.status})`);
        }
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "결과 저장 중 오류가 발생했습니다.");
      } finally {
        setSubmitted(true);
      }
    })();
  }, [stage, matchWins, matchAppearances, champion]);

  if (stage === "done" && champion) {
    const ranked = [...rankingItems]
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
      <>
        <section className="panel winner-card">
          <div className="crown">👑</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            최악으로 선정된 사람
          </div>
          <div className="name">{champion.text}</div>
          <div
            className="row"
            style={{ justifyContent: "center", marginTop: 16 }}
          >
            <Link className="btn primary" href="/"><span className="arrow-back">←</span>처음으로</Link>
          </div>
        </section>

        <section className="panel" style={{ marginTop: 16 }}>
          <div className="row between" style={{ marginBottom: 4 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>📊 누적 순위</div>
              <div className="muted" style={{ fontSize: 13 }}>
                모든 사용자의 결과를 합산한 결과입니다
              </div>
            </div>
            {isAdmin && submitted && !submitError && tournaments > 0 && (
              <div className="tourney-counter">
                <span className="tourney-counter-num">{tournaments}</span>
                <span className="tourney-counter-label">번째 진행</span>
              </div>
            )}
          </div>
          {!submitted ? (
            <div className="empty">집계 중…</div>
          ) : submitError ? (
            <div className="empty">
              <div className="error">{submitError}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                Vercel Upstash Redis 환경변수가 설정되어 있는지 확인해 보세요.
              </div>
            </div>
          ) : ranked.length === 0 ? (
            <div className="empty">아직 집계된 결과가 없습니다.</div>
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
      </>
    );
  }

  return (
    <section>
      <div className="panel round-panel">
        <div className="row between">
          <div>
            <div className="round-badge">{label}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              {matchIdx + 1} / {totalMatchesThisRound} 경기
            </div>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            전체 진행 <strong style={{ color: "var(--text)" }}>{percent}%</strong>
          </div>
        </div>
        <div className="progress"><div style={{ width: `${percent}%` }} /></div>
      </div>

      <div className="match-stage" key={`${roundSize}-${matchIdx}`}>
        <button className="match-card" onClick={() => pick(left)}>
          <span className="match-card-inner">{left.text}</span>
        </button>
        <div className="vs">VS</div>
        <button className="match-card" onClick={() => pick(right)}>
          <span className="match-card-inner">{right.text}</span>
        </button>
      </div>
    </section>
  );
}
