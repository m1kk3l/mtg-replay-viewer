import { useReplayStore } from '../store/replayStore';

export function MatchSidebar() {
  const { matches, currentMatchIndex, selectMatch } = useReplayStore();

  if (matches.length <= 1) return null;

  return (
    <div className="w-full bg-slate-900 flex flex-col overflow-y-auto h-full">
      <div className="flex items-center px-3 py-2 border-b border-slate-700">
        <span className="text-slate-400 text-sm font-medium uppercase tracking-wide">Matches ({matches.length})</span>
      </div>
      {matches.map((m, i) => {
        const opponent = m.players.find(p => p.systemSeatId !== m.localSeatId);
        const won = m.result?.winningSeatId === m.localSeatId;
        const resultBadge = m.result ? (won ? 'W' : 'L') : '?';
        const badgeColor = m.result ? (won ? 'text-green-400' : 'text-red-400') : 'text-slate-400';

        return (
          <button
            key={m.matchId}
            onClick={() => selectMatch(i)}
            className={`text-left px-3 py-3 border-b border-slate-800 hover:bg-slate-800 transition-colors ${
              i === currentMatchIndex ? 'bg-slate-800 border-l-2 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">Game {i + 1}</span>
              <span className={`text-sm font-bold ${badgeColor}`}>{resultBadge}</span>
            </div>
            <div className="text-slate-400 text-xs mt-0.5 truncate">
              vs {opponent?.playerName ?? 'Unknown'}
            </div>
            <div className="text-slate-500 text-xs">{m.steps.length} steps</div>
          </button>
        );
      })}
    </div>
  );
}
