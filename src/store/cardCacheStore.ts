import { create } from 'zustand';
import type { CachedCard } from '../lib/scryfallCache';

interface CardCacheState {
  cards: Map<number, CachedCard>;
  addCards: (cards: CachedCard[]) => void;
  getCard: (grpId: number) => CachedCard | undefined;
}

export const useCardCacheStore = create<CardCacheState>((set, get) => ({
  cards: new Map(),
  addCards: (cards) =>
    set(state => {
      const next = new Map(state.cards);
      for (const c of cards) next.set(c.grpId, c);
      return { cards: next };
    }),
  getCard: (grpId) => get().cards.get(grpId),
}));
