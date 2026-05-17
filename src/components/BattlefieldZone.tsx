import type { CardInstance } from '../types/game';
import { CardImage } from './CardImage';
import { useElementSize } from '../hooks/useElementSize';

interface Props {
  cards: CardInstance[];
  label?: string;
  isOpponent?: boolean;
  isActive?: boolean;
}

const MAX_CARD_W = 140;
const MIN_CARD_W = 36;
const ASPECT = 7 / 5; // height = width * 7/5
const GAP = 4;

export function BattlefieldZone({ cards, label, isOpponent = false, isActive = false }: Props) {
  const [ref, size] = useElementSize<HTMLDivElement>();

  const lands = cards.filter(c => c.cardTypes.includes('CardType_Land'));
  const creatures = cards.filter(c => c.cardTypes.includes('CardType_Creature') && !c.cardTypes.includes('CardType_Land'));
  const others = cards.filter(c => !c.cardTypes.includes('CardType_Land') && !c.cardTypes.includes('CardType_Creature'));

  const rows = (isOpponent
    ? [{ key: 'lands', els: lands }, { key: 'others', els: others }, { key: 'creatures', els: creatures }]
    : [{ key: 'creatures', els: creatures }, { key: 'others', els: others }, { key: 'lands', els: lands }]
  ).filter(r => r.els.length > 0);

  // Compute uniform card size that fits all rows in the available height + width
  const maxCount = Math.max(1, ...rows.map(r => r.els.length));
  const numRows = Math.max(1, rows.length);
  const availW = Math.max(0, size.width - GAP * (maxCount - 1));
  const cardWByWidth = maxCount > 0 ? availW / maxCount : MAX_CARD_W;
  const availH = Math.max(0, size.height - GAP * (numRows - 1));
  const cardHByHeight = availH / numRows;
  const cardWByHeight = cardHByHeight / ASPECT;
  const cardW = Math.max(MIN_CARD_W, Math.min(MAX_CARD_W, cardWByWidth, cardWByHeight));
  const cardH = cardW * ASPECT;

  return (
    <div className={`border rounded-lg p-2 h-full flex flex-col overflow-hidden transition-colors ${isActive ? 'bg-slate-800/70 border-yellow-700/40' : 'bg-slate-900/40 border-slate-700/50'}`}>
      {label && <div className="text-slate-500 text-xs mb-1 shrink-0">{label}</div>}
      <div ref={ref} className="flex-1 min-h-0 flex flex-col justify-center gap-1">
        {cards.length === 0 ? (
          <div className="text-slate-700 text-xs text-center">—</div>
        ) : (
          rows.map(({ key, els }) => (
            <div key={key} className="flex justify-center items-center" style={{ gap: GAP, height: cardH }}>
              {els.map(c => (
                <div
                  key={c.instanceId}
                  className="relative shrink-0"
                  style={{ width: cardW, height: cardH }}
                >
                  <CardImage
                    grpId={c.grpId}
                    isTapped={c.isTapped}
                    isAttacking={c.isAttacking}
                    fallbackLabel={c.cardTypes[0]?.replace('CardType_', '') ?? '?'}
                    isToken={c.objectType === 'GameObjectType_Token'}
                    power={c.power}
                    toughness={c.toughness}
                    className="w-full h-full object-cover"
                  />
                  {c.isAttacking && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-red-300" />
                  )}
                  {Object.entries(c.counters).map(([type, count]) => (
                    <div key={type} className="absolute -bottom-1 -right-1 bg-slate-800 text-white text-[10px] rounded px-1 border border-slate-500">
                      {count > 1 ? `${count}×` : ''}{type.replace('CounterType_', '')}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
