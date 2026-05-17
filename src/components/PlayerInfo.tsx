import type { PlayerState } from '../types/game';

interface Props {
  player: PlayerState;
  isActive: boolean;
  hasPriority: boolean;
  isOpponent: boolean;
}

export function PlayerInfo({ player, isActive, hasPriority, isOpponent }: Props) {
  return (
    <div className={`flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-1.5 sm:py-2 ${isActive ? 'bg-yellow-900/30 border border-yellow-600/50' : 'bg-slate-800/50'}`}>
      <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
        {hasPriority && <span className="text-yellow-400 text-xs font-bold shrink-0">⚡</span>}
        <span className="text-white font-semibold text-xs sm:text-sm truncate">{player.playerName}</span>
        {isOpponent && <span className="text-slate-500 text-xs hidden sm:inline">(Opponent)</span>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-red-400 text-lg sm:text-xl font-bold">{player.lifeTotal}</span>
        <span className="text-slate-500 text-xs">♥</span>
      </div>
      <div className="flex gap-2 sm:gap-3 text-xs text-slate-400 shrink-0">
        <span title="Cards in hand">✋ {player.handSize}</span>
        <span title="Cards in library">📚 {player.librarySize}</span>
      </div>
    </div>
  );
}
