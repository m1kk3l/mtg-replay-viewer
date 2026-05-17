import type { PlayerState } from '../types/game';

interface Props {
  player: PlayerState;
  isActive: boolean;
  hasPriority: boolean;
  isOpponent: boolean;
}

export function PlayerInfo({ player, isActive, hasPriority, isOpponent }: Props) {
  return (
    <div className={`flex items-center gap-6 px-6 py-3 shrink-0 ${isActive ? 'bg-yellow-900/30 border-y border-yellow-600/50' : 'bg-slate-800/50 border-y border-slate-700/50'}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {hasPriority && <span className="text-yellow-400 text-lg font-bold shrink-0">⚡</span>}
        <span className="text-white font-semibold text-lg truncate">{player.playerName}</span>
        {isOpponent && <span className="text-slate-500 text-sm">(Opponent)</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-red-400 text-3xl font-bold">{player.lifeTotal}</span>
        <span className="text-slate-500 text-base">♥</span>
      </div>
      <div className="flex gap-5 text-sm text-slate-300 shrink-0">
        <span title="Cards in hand">✋ {player.handSize}</span>
        <span title="Cards in library">📚 {player.librarySize}</span>
      </div>
    </div>
  );
}
