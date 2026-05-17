import type { CardInstance } from '../types/game';
import { CardImage } from './CardImage';

interface Props {
  cards: CardInstance[];
}

export function StackZone({ cards }: Props) {
  if (cards.length === 0) return null;

  return (
    <div className="bg-purple-950/30 border border-purple-700/50 rounded-lg p-2">
      <div className="text-purple-400 text-xs mb-1 font-medium">Stack ({cards.length})</div>
      <div className="flex flex-col gap-1">
        {[...cards].reverse().map((c, i) => (
          <div key={c.instanceId} className="flex items-center gap-2">
            <span className="text-purple-400 text-xs">{i + 1}.</span>
            <CardImage grpId={c.grpId} className="w-[36px] h-[50px] object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
