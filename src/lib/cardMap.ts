interface CardMapEntry {
  name: string;
  set: string;
  cn: string;
}

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
