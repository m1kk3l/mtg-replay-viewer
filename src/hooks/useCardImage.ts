import { useEffect } from 'react';
import { useCardCacheStore } from '../store/cardCacheStore';
import { getCards, putCards } from '../lib/scryfallCache';
import { fetchSingleCard } from '../lib/scryfallFetcher';

export function useCardImage(grpId: number): { imageUrl: string | null; name: string | null; loading: boolean } {
  const card = useCardCacheStore(s => s.getCard(grpId));
  const addCards = useCardCacheStore(s => s.addCards);

  useEffect(() => {
    if (!grpId || grpId === 0 || card) return;
    let cancelled = false;
    async function fetch() {
      // Check IndexedDB first
      const cached = await getCards([grpId]);
      if (cached.has(grpId) && !cancelled) {
        addCards([cached.get(grpId)!]);
        return;
      }
      const fetched = await fetchSingleCard(grpId);
      if (fetched && !cancelled) {
        await putCards([fetched]);
        addCards([fetched]);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [grpId, card, addCards]);

  return {
    imageUrl: card?.imageUrl ?? null,
    name: card?.name ?? null,
    loading: !card && grpId > 0,
  };
}
