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
}

export function CardImage({ grpId, className = '', isTapped = false, isAttacking = false, showTooltip = true, fallbackLabel }: Props) {
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
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 flex flex-col">
      <div className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">Preview</div>
      {!card ? (
        <div className="flex-1 flex items-center justify-center text-slate-600 text-xs italic min-h-[200px]">
          Hover any card
        </div>
      ) : (
        <>
          {card.largeImageUrl ? (
            <img src={card.largeImageUrl} alt={card.name} className="rounded w-full" />
          ) : (
            <div className="aspect-[5/7] w-full bg-slate-800 rounded flex items-center justify-center text-slate-500 text-xs">
              No image
            </div>
          )}
          <div className="mt-2 px-1">
            <p className="text-white text-sm font-semibold leading-tight">{card.name}</p>
            {card.typeLine && <p className="text-slate-400 text-[11px] mt-0.5">{card.typeLine}</p>}
            {card.oracleText && (
              <p className="text-slate-300 text-[11px] mt-1 whitespace-pre-wrap leading-snug">
                {card.oracleText}
              </p>
            )}
            {(card.power || card.toughness) && (
              <p className="text-slate-200 text-xs font-bold mt-1">{card.power}/{card.toughness}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
