import type { CardInstance } from '../types/game';
import { CardImage } from './CardImage';

interface Props {
  cards: CardInstance[];
  faceUp: boolean;
  count?: number;
}

export function HandZone({ cards, faceUp, count }: Props) {
  if (!faceUp) {
    const n = count ?? cards.length;
    return (
      <div className="flex items-center gap-1 px-3 py-1 min-h-[40px]">
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="w-[36px] h-[50px] bg-slate-700 rounded border border-slate-500"
          />
        ))}
        {n === 0 && <span className="text-slate-600 text-xs">Empty hand</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-3 py-1 min-h-[60px] flex-wrap">
      {cards.map(c => (
        <CardImage
          key={c.instanceId}
          grpId={c.grpId}
          className="w-[52px] h-[72px] object-cover hover:scale-110 transition-transform"
        />
      ))}
      {cards.length === 0 && <span className="text-slate-600 text-xs">Empty hand</span>}
    </div>
  );
}
