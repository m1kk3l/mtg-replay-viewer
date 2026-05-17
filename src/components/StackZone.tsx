import type { CardInstance } from '../types/game';
import { CardImage } from './CardImage';

interface Props {
  cards: CardInstance[];
}

export function StackZone({ cards }: Props) {
  return (
    <div className="bg-purple-950/30 border border-purple-700/50 rounded-lg p-2 flex flex-col min-h-[72px] shrink-0">
      <div className="text-purple-400 text-xs font-medium mb-1">
        Stack {cards.length > 0 ? `(${cards.length})` : ''}
      </div>
      {cards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-purple-900 text-xs">—</div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {[...cards].reverse().map((c, i) => (
            <div key={c.instanceId} className="flex items-center gap-2">
              <span className="text-purple-400 text-xs w-3 shrink-0">{i + 1}.</span>
              <CardImage
                grpId={c.grpId}
                fallbackLabel={c.cardTypes[0]?.replace('CardType_', '') ?? '?'}
                className="w-[60px] h-[84px] object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
