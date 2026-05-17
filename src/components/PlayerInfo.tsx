import type { PlayerState } from '../types/game';

interface Props {
  player: PlayerState;
  isActive: boolean;
  hasPriority: boolean;
  isOpponent: boolean;
}

export function PlayerInfo({ player, isActive, hasPriority, isOpponent }: Props) {
  return (
    <div className={`flex items-center gap-4 px-4 py-2 rounded-lg ${isActive ? 'bg-yellow-900/30 border border-yellow-600/50' : 'bg-slate-800/50'}`}>
      <div className="flex items-center gap-2">
        {hasPriority && <span className="text-yellow-400 text-xs font-bold">⚡</span>}
        <span className="text-white font-semibold text-sm">{player.playerName}</span>
        {isOpponent && <span className="text-slate-500 text-xs">(Opponent)</span>}
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <span className="text-red-400 text-xl font-bold">{player.lifeTotal}</span>
        <span className="text-slate-500 text-xs">♥</span>
      </div>
      <div className="flex gap-3 text-xs text-slate-400">
        <span title="Cards in hand">✋ {player.handSize}</span>
        <span title="Cards in library">📚 {player.librarySize}</span>
      </div>
    </div>
  );
}
