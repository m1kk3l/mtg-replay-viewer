import type { CachedCard } from './scryfallCache';

const BATCH_SIZE = 75;
const RATE_LIMIT_MS = 120;

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

interface ScryfallCard {
  name: string;
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  image_uris?: { normal: string; large: string };
  card_faces?: Array<{ image_uris?: { normal: string; large: string } }>;
  arena_id?: number;
}

function mapCard(card: ScryfallCard, grpId: number): CachedCard {
  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  return {
    grpId,
    name: card.name,
    imageUrl: imageUris?.normal ?? '',
    largeImageUrl: imageUris?.large ?? '',
    oracleText: card.oracle_text,
    typeLine: card.type_line ?? '',
    power: card.power,
    toughness: card.toughness,
    cachedAt: Date.now(),
  };
}

export async function fetchCardsBatch(grpIds: number[]): Promise<CachedCard[]> {
  const results: CachedCard[] = [];
  for (let i = 0; i < grpIds.length; i += BATCH_SIZE) {
    const batch = grpIds.slice(i, i + BATCH_SIZE);
    try {
      const res = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: batch.map(id => ({ arena_id: id })) }),
      });
      if (!res.ok) continue;
      const data = await res.json() as { data: ScryfallCard[] };
      for (const card of data.data) {
        const arenaId = card.arena_id;
        if (arenaId && batch.includes(arenaId)) {
          results.push(mapCard(card, arenaId));
        }
      }
    } catch {
      // network error — skip batch
    }
    if (i + BATCH_SIZE < grpIds.length) await sleep(RATE_LIMIT_MS);
  }
  return results;
}

export async function fetchSingleCard(grpId: number): Promise<CachedCard | null> {
  try {
    const res = await fetch(`https://api.scryfall.com/cards/arena/${grpId}`);
    if (!res.ok) return null;
    const card = await res.json() as ScryfallCard;
    return mapCard(card, grpId);
  } catch {
    return null;
  }
}
