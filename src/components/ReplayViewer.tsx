import { useEffect } from 'react';
import { useReplayStore } from '../store/replayStore';
import { useReplayEngine } from '../hooks/useReplayEngine';
import { useScryfallBatch } from '../hooks/useScryfallBatch';
import { useScale } from '../hooks/useScale';
import { GameBoard } from './GameBoard';
import { ReplayControls } from './ReplayControls';
import { GameLog } from './GameLog';
import { MatchDropdown } from './MatchDropdown';

export function ReplayViewer() {
  const currentMatch = useReplayStore(s => s.currentMatch)();
  const currentStep = useReplayStore(s => s.currentStep)();
  const currentStepIndex = useReplayStore(s => s.currentStepIndex);
  const { goToStep, stepForward, stepBackward, goToFirst, goToLast, togglePlay } = useReplayStore();
  const { scale, baseW, baseH } = useScale();

  useReplayEngine();
  useScryfallBatch(currentMatch?.grpIds ?? new Set());

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
    <div className="w-screen h-[100dvh] bg-slate-950 overflow-hidden flex items-center justify-center">
      {/* Fixed 1920x1080 stage scaled to fit viewport */}
      <div
        style={{
          width: baseW,
          height: baseH,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
        }}
        className="flex bg-slate-950"
      >
        {/* Left column: match dropdown + game log + replay controls */}
        <div className="w-[300px] shrink-0 flex flex-col border-r border-slate-700 bg-slate-900">
          <MatchDropdown />
          <div className="flex-1 min-h-0">
            <GameLog match={currentMatch} currentStepIndex={currentStepIndex} />
          </div>
          <ReplayControls />
        </div>

        {/* Play area takes the rest of the stage */}
        <div className="flex flex-1 min-w-0">
          <GameBoard step={currentStep} match={currentMatch} />
        </div>
      </div>
    </div>
  );
}
