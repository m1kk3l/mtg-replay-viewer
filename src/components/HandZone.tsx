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
      <div className="flex items-center justify-center gap-0.5 px-2 py-1 h-full bg-slate-900/30">
        <span className="text-slate-500 text-xs mr-2 shrink-0">Hand: {n}</span>
        {Array.from({ length: Math.min(n, 10) }).map((_, i) => (
          <div
            key={i}
            className="w-[36px] h-[50px] bg-slate-700 rounded border border-slate-500 shrink-0"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1 px-3 py-2 h-full bg-slate-900/30 overflow-x-auto">
      {cards.map(c => (
        <CardImage
          key={c.instanceId}
          grpId={c.grpId}
          fallbackLabel={c.cardTypes[0]?.replace('CardType_', '') ?? '?'}
          className="h-full max-h-[180px] w-auto aspect-[5/7] object-cover hover:-translate-y-3 transition-transform shrink-0"
        />
      ))}
      {cards.length === 0 && <span className="text-slate-600 text-sm">Empty hand</span>}
    </div>
  );
}
