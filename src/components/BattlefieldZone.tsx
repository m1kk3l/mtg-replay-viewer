import type { CardInstance } from '../types/game';
import { CardImage } from './CardImage';

interface Props {
  cards: CardInstance[];
  label?: string;
}

export function BattlefieldZone({ cards, label }: Props) {
  const lands = cards.filter(c => c.cardTypes.includes('CardType_Land'));
  const creatures = cards.filter(c => c.cardTypes.includes('CardType_Creature') && !c.cardTypes.includes('CardType_Land'));
  const others = cards.filter(c => !c.cardTypes.includes('CardType_Land') && !c.cardTypes.includes('CardType_Creature'));

  return (
    <div className="flex-1 min-h-[140px] bg-slate-900/40 border border-slate-700/50 rounded-lg p-2">
      {label && <div className="text-slate-500 text-xs mb-1">{label}</div>}
      {cards.length === 0 ? (
        <div className="text-slate-600 text-xs text-center mt-8">Empty battlefield</div>
      ) : (
        <div className="flex flex-col gap-1">
          {creatures.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {creatures.map(c => (
                <div key={c.instanceId} className="relative">
                  <CardImage
                    grpId={c.grpId}
                    isTapped={c.isTapped}
                    isAttacking={c.isAttacking}
                    className="w-[52px] h-[72px] object-cover"
                  />
                  {c.isAttacking && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-red-300" />
                  )}
                  {Object.entries(c.counters).map(([type, count]) => (
                    <div key={type} className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-xs rounded px-1 border border-slate-500">
                      {count > 1 ? `${count}×` : ''}{type.replace('CounterType_', '')}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {others.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {others.map(c => (
                <CardImage
                  key={c.instanceId}
                  grpId={c.grpId}
                  isTapped={c.isTapped}
                  className="w-[52px] h-[72px] object-cover"
                />
              ))}
            </div>
          )}
          {lands.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lands.map(c => (
                <CardImage
                  key={c.instanceId}
                  grpId={c.grpId}
                  isTapped={c.isTapped}
                  className="w-[52px] h-[72px] object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
