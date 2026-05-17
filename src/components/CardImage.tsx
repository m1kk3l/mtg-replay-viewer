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

function fallbackStyle(label: string): { bg: string; border: string; text: string; icon: string } {
  const l = label.toLowerCase();
  if (l.includes('land'))         return { bg: 'bg-amber-900/70',   border: 'border border-amber-700',   text: 'text-amber-200',  icon: '🌲' };
  if (l.includes('creature'))     return { bg: 'bg-red-900/70',     border: 'border border-red-700',     text: 'text-red-200',    icon: '⚔' };
  if (l.includes('planeswalker')) return { bg: 'bg-yellow-800/70',  border: 'border border-yellow-600',  text: 'text-yellow-200', icon: '✦' };
  if (l.includes('instant'))      return { bg: 'bg-blue-900/70',    border: 'border border-blue-700',    text: 'text-blue-200',   icon: '⚡' };
  if (l.includes('sorcery'))      return { bg: 'bg-purple-900/70',  border: 'border border-purple-700',  text: 'text-purple-200', icon: '🌀' };
  if (l.includes('enchantment'))  return { bg: 'bg-green-900/70',   border: 'border border-green-700',   text: 'text-green-200',  icon: '◈' };
  if (l.includes('artifact'))     return { bg: 'bg-slate-600/70',   border: 'border border-slate-400',   text: 'text-slate-200',  icon: '⚙' };
  return                                 { bg: 'bg-slate-700/70',   border: 'border border-slate-500',   text: 'text-slate-300',  icon: '?' };
}

interface Props {
  grpId: number;
  className?: string;
  isTapped?: boolean;
  isAttacking?: boolean;
  showTooltip?: boolean;
  fallbackLabel?: string;
}

export function CardImage({ grpId, className = '', isTapped = false, isAttacking = false, showTooltip = true, fallbackLabel }: Props) {
  const { imageUrl, name, loading } = useCardImage(grpId);
  const failed = useCardCacheStore(s => s.hasFailed(grpId));
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

  if (grpId === 0 || imgError || failed) {
    const label = name ?? fallbackLabel ?? '?';
    const { bg, border, text, icon } = fallbackStyle(label);
    return (
      <div
        className={`rounded flex flex-col items-center justify-center text-center p-0.5 ${tiltClass} ${attackClass} ${bg} ${border} ${className}`}
        style={{ minWidth: 40, minHeight: 55 }}
      >
        <span className="text-lg leading-none">{icon}</span>
        <span className={`text-[9px] font-medium leading-tight mt-0.5 ${text}`}>{label}</span>
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
