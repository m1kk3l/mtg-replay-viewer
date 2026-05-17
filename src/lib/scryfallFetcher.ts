import type { CachedCard } from './scryfallCache';
import { lookupCardMap } from './cardMap';

const CONCURRENT = 10;
const RATE_LIMIT_MS = 100;

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
  for (let i = 0; i < grpIds.length; i += CONCURRENT) {
    const chunk = grpIds.slice(i, i + CONCURRENT);
    const fetched = await Promise.all(chunk.map(id => fetchSingleCard(id)));
    for (const card of fetched) {
      if (card) results.push(card);
    }
    if (i + CONCURRENT < grpIds.length) await sleep(RATE_LIMIT_MS);
  }
  return results;
}

export async function fetchSingleCard(grpId: number): Promise<CachedCard | null> {
  try {
    // Primary: look up by arena_id (works for cards up to ~TDM, April 2025)
    const res = await fetch(`https://api.scryfall.com/cards/arena/${grpId}`);
    if (res.ok) {
      const card = await res.json() as ScryfallCard;
      return mapCard(card, grpId);
    }

    // Fallback: look up set+collector_number from local MTGA card map
    const entry = await lookupCardMap(grpId);
    if (!entry) return null;

    const res2 = await fetch(`https://api.scryfall.com/cards/${entry.set}/${entry.cn}`);
    if (!res2.ok) return null;
    const card = await res2.json() as ScryfallCard;
    return mapCard(card, grpId);
  } catch {
    return null;
  }
}
