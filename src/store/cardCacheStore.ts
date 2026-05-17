import { create } from 'zustand';
import type { CachedCard } from '../lib/scryfallCache';

interface CardCacheState {
  cards: Map<number, CachedCard>;
  failed: Set<number>;
  addCards: (cards: CachedCard[]) => void;
  markFailed: (grpIds: number[]) => void;
  getCard: (grpId: number) => CachedCard | undefined;
  hasFailed: (grpId: number) => boolean;
}

export const useCardCacheStore = create<CardCacheState>((set, get) => ({
  cards: new Map(),
  failed: new Set(),
  addCards: (cards) =>
    set(state => {
      const next = new Map(state.cards);
      for (const c of cards) next.set(c.grpId, c);
      return { cards: next };
    }),
  markFailed: (grpIds) =>
    set(state => {
      const next = new Set(state.failed);
      for (const id of grpIds) next.add(id);
      return { failed: next };
    }),
  getCard: (grpId) => get().cards.get(grpId),
  hasFailed: (grpId) => get().failed.has(grpId),
}));
