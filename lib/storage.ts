import fs from "fs/promises";
import path from "path";

export type Item = {
  id: string;
  text: string;
  createdAt: number;
};

export type Scores = Record<string, { wins: number; championships: number }>;

export type Stats = {
  scores: Scores;
  tournaments: number;
};

const KV_ITEMS_KEY = "worldcup:items";
const KV_WINS_KEY = "worldcup:wins";
const KV_CHAMPS_KEY = "worldcup:champs";
const KV_TOURNEYS_KEY = "worldcup:tournaments";

const LOCAL_ITEMS_FILE = path.join(process.cwd(), "data", "local.json");
const LOCAL_STATS_FILE = path.join(process.cwd(), "data", "stats.json");
const LOCAL_OLD_SCORES_FILE = path.join(process.cwd(), "data", "scores.json");

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

type RedisHash = Record<string, unknown> | null;

type RedisLike = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<unknown>;
  hgetall: (key: string) => Promise<RedisHash>;
  pipeline: () => {
    hincrby: (key: string, field: string, increment: number) => unknown;
    incr: (key: string) => unknown;
    exec: () => Promise<unknown[]>;
  };
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
    "스토리지가 설정되지 않았습니다. Vercel 대시보드에서 Upstash Redis 통합을 추가하고 KV_REST_API_URL / KV_REST_API_TOKEN (또는 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) 환경변수가 주입되었는지 확인한 뒤 재배포하세요."
  );
}

async function readLocal<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeLocal(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

// ----- Items -----

export async function getItems(): Promise<Item[]> {
  const redis = await getRedis();
  if (redis) {
    const arr = await redis.get<Item[]>(KV_ITEMS_KEY);
    return Array.isArray(arr) ? arr : [];
  }
  if (isServerless()) throw noStorageError();
  const arr = await readLocal<Item[]>(LOCAL_ITEMS_FILE, []);
  return Array.isArray(arr) ? arr : [];
}

async function saveItems(items: Item[]): Promise<void> {
  const redis = await getRedis();
  if (redis) {
    await redis.set(KV_ITEMS_KEY, items);
    return;
  }
  if (isServerless()) throw noStorageError();
  await writeLocal(LOCAL_ITEMS_FILE, items);
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

// ----- Stats / Scoring -----

function mergeScores(wins: RedisHash, champs: RedisHash): Scores {
  const result: Scores = {};
  if (wins) {
    for (const [id, v] of Object.entries(wins)) {
      const n = Number(v);
      if (!Number.isFinite(n) || n === 0) continue;
      result[id] = { wins: n, championships: 0 };
    }
  }
  if (champs) {
    for (const [id, v] of Object.entries(champs)) {
      const n = Number(v);
      if (!Number.isFinite(n) || n === 0) continue;
      if (!result[id]) result[id] = { wins: 0, championships: 0 };
      result[id].championships = n;
    }
  }
  return result;
}

async function readLocalStats(): Promise<Stats> {
  const fresh = await readLocal<{ scores?: Scores; tournaments?: number } | null>(
    LOCAL_STATS_FILE,
    null
  );
  if (fresh && typeof fresh === "object" && "scores" in fresh) {
    return {
      scores: (fresh.scores as Scores) ?? {},
      tournaments: Number(fresh.tournaments) || 0,
    };
  }
  const old = await readLocal<Scores | null>(LOCAL_OLD_SCORES_FILE, null);
  if (old && typeof old === "object") {
    return { scores: old, tournaments: 0 };
  }
  return { scores: {}, tournaments: 0 };
}

export async function getStats(): Promise<Stats> {
  const redis = await getRedis();
  if (redis) {
    const [wins, champs, tourneys] = await Promise.all([
      redis.hgetall(KV_WINS_KEY),
      redis.hgetall(KV_CHAMPS_KEY),
      redis.get<number | string>(KV_TOURNEYS_KEY),
    ]);
    return {
      scores: mergeScores(wins, champs),
      tournaments: Number(tourneys) || 0,
    };
  }
  if (isServerless()) throw noStorageError();
  return readLocalStats();
}

export async function getScores(): Promise<Scores> {
  return (await getStats()).scores;
}

export async function recordResult(
  matchWins: Record<string, number>,
  championId: string
): Promise<Stats> {
  const redis = await getRedis();
  if (redis) {
    const pipe = redis.pipeline();
    for (const [id, count] of Object.entries(matchWins)) {
      if (count > 0) pipe.hincrby(KV_WINS_KEY, id, count);
    }
    if (championId) {
      pipe.hincrby(KV_CHAMPS_KEY, championId, 1);
    }
    pipe.incr(KV_TOURNEYS_KEY);
    await pipe.exec();
    return await getStats();
  }
  if (isServerless()) throw noStorageError();
  const stats = await readLocalStats();
  for (const [id, count] of Object.entries(matchWins)) {
    const cur = stats.scores[id] ?? { wins: 0, championships: 0 };
    stats.scores[id] = { ...cur, wins: cur.wins + count };
  }
  if (championId) {
    const cur = stats.scores[championId] ?? { wins: 0, championships: 0 };
    stats.scores[championId] = { ...cur, championships: cur.championships + 1 };
  }
  stats.tournaments += 1;
  await writeLocal(LOCAL_STATS_FILE, stats);
  return stats;
}
