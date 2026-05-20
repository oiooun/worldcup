"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Item } from "@/lib/storage";
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

  function restart() {
    setBracket(pickTournamentItems(items, size));
    setWinners([]);
    setMatchIdx(0);
    setHistory([]);
    setStage("playing");
  }

  if (stage === "done") {
    const champ = winners[0];
    return (
      <section className="panel winner-card">
        <div className="crown">👑</div>
        <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          최악으로 선정된 사람
        </div>
        <div className="name">{champ.text}</div>
        <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
          <button className="btn primary" onClick={restart}>다시 하기</button>
          <Link className="btn" href="/">홈으로</Link>
        </div>
      </section>
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

      <div className="row" style={{ marginTop: 20, justifyContent: "center" }}>
        <button className="btn ghost" onClick={restart}>다시 섞기</button>
      </div>
    </section>
  );
}
