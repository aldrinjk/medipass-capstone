import { deleteItem, getItem, setItem } from './secureStore';

const CACHE_KEY = 'medipass_pass_public_urls';
const MAX_ENTRIES = 25;

type UrlCache = Record<string, string>;

async function readCache(): Promise<UrlCache> {
  const raw = await getItem(CACHE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as UrlCache;
  } catch {
    return {};
  }
}

async function writeCache(cache: UrlCache): Promise<void> {
  const entries = Object.entries(cache);
  const trimmed =
    entries.length > MAX_ENTRIES ? entries.slice(entries.length - MAX_ENTRIES) : entries;
  await setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(trimmed)));
}

export async function getCachedPublicUrl(passId: string): Promise<string | null> {
  const cache = await readCache();
  return cache[passId] ?? null;
}

export async function setCachedPublicUrl(passId: string, publicUrl: string): Promise<void> {
  const cache = await readCache();
  cache[passId] = publicUrl;
  await writeCache(cache);
}

export async function clearCachedPublicUrl(passId: string): Promise<void> {
  const cache = await readCache();
  delete cache[passId];
  await writeCache(cache);
}

export async function clearAllCachedPublicUrls(): Promise<void> {
  await deleteItem(CACHE_KEY);
}
