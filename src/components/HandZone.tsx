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
      <div className="flex items-center gap-1 px-3 py-2 h-full bg-slate-900/30">
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="w-[90px] h-[126px] bg-slate-700 rounded border border-slate-500"
          />
        ))}
        {n === 0 && <span className="text-slate-600 text-sm">Empty hand</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2 h-full bg-slate-900/30 overflow-x-auto">
      {cards.map(c => (
        <CardImage
          key={c.instanceId}
          grpId={c.grpId}
          fallbackLabel={c.cardTypes[0]?.replace('CardType_', '') ?? '?'}
          className="w-[110px] h-[154px] object-cover hover:-translate-y-2 transition-transform shrink-0"
        />
      ))}
      {cards.length === 0 && <span className="text-slate-600 text-sm">Empty hand</span>}
    </div>
  );
}
