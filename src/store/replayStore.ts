import { create } from 'zustand';
import type { ParsedMatch, ReplayStep, SerializableMatch, SerializableGameState, GameState } from '../types/game';

function deserializeGameState(s: SerializableGameState): GameState {
  return {
    ...s,
    zones: new Map(s.zones),
    gameObjects: new Map(s.gameObjects),
    zoneTypeMap: new Map(s.zoneTypeMap),
  };
}

export function deserializeMatch(m: SerializableMatch): ParsedMatch {
  return {
    ...m,
    grpIds: new Set(m.grpIds),
    steps: m.steps.map(step => ({
      ...step,
      gameState: deserializeGameState(step.gameState),
    })),
  };
}

interface ReplayState {
  matches: ParsedMatch[];
  currentMatchIndex: number;
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  setMatches: (matches: ParsedMatch[]) => void;
  selectMatch: (index: number) => void;
  goToStep: (index: number) => void;
  stepForward: () => void;
  stepBackward: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  currentMatch: () => ParsedMatch | null;
  currentStep: () => ReplayStep | null;
}

export const useReplayStore = create<ReplayState>((set, get) => ({
  matches: [],
  currentMatchIndex: 0,
  currentStepIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,

  setMatches: (matches) => set({ matches, currentMatchIndex: 0, currentStepIndex: 0, isPlaying: false }),
  selectMatch: (index) => set({ currentMatchIndex: index, currentStepIndex: 0, isPlaying: false }),
  goToStep: (index) => {
    const match = get().currentMatch();
    if (!match) return;
    const clamped = Math.max(0, Math.min(index, match.steps.length - 1));
    set({ currentStepIndex: clamped });
  },
  stepForward: () => {
    const { currentStepIndex, currentMatch } = get();
    const match = currentMatch();
    if (!match) return;
    if (currentStepIndex < match.steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      set({ isPlaying: false });
    }
  },
  stepBackward: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) set({ currentStepIndex: currentStepIndex - 1 });
  },
  goToFirst: () => set({ currentStepIndex: 0 }),
  goToLast: () => {
    const match = get().currentMatch();
    if (match) set({ currentStepIndex: match.steps.length - 1 });
  },
  togglePlay: () => set(state => ({ isPlaying: !state.isPlaying })),
  setSpeed: (speed) => set({ playbackSpeed: speed }),

  currentMatch: () => {
    const { matches, currentMatchIndex } = get();
    return matches[currentMatchIndex] ?? null;
  },
  currentStep: () => {
    const { currentStepIndex } = get();
    const match = get().currentMatch();
    return match?.steps[currentStepIndex] ?? null;
  },
}));
