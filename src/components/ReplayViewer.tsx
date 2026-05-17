import { useEffect, useState } from 'react';
import { useReplayStore } from '../store/replayStore';
import { useReplayEngine } from '../hooks/useReplayEngine';
import { useScryfallBatch } from '../hooks/useScryfallBatch';
import { GameBoard } from './GameBoard';
import { ReplayControls } from './ReplayControls';
import { EventFeed } from './EventFeed';
import { MatchSidebar } from './MatchSidebar';

export function ReplayViewer() {
  const currentMatch = useReplayStore(s => s.currentMatch)();
  const currentStep = useReplayStore(s => s.currentStep)();
  const { goToStep, stepForward, stepBackward, goToFirst, goToLast, togglePlay } = useReplayStore();
  const matches = useReplayStore(s => s.matches);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="flex h-[100dvh] bg-slate-950 overflow-hidden relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always visible on md+, drawer on mobile */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-30 transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${matches.length <= 1 ? 'hidden' : ''}
      `}>
        <MatchSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar with hamburger */}
        {matches.length > 1 && (
          <div className="md:hidden flex items-center px-2 py-1 bg-slate-900 border-b border-slate-700 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white"
              aria-label="Open match list"
            >
              ☰
            </button>
            <span className="text-slate-400 text-sm ml-2">Matches</span>
          </div>
        )}
        <GameBoard step={currentStep} match={currentMatch} />
        <ReplayControls />
        <EventFeed
          events={currentStep.eventsSinceLastStep}
          phase={currentStep.gameState.turnInfo.phase}
          step={currentStep.gameState.turnInfo.step}
          activePlayerName={
            currentMatch.players.find(p => p.systemSeatId === currentStep.gameState.turnInfo.activePlayer)?.playerName
            ?? `Player ${currentStep.gameState.turnInfo.activePlayer}`
          }
        />
      </div>
    </div>
  );
}
