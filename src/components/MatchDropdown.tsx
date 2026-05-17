import { useState, useEffect, useRef } from 'react';
import { useReplayStore } from '../store/replayStore';

export function MatchDropdown() {
  const { matches, currentMatchIndex, selectMatch } = useReplayStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [open]);

  if (matches.length <= 1) return null;

  const current = matches[currentMatchIndex];
  const currentOpp = current?.players.find(p => p.systemSeatId !== current.localSeatId);

  return (
    <div ref={ref} className="relative shrink-0 border-b border-slate-700">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800 transition-colors"
      >
        <div className="min-w-0">
          <div className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">
            Matches ({matches.length})
          </div>
          <div className="text-white text-sm font-medium truncate">
            Game {currentMatchIndex + 1} · vs {currentOpp?.playerName ?? '?'}
          </div>
        </div>
        <span className={`text-slate-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-30 bg-slate-900 border border-slate-700 border-t-0 max-h-[400px] overflow-y-auto shadow-xl">
          {matches.map((m, i) => {
            const opp = m.players.find(p => p.systemSeatId !== m.localSeatId);
            const won = m.result?.winningSeatId === m.localSeatId;
            const badge = m.result ? (won ? 'W' : 'L') : '?';
            const color = m.result ? (won ? 'text-green-400' : 'text-red-400') : 'text-slate-400';
            return (
              <button
                key={m.matchId}
                onClick={() => { selectMatch(i); setOpen(false); }}
                className={`w-full text-left px-3 py-2 border-b border-slate-800 hover:bg-slate-800 transition-colors ${
                  i === currentMatchIndex ? 'bg-slate-800 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">Game {i + 1}</span>
                  <span className={`text-sm font-bold ${color}`}>{badge}</span>
                </div>
                <div className="text-slate-400 text-xs truncate">
                  vs {opp?.playerName ?? '?'} · {m.steps.length} steps
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
