interface CardMapEntry {
  name: string;
  set: string;
  cn: string;
  t?: 1;       // token flag (1 = is a token)
  p?: string;  // power (tokens only)
  tn?: string; // toughness (tokens only)
  tp?: string; // type line (tokens only), e.g. "Creature" or "Enchantment"
}

export type { CardMapEntry };

type CardMap = Record<string, CardMapEntry>;

let mapPromise: Promise<CardMap> | null = null;

export function getCardMapPromise(): Promise<CardMap> {
  if (!mapPromise) {
    mapPromise = fetch('/card-map.json')
      .then(r => r.json() as Promise<CardMap>)
      .catch(() => ({}));
  }
  return mapPromise;
}

export async function lookupCardMap(grpId: number): Promise<CardMapEntry | null> {
  const map = await getCardMapPromise();
  return map[grpId] ?? null;
}
