import Link from "next/link";
import { getItems } from "@/lib/storage";
import { availableBracketSizes, largestPowerOfTwo } from "@/lib/tournament";
import PlayClient from "./PlayClient";

export const dynamic = "force-dynamic";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: { size?: string };
}) {
  const items = await getItems();
  const max = largestPowerOfTwo(items.length);
  const requested = Number(searchParams.size ?? max);
  const sizes = availableBracketSizes(items.length);

  let size = sizes.includes(requested) ? requested : max;
  if (!size) {
    return (
      <main className="container">
        <header className="header">
          <h1 className="title">최악고르기 월드컵</h1>
          <Link className="btn ghost" href="/">홈</Link>
        </header>
        <div className="panel empty">
          <p>후보가 2명 이상이어야 합니다.</p>
          <Link className="btn primary" href="/admin">관리자로 이동</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1 className="title">최악고르기 월드컵</h1>
          <div className="subtitle">더 별로인 쪽을 선택하세요</div>
        </div>
        <Link className="btn ghost" href="/">홈</Link>
      </header>
      <PlayClient items={items} size={size} />
    </main>
  );
}
