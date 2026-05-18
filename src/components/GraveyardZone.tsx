import { useState } from 'react';
import type { CardInstance } from '../types/game';
import { CardImage } from './CardImage';

interface Props {
  cards: CardInstance[];
  label: string;
  shortLabel: string;
}

export function GraveyardZone({ cards, label, shortLabel }: Props) {
  const [open, setOpen] = useState(false);
  const top = cards[cards.length - 1];

  return (
    <>
      <button
        className="relative w-full h-full rounded border border-slate-600 overflow-hidden hover:border-slate-400 transition-colors flex flex-col bg-slate-900/40"
        onClick={() => setOpen(true)}
        title={`${label} (${cards.length} cards)`}
      >
        <div className="shrink-0 px-2 py-1 text-slate-400 text-xs flex justify-between items-center border-b border-slate-700/50">
          <span className="truncate">{shortLabel}'s GY</span>
          <span className="text-slate-300 font-semibold ml-1">{cards.length}</span>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center p-2 overflow-hidden">
          {top ? (
            <CardImage
              grpId={top.grpId}
              fallbackLabel={top.cardTypes[0]?.replace('CardType_', '') ?? '?'}
              className="w-[105px] h-[147px] object-cover"
              showTooltip={false}
            />
          ) : (
            <span className="text-slate-600 text-xs">empty</span>
          )}
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-600 rounded-xl p-4 max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-semibold">{label} ({cards.length})</h3>
              <button className="text-slate-400 hover:text-white" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cards.map(c => (
                <CardImage
                  key={c.instanceId}
                  grpId={c.grpId}
                  fallbackLabel={c.cardTypes[0]?.replace('CardType_', '') ?? '?'}
                  className="w-[80px] h-[112px] object-cover"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
