import type { Item } from "./storage";

export function largestPowerOfTwo(n: number): number {
  if (n < 2) return 0;
  let p = 1;
  while (p * 2 <= n) p *= 2;
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

export function pickTournamentItems(items: Item[], size?: number): Item[] {
  const shuffled = shuffle(items);
  const cap = size ?? largestPowerOfTwo(items.length);
  return shuffled.slice(0, cap);
}

export function roundLabel(remaining: number): string {
  if (remaining === 2) return "결승";
  if (remaining === 4) return "4강";
  return `${remaining}강`;
}

export function availableBracketSizes(itemCount: number): number[] {
  const max = largestPowerOfTwo(itemCount);
  const sizes: number[] = [];
  for (let s = 2; s <= max; s *= 2) sizes.push(s);
  return sizes;
}
