import type { CachedCard } from './scryfallCache';
import { lookupCardMap, type CardMapEntry } from './cardMap';

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

// Synthesise a CachedCard from local MTGA data when Scryfall has no image.
// Consumers render this as a styled fallback (token card with name + type + P/T).
function localCard(entry: CardMapEntry, grpId: number): CachedCard {
  const baseType = entry.tp ? entry.tp.split('/').join(' ') : '';
  return {
    grpId,
    name: entry.name,
    imageUrl: '',
    largeImageUrl: '',
    typeLine: entry.t ? `Token ${baseType}`.trim() : baseType,
    power: entry.p,
    toughness: entry.tn,
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
    const entry = await lookupCardMap(grpId);

    // For tokens: skip arena_id lookup (always fails), go straight to set/cn
    if (entry?.t === 1) {
      const res = await fetch(`https://api.scryfall.com/cards/${entry.set}/${entry.cn}`);
      if (res.ok) {
        const card = await res.json() as ScryfallCard;
        return mapCard(card, grpId);
      }
      // Token not on Scryfall (MTGA-exclusive) — synthesize locally
      return localCard(entry, grpId);
    }

    // Non-token primary: look up by arena_id (works for cards up to ~TDM, April 2025)
    const res = await fetch(`https://api.scryfall.com/cards/arena/${grpId}`);
    if (res.ok) {
      const card = await res.json() as ScryfallCard;
      return mapCard(card, grpId);
    }

    if (!entry) return null;

    // Fallback: look up set+collector_number from local MTGA card map
    const res2 = await fetch(`https://api.scryfall.com/cards/${entry.set}/${entry.cn}`);
    if (!res2.ok) {
      // MTGA-exclusive card — synthesize from local data so we at least show the name
      return localCard(entry, grpId);
    }
    const card = await res2.json() as ScryfallCard;
    return mapCard(card, grpId);
  } catch {
    return null;
  }
}
