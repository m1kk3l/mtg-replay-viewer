import { useReplayStore } from '../store/replayStore';

export function TurnSlider() {
  const { currentStepIndex, goToStep, currentMatch } = useReplayStore();
  const match = currentMatch();
  const steps = match?.steps ?? [];

  if (steps.length === 0) return null;

  // Collect turn boundary indices for tick marks
  const turnTicks: number[] = [];
  let lastTurn = -1;
  steps.forEach((s, i) => {
    if (s.turnNumber !== lastTurn) {
      turnTicks.push(i);
      lastTurn = s.turnNumber;
    }
  });

  const listId = 'turn-ticks';

  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 text-xs whitespace-nowrap">Turn 1</span>
      <div className="flex-1 relative">
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          value={currentStepIndex}
          onChange={e => goToStep(Number(e.target.value))}
          list={listId}
          className="w-full accent-blue-500"
        />
        <datalist id={listId}>
          {turnTicks.map(i => <option key={i} value={i} />)}
        </datalist>
      </div>
      <span className="text-slate-500 text-xs whitespace-nowrap">
        T{steps[steps.length - 1]?.turnNumber ?? '?'}
      </span>
    </div>
  );
}
