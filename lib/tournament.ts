import type { Item } from "./storage";

export function nextPowerOfTwo(n: number): number {
  if (n < 2) return n < 1 ? 0 : 1;
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildFirstRound(items: Item[]): {
  matches: Item[];
  byes: Item[];
  roundSize: number;
} {
  const shuffled = shuffle(items);
  const n = shuffled.length;
  const B = nextPowerOfTwo(n);
  const byeCount = Math.max(0, B - n);
  return {
    matches: shuffled.slice(byeCount),
    byes: shuffled.slice(0, byeCount),
    roundSize: B,
  };
}

export function roundLabel(roundSize: number): string {
  if (roundSize <= 2) return "결승";
  if (roundSize === 4) return "4강";
  return `${roundSize}강`;
}
