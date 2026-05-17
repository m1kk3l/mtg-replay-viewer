import { useEffect } from 'react';
import { useCardCacheStore } from '../store/cardCacheStore';
import { getCards, putCards } from '../lib/scryfallCache';
import { fetchCardsBatch } from '../lib/scryfallFetcher';

export function useScryfallBatch(grpIds: Set<number>) {
  const addCards = useCardCacheStore(s => s.addCards);

  useEffect(() => {
    if (grpIds.size === 0) return;
    let cancelled = false;
    async function run() {
      const ids = [...grpIds].filter(id => id > 0);
      const cached = await getCards(ids);
      const missing = ids.filter(id => !cached.has(id));
      // Load cached ones immediately
      if (cached.size > 0) addCards([...cached.values()]);
      if (missing.length === 0) return;
      const fetched = await fetchCardsBatch(missing);
      if (cancelled) return;
      if (fetched.length > 0) {
        await putCards(fetched);
        addCards(fetched);
      }
    }
    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grpIds.size]);
}
