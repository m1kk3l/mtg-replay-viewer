import { useState } from 'react';
import { useCardImage } from '../hooks/useCardImage';
import type { CachedCard } from '../lib/scryfallCache';
import { useCardCacheStore } from '../store/cardCacheStore';

interface TooltipState {
  card: CachedCard;
  x: number;
  y: number;
}

let tooltipState: ((state: TooltipState | null) => void) | null = null;

export function setTooltip(state: TooltipState | null) {
  tooltipState?.(state);
}

interface Props {
  grpId: number;
  className?: string;
  isTapped?: boolean;
  isAttacking?: boolean;
  showTooltip?: boolean;
}

export function CardImage({ grpId, className = '', isTapped = false, isAttacking = false, showTooltip = true }: Props) {
  const { imageUrl, name, loading } = useCardImage(grpId);
  const getCard = useCardCacheStore(s => s.getCard);
  const [imgError, setImgError] = useState(false);

  const tiltClass = isTapped ? 'rotate-90 origin-center' : '';
  const attackClass = isAttacking ? 'ring-2 ring-red-400' : '';

  function handleMouseEnter(e: React.MouseEvent) {
    if (!showTooltip) return;
    const card = getCard(grpId);
    if (card) {
      tooltipState?.({ card, x: e.clientX, y: e.clientY });
    }
  }

  function handleMouseLeave() {
    tooltipState?.(null);
  }

  if (grpId === 0 || imgError) {
    return (
      <div
        className={`bg-slate-700 rounded border border-slate-500 flex items-center justify-center text-slate-400 text-xs ${className}`}
        style={{ minWidth: 45, minHeight: 63 }}
      >
        {name ?? '?'}
      </div>
    );
  }

  if (loading || !imageUrl) {
    return (
      <div
        className={`bg-slate-800 rounded border border-slate-600 animate-pulse ${className}`}
        style={{ minWidth: 45, minHeight: 63 }}
      />
    );
  }

  return (
    <img
      src={imageUrl}
      alt={name ?? `Card ${grpId}`}
      className={`rounded shadow-md transition-transform ${tiltClass} ${attackClass} ${className}`}
      onError={() => setImgError(true)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      draggable={false}
    />
  );
}

export function CardTooltip() {
  const [tooltip, setTooltipLocal] = useState<TooltipState | null>(null);
  tooltipState = setTooltipLocal;

  if (!tooltip) return null;

  const { card, x, y } = tooltip;
  const left = x + 20;
  const top = Math.max(10, y - 100);

  return (
    <div
      className="fixed z-50 pointer-events-none bg-slate-900 border border-slate-600 rounded-lg shadow-2xl p-2"
      style={{ left, top, maxWidth: 280 }}
    >
      {card.largeImageUrl ? (
        <img src={card.largeImageUrl} alt={card.name} className="rounded w-64" />
      ) : (
        <div className="p-3">
          <p className="text-white font-bold">{card.name}</p>
          <p className="text-slate-400 text-xs mt-1">{card.typeLine}</p>
          {card.oracleText && <p className="text-slate-300 text-xs mt-2">{card.oracleText}</p>}
        </div>
      )}
    </div>
  );
}
