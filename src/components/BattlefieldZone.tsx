import type { CardInstance } from '../types/game';
import { CardImage } from './CardImage';

interface Props {
  cards: CardInstance[];
  label?: string;
  isOpponent?: boolean;
}

export function BattlefieldZone({ cards, label, isOpponent = false }: Props) {
  const lands = cards.filter(c => c.cardTypes.includes('CardType_Land'));
  const creatures = cards.filter(c => c.cardTypes.includes('CardType_Creature') && !c.cardTypes.includes('CardType_Land'));
  const others = cards.filter(c => !c.cardTypes.includes('CardType_Land') && !c.cardTypes.includes('CardType_Creature'));

  return (
    <div className="h-full bg-slate-900/40 border border-slate-700/50 rounded-lg p-2">
      {label && <div className="text-slate-500 text-xs mb-1">{label}</div>}
      {cards.length === 0 ? (
        <div className="text-slate-600 text-xs text-center mt-8">Empty battlefield</div>
      ) : (
        <div className="flex flex-col gap-1">
          {/* Opponent: lands → others → creatures (mirrored). Local: creatures → others → lands */}
          {(isOpponent ? [
            { key: 'lands', els: lands },
            { key: 'others', els: others },
            { key: 'creatures', els: creatures },
          ] : [
            { key: 'creatures', els: creatures },
            { key: 'others', els: others },
            { key: 'lands', els: lands },
          ]).map(({ key, els }) => els.length > 0 && (
            <div key={key} className="flex flex-wrap gap-1">
              {els.map(c => (
                <div key={c.instanceId} className="relative">
                  <CardImage
                    grpId={c.grpId}
                    isTapped={c.isTapped}
                    isAttacking={c.isAttacking}
                    fallbackLabel={c.cardTypes[0]?.replace('CardType_', '') ?? '?'}
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
          ))}
        </div>
      )}
    </div>
  );
}
