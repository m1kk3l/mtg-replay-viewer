import { useEffect } from 'react';
import { useReplayStore } from '../store/replayStore';
import { useReplayEngine } from '../hooks/useReplayEngine';
import { useScryfallBatch } from '../hooks/useScryfallBatch';
import { GameBoard } from './GameBoard';
import { ReplayControls } from './ReplayControls';
import { EventFeed } from './EventFeed';
import { MatchSidebar } from './MatchSidebar';
import { CardTooltip } from './CardImage';

export function ReplayViewer() {
  const currentMatch = useReplayStore(s => s.currentMatch)();
  const currentStep = useReplayStore(s => s.currentStep)();
  const { goToStep, stepForward, stepBackward, goToFirst, goToLast, togglePlay } = useReplayStore();

  useReplayEngine();
  useScryfallBatch(currentMatch?.grpIds ?? new Set());

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': e.shiftKey ? goToStep(useReplayStore.getState().currentStepIndex + 5) : stepForward(); break;
        case 'ArrowLeft': e.shiftKey ? goToStep(useReplayStore.getState().currentStepIndex - 5) : stepBackward(); break;
        case 'Home': goToFirst(); break;
        case 'End': goToLast(); break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, stepForward, stepBackward, goToFirst, goToLast, goToStep]);

  if (!currentMatch || !currentStep) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        No match data available
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <MatchSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <GameBoard step={currentStep} match={currentMatch} />
        <ReplayControls />
        <EventFeed events={currentStep.eventsSinceLastStep} />
      </div>
      <CardTooltip />
    </div>
  );
}
