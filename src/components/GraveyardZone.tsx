import { useState } from 'react';
import type { CardInstance } from '../types/game';
import { CardImage } from './CardImage';

interface Props {
  cards: CardInstance[];
  label: string;
}

export function GraveyardZone({ cards, label }: Props) {
  const [open, setOpen] = useState(false);
  const top = cards[cards.length - 1];

  return (
    <div>
      <button
        className="relative w-[52px] h-[72px] rounded border border-slate-600 overflow-hidden hover:border-slate-400 transition-colors"
        onClick={() => setOpen(true)}
        title={`${label} (${cards.length} cards)`}
      >
        {top ? (
          <CardImage grpId={top.grpId} className="w-full h-full object-cover" showTooltip={false} />
        ) : (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
            <span className="text-slate-500 text-xs">GY</span>
          </div>
        )}
        {cards.length > 0 && (
          <div className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-xs px-1 rounded-tl">
            {cards.length}
          </div>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="bg-slate-900 border border-slate-600 rounded-xl p-4 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white font-semibold">{label} ({cards.length})</h3>
              <button className="text-slate-400 hover:text-white" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cards.map(c => (
                <CardImage key={c.instanceId} grpId={c.grpId} className="w-[80px] h-[112px] object-cover" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
