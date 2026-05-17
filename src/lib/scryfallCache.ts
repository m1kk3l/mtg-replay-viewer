import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'mtg-replay-cache';
const STORE = 'cards';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface CachedCard {
  grpId: number;
  name: string;
  imageUrl: string;
  largeImageUrl: string;
  oracleText?: string;
  typeLine: string;
  power?: string;
  toughness?: string;
  cachedAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE, { keyPath: 'grpId' });
      },
    });
  }
  return dbPromise;
}

export async function getCards(grpIds: number[]): Promise<Map<number, CachedCard>> {
  const db = await getDb();
  const now = Date.now();
  const result = new Map<number, CachedCard>();
  for (const id of grpIds) {
    const card = await db.get(STORE, id) as CachedCard | undefined;
    if (card && now - card.cachedAt < TTL_MS) {
      result.set(id, card);
    }
  }
  return result;
}

export async function putCards(cards: CachedCard[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE, 'readwrite');
  for (const card of cards) {
    await tx.store.put(card);
  }
  await tx.done;
}
