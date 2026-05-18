import type { CardInstance } from '../types/game';
import { CardImage } from './CardImage';

interface Props {
  cards: CardInstance[];
}

export function StackZone({ cards }: Props) {
  return (
    <div className="bg-purple-950/30 border border-purple-700/50 rounded-lg p-3 flex flex-col h-full overflow-hidden">
      <div className="text-purple-300 text-sm font-semibold mb-2 shrink-0">
        Stack {cards.length > 0 ? `(${cards.length})` : ''}
      </div>
      {cards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-purple-900 text-xs">— empty —</div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-wrap gap-3 overflow-y-auto justify-center content-start">
          {[...cards].reverse().map((c, i) => (
            <div key={c.instanceId} className="relative flex flex-col items-center">
              <span className="absolute -top-2 -left-2 z-10 bg-purple-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <CardImage
                grpId={c.grpId}
                fallbackLabel={c.cardTypes[0]?.replace('CardType_', '') ?? '?'}
                className="w-[100px] h-[140px] object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
