import fs from "fs/promises";
import path from "path";

export type Item = {
  id: string;
  text: string;
  createdAt: number;
};

export type Scores = Record<string, { wins: number; championships: number }>;

const KV_KEY = "worldcup:items";
const KV_SCORES_KEY = "worldcup:scores";
const LOCAL_FILE = path.join(process.cwd(), "data", "local.json");
const LOCAL_SCORES_FILE = path.join(process.cwd(), "data", "scores.json");

function getRedisCreds(): { url: string; token: string } | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    "";
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";
  if (!url || !token) return null;
  return { url, token };
}

type RedisLike = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<unknown>;
};

let cachedClient: RedisLike | null = null;

async function getRedis(): Promise<RedisLike | null> {
  if (cachedClient) return cachedClient;
  const creds = getRedisCreds();
  if (!creds) return null;
  const { Redis } = await import("@upstash/redis");
  cachedClient = new Redis(creds) as unknown as RedisLike;
  return cachedClient;
}

function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function noStorageError(): Error {
  return new Error(
    "스토리지가 설정되지 않았습니다. Vercel 대시보드에서 Upstash Redis 통합을 추가하고 KV_REST_API_URL / KV_REST_API_TOKEN(또는 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) 환경변수가 주입되었는지 확인한 뒤 재배포하세요."
  );
}

async function readLocal<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

async function writeLocal(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

async function readKey<T>(key: string, file: string, fallback: T): Promise<T> {
  const redis = await getRedis();
  if (redis) {
    const v = await redis.get<T>(key);
    return v ?? fallback;
  }
  if (isServerless()) {
    throw noStorageError();
  }
  return readLocal(file, fallback);
}

async function writeKey(key: string, file: string, value: unknown): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.set(key, value);
    return;
  }
  if (isServerless()) {
    throw noStorageError();
  }
  await writeLocal(file, value);
}

export async function getItems(): Promise<Item[]> {
  const arr = await readKey<Item[]>(KV_KEY, LOCAL_FILE, []);
  return Array.isArray(arr) ? arr : [];
}

async function saveItems(items: Item[]): Promise<void> {
  await writeKey(KV_KEY, LOCAL_FILE, items);
}

export async function addItem(text: string): Promise<Item> {
  const items = await getItems();
  const item: Item = {
    id: crypto.randomUUID(),
    text,
    createdAt: Date.now(),
  };
  items.push(item);
  await saveItems(items);
  return item;
}

export async function updateItem(id: string, text: string): Promise<Item | null> {
  const items = await getItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], text };
  await saveItems(items);
  return items[idx];
}

export async function deleteItem(id: string): Promise<boolean> {
  const items = await getItems();
  const next = items.filter((i) => i.id !== id);
  if (next.length === items.length) return false;
  await saveItems(next);
  return true;
}

export async function replaceItems(items: Item[]): Promise<void> {
  await saveItems(items);
}

export async function getScores(): Promise<Scores> {
  const v = await readKey<Scores>(KV_SCORES_KEY, LOCAL_SCORES_FILE, {});
  return v && typeof v === "object" ? v : {};
}

async function saveScores(scores: Scores): Promise<void> {
  await writeKey(KV_SCORES_KEY, LOCAL_SCORES_FILE, scores);
}

export async function recordResult(
  matchWins: Record<string, number>,
  championId: string
): Promise<Scores> {
  const scores = await getScores();
  for (const [id, count] of Object.entries(matchWins)) {
    const cur = scores[id] ?? { wins: 0, championships: 0 };
    scores[id] = { ...cur, wins: cur.wins + count };
  }
  if (championId) {
    const cur = scores[championId] ?? { wins: 0, championships: 0 };
    scores[championId] = { ...cur, championships: cur.championships + 1 };
  }
  await saveScores(scores);
  return scores;
}
