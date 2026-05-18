import { useState } from 'react';
import { useCardImage } from '../hooks/useCardImage';
import { useCardCacheStore } from '../store/cardCacheStore';
import { useHoverStore } from '../store/hoverStore';

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
  isToken?: boolean;
  power?: number;
  toughness?: number;
}

export function CardImage({ grpId, className = '', isTapped = false, isAttacking = false, showTooltip = true, fallbackLabel, isToken = false, power, toughness }: Props) {
  const { imageUrl, name, loading } = useCardImage(grpId);
  const failed = useCardCacheStore(s => s.hasFailed(grpId));
  const setHovered = useHoverStore(s => s.setHovered);
  const [imgError, setImgError] = useState(false);

  const tiltClass = isTapped ? 'rotate-90 origin-center' : '';
  const attackClass = isAttacking ? 'ring-2 ring-red-400' : '';

  function handleMouseEnter() {
    if (!showTooltip || !grpId) return;
    setHovered(grpId);
  }

  function handleMouseLeave() {
    if (!showTooltip) return;
    setHovered(null);
  }

  // Tokens get a distinctive fallback (Scryfall arena_id usually doesn't match)
  if (isToken && (imgError || failed || !imageUrl)) {
    return (
      <div
        className={`rounded flex flex-col items-center justify-center text-center p-1 bg-gradient-to-br from-amber-800/60 to-amber-950/80 border-2 border-double border-amber-600/80 ${tiltClass} ${attackClass} ${className}`}
        style={{ minWidth: 40, minHeight: 55 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="text-amber-300 text-[10px] font-bold uppercase tracking-wider">Token</span>
        <span className="text-amber-100 text-[9px] mt-0.5">{fallbackLabel ?? 'Creature'}</span>
        {(power !== undefined || toughness !== undefined) && (
          <span className="text-white text-sm font-bold mt-1">{power ?? '?'}/{toughness ?? '?'}</span>
        )}
      </div>
    );
  }

  if (grpId === 0 || imgError || failed) {
    const label = name ?? fallbackLabel ?? '?';
    const { bg, border, text, icon } = fallbackStyle(label);
    return (
      <div
        className={`rounded flex flex-col items-center justify-center text-center p-0.5 ${tiltClass} ${attackClass} ${bg} ${border} ${className}`}
        style={{ minWidth: 40, minHeight: 55 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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

export function CardPreviewPane() {
  const grpId = useHoverStore(s => s.grpId);
  const card = useCardCacheStore(s => (grpId ? s.getCard(grpId) : null));

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 h-full flex items-center justify-center overflow-hidden">
      {!card ? (
        <span className="text-slate-600 text-sm italic">Hover a card</span>
      ) : card.largeImageUrl ? (
        <img src={card.largeImageUrl} alt={card.name} className="rounded max-h-full max-w-full object-contain" />
      ) : (
        <div className="w-full max-w-[80%] aspect-[5/7] bg-slate-800 rounded flex flex-col items-center justify-center text-slate-400 text-xs p-2 text-center">
          <span className="font-semibold">{card.name}</span>
          {card.typeLine && <span className="text-slate-500 mt-1">{card.typeLine}</span>}
        </div>
      )}
    </div>
  );
}
