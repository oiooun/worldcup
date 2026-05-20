"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Item, Scores } from "@/lib/storage";
import { pickTournamentItems, roundLabel } from "@/lib/tournament";

type Props = {
  items: Item[];
  size: number;
};

type Stage = "playing" | "done";

export default function PlayClient({ items, size }: Props) {
  const [bracket, setBracket] = useState<Item[]>(() =>
    pickTournamentItems(items, size)
  );
  const [winners, setWinners] = useState<Item[]>([]);
  const [matchIdx, setMatchIdx] = useState(0);
  const [stage, setStage] = useState<Stage>("playing");
  const [history, setHistory] = useState<Item[]>([]);
  const [matchWins, setMatchWins] = useState<Record<string, number>>({});
  const [rankingItems, setRankingItems] = useState<Item[]>([]);
  const [scores, setScores] = useState<Scores>({});
  const [submitted, setSubmitted] = useState(false);
  const submitOnceRef = useRef(false);

  const totalMatchesThisRound = bracket.length / 2;
  const remainingInRound = bracket.length;
  const label = roundLabel(remainingInRound);
  const left = bracket[matchIdx * 2];
  const right = bracket[matchIdx * 2 + 1];

  const overallProgress = useMemo(() => {
    const startSize = size;
    let total = 0;
    let n = startSize;
    while (n > 1) {
      total += n / 2;
      n /= 2;
    }
    return { total, done: history.length };
  }, [size, history.length]);

  function pick(winner: Item) {
    const nextWinners = [...winners, winner];
    const nextHistory = [...history, winner];
    const nextMatchWins = {
      ...matchWins,
      [winner.id]: (matchWins[winner.id] ?? 0) + 1,
    };
    setMatchWins(nextMatchWins);

    if (matchIdx + 1 < totalMatchesThisRound) {
      setWinners(nextWinners);
      setMatchIdx(matchIdx + 1);
      setHistory(nextHistory);
      return;
    }
    if (nextWinners.length === 1) {
      setWinners(nextWinners);
      setHistory(nextHistory);
      setStage("done");
      return;
    }
    setBracket(nextWinners);
    setWinners([]);
    setMatchIdx(0);
    setHistory(nextHistory);
  }

  useEffect(() => {
    if (stage !== "done") return;
    if (submitOnceRef.current) return;
    submitOnceRef.current = true;
    const champion = winners[0];
    (async () => {
      try {
        const res = await fetch("/api/scores", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            championId: champion?.id ?? "",
            matchWins,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { items: Item[]; scores: Scores };
          setRankingItems(data.items);
          setScores(data.scores);
        }
      } finally {
        setSubmitted(true);
      }
    })();
  }, [stage, matchWins, winners]);

  if (stage === "done") {
    const champ = winners[0];
    const ranked = [...rankingItems]
      .map((item) => {
        const s = scores[item.id] ?? { wins: 0, championships: 0 };
        return { item, wins: s.wins, championships: s.championships };
      })
      .filter((r) => r.wins > 0 || r.championships > 0)
      .sort((a, b) => {
        if (b.championships !== a.championships)
          return b.championships - a.championships;
        return b.wins - a.wins;
      });

    return (
      <>
        <section className="panel winner-card">
          <div className="crown">👑</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
            최악으로 선정된 사람
          </div>
          <div className="name">{champ.text}</div>
          <div
            className="row"
            style={{ justifyContent: "center", marginTop: 16 }}
          >
            <Link className="btn primary" href="/">홈으로</Link>
          </div>
        </section>

        <section className="panel" style={{ marginTop: 16 }}>
          <div className="row between">
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>누적 순위</div>
              <div className="muted" style={{ fontSize: 13 }}>
                모든 사용자의 결과를 합산한 결과입니다
              </div>
            </div>
          </div>
          {!submitted ? (
            <div className="empty">집계 중…</div>
          ) : ranked.length === 0 ? (
            <div className="empty">아직 집계된 결과가 없습니다.</div>
          ) : (
            <ol className="rank-list">
              {ranked.map((r, idx) => (
                <li key={r.item.id} className="rank-item">
                  <div className={`rank-num rank-${idx + 1}`}>{idx + 1}</div>
                  <div className="rank-text">{r.item.text}</div>
                  <div className="rank-stats">
                    <span title="우승 횟수">🏆 {r.championships}</span>
                    <span title="매치 승리 횟수">⚔ {r.wins}</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </>
    );
  }

  const percent = overallProgress.total
    ? Math.round((overallProgress.done / overallProgress.total) * 100)
    : 0;

  return (
    <section>
      <div className="panel">
        <div className="row between">
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{label}</div>
            <div className="muted" style={{ fontSize: 13 }}>
              {matchIdx + 1} / {totalMatchesThisRound} 경기
            </div>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>
            전체 진행 {percent}%
          </div>
        </div>
        <div className="progress"><div style={{ width: `${percent}%` }} /></div>
      </div>

      <div className="match-stage">
        <button className="match-card" onClick={() => pick(left)}>
          {left.text}
        </button>
        <div className="vs">VS</div>
        <button className="match-card" onClick={() => pick(right)}>
          {right.text}
        </button>
      </div>
    </section>
  );
}
