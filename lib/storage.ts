import fs from "fs/promises";
import path from "path";

export type Item = {
  id: string;
  text: string;
  createdAt: number;
};

const KV_KEY = "worldcup:items";
const LOCAL_FILE = path.join(process.cwd(), "data", "local.json");

function hasKV(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function readLocal(): Promise<Item[]> {
  try {
    const raw = await fs.readFile(LOCAL_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Item[];
    return [];
  } catch {
    return [];
  }
}

async function writeLocal(items: Item[]): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(items, null, 2), "utf8");
}

export async function getItems(): Promise<Item[]> {
  if (hasKV()) {
    const { kv } = await import("@vercel/kv");
    const data = (await kv.get<Item[]>(KV_KEY)) ?? [];
    return data;
  }
  return readLocal();
}

async function saveItems(items: Item[]): Promise<void> {
  if (hasKV()) {
    const { kv } = await import("@vercel/kv");
    await kv.set(KV_KEY, items);
    return;
  }
  await writeLocal(items);
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
