import { useEffect } from 'react';
import { useCardCacheStore } from '../store/cardCacheStore';
import { getCards, putCards } from '../lib/scryfallCache';
import { fetchSingleCard } from '../lib/scryfallFetcher';

export function useCardImage(grpId: number): { imageUrl: string | null; name: string | null; loading: boolean } {
  const card = useCardCacheStore(s => s.getCard(grpId));
  const failed = useCardCacheStore(s => s.hasFailed(grpId));
  const addCards = useCardCacheStore(s => s.addCards);
  const markFailed = useCardCacheStore(s => s.markFailed);

  useEffect(() => {
    if (!grpId || grpId === 0 || card || failed) return;
    let cancelled = false;
    async function doFetch() {
      const cached = await getCards([grpId]);
      if (cached.has(grpId) && !cancelled) {
        addCards([cached.get(grpId)!]);
        return;
      }
      const fetched = await fetchSingleCard(grpId);
      if (cancelled) return;
      if (fetched) {
        await putCards([fetched]);
        addCards([fetched]);
      } else {
        markFailed([grpId]);
      }
    }
    doFetch();
    return () => { cancelled = true; };
  }, [grpId, card, failed, addCards, markFailed]);

  return {
    imageUrl: card?.imageUrl ?? null,
    name: card?.name ?? null,
    loading: !card && !failed && grpId > 0,
  };
}
