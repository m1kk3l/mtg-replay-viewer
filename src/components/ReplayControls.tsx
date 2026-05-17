import { useReplayStore } from '../store/replayStore';
import { PhaseIndicator } from './PhaseIndicator';
import { TurnSlider } from './TurnSlider';

const SPEEDS = [0.5, 1, 2, 4];

export function ReplayControls() {
  const {
    isPlaying, togglePlay, stepForward, stepBackward, goToFirst, goToLast,
    currentStepIndex, playbackSpeed, setSpeed, currentMatch, currentStep,
  } = useReplayStore();

  const match = currentMatch();
  const step = currentStep();
  const total = match?.steps.length ?? 0;

  return (
    <div className="bg-slate-900 border-t border-slate-700 px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <CtrlBtn onClick={goToFirst} title="First step">⏮</CtrlBtn>
          <CtrlBtn onClick={stepBackward} title="Previous step">⏪</CtrlBtn>
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-lg transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <CtrlBtn onClick={stepForward} title="Next step">⏩</CtrlBtn>
          <CtrlBtn onClick={goToLast} title="Last step">⏭</CtrlBtn>
        </div>

        <div className="flex items-center gap-1 ml-2">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                playbackSpeed === s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="ml-auto text-slate-400 text-sm">
          {currentStepIndex + 1} / {total}
        </div>
      </div>

      <TurnSlider />

      {step && (
        <div className="flex items-center gap-3">
          <PhaseIndicator label={step.label} />
          {match && (
            <span className="text-slate-500 text-xs">
              Active: {match.players.find(p => p.systemSeatId === step.gameState.turnInfo.activePlayer)?.playerName ?? `Seat ${step.gameState.turnInfo.activePlayer}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function CtrlBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center text-sm transition-colors"
    >
      {children}
    </button>
  );
}
