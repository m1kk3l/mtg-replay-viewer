import type { Annotation } from '../types/game';
import { useCardCacheStore } from '../store/cardCacheStore';

interface Props {
  events: Annotation[];
}

function getCardName(grpId: number | undefined): string {
  if (!grpId) return 'Unknown';
  const card = useCardCacheStore.getState().getCard(grpId);
  return card?.name ?? `Card #${grpId}`;
}

function describeAnnotation(ann: Annotation): { text: string; color: string } | null {
  const type = ann.type[0] ?? '';

  switch (type) {
    case 'AnnotationType_NewTurnStarted': {
      const turn = ann.details?.find(d => d.key === 'turnNumber')?.valueInt32?.[0];
      return { text: `─── Turn ${turn ?? '?'} ───`, color: 'text-slate-400' };
    }
    case 'AnnotationType_ZoneTransfer': {
      const fromZone = ann.details?.find(d => d.key === 'zone_src')?.valueString?.[0] ?? '';
      const toZone = ann.details?.find(d => d.key === 'zone_dst')?.valueString?.[0] ?? '';
      const cardGrpId = ann.details?.find(d => d.key === 'grpId')?.valueInt32?.[0];
      const name = cardGrpId ? getCardName(cardGrpId) : 'a card';

      if (toZone.includes('Battlefield')) return { text: `▶ ${name} entered the battlefield`, color: 'text-green-300' };
      if (toZone.includes('Graveyard')) return { text: `✕ ${name} went to graveyard`, color: 'text-slate-400' };
      if (toZone.includes('Exile')) return { text: `◈ ${name} exiled`, color: 'text-orange-300' };
      if (toZone.includes('Hand') && fromZone.includes('Library')) return { text: `✦ Drew a card`, color: 'text-blue-300' };
      if (toZone.includes('Stack')) return { text: `⬆ ${name} cast`, color: 'text-yellow-300' };
      return { text: `→ ${name}: ${fromZone.replace('ZoneType_', '')} → ${toZone.replace('ZoneType_', '')}`, color: 'text-slate-300' };
    }
    case 'AnnotationType_DamageDealt': {
      const damage = ann.details?.find(d => d.key === 'damage')?.valueInt32?.[0] ?? '?';
      return { text: `⚔ ${damage} damage dealt`, color: 'text-red-300' };
    }
    case 'AnnotationType_ModifiedLife': {
      const life = ann.details?.find(d => d.key === 'life')?.valueInt32?.[0];
      const prev = ann.details?.find(d => d.key === 'prev_life')?.valueInt32?.[0];
      if (life !== undefined && prev !== undefined) {
        const delta = life - prev;
        const sign = delta >= 0 ? '+' : '';
        const color = delta >= 0 ? 'text-green-300' : 'text-red-300';
        return { text: `♥ Life: ${prev} → ${life} (${sign}${delta})`, color };
      }
      return null;
    }
    case 'AnnotationType_TappedUntappedPermanent': {
      const tapped = ann.details?.find(d => d.key === 'tapped')?.valueInt32?.[0];
      if (tapped === 1) return { text: `↷ Permanent tapped`, color: 'text-slate-500' };
      if (tapped === 0) return { text: `↺ Permanent untapped`, color: 'text-slate-500' };
      return null;
    }
    case 'AnnotationType_Attacker':
      return { text: `⚔ Attacker declared`, color: 'text-red-400' };
    case 'AnnotationType_Blocker':
      return { text: `🛡 Blocker declared`, color: 'text-blue-400' };
    default:
      return null;
  }
}

export function EventFeed({ events }: Props) {
  const described = events.map(ann => ({ ann, desc: describeAnnotation(ann) })).filter(x => x.desc !== null);

  return (
    <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 max-h-32 overflow-y-auto">
      {described.length === 0 ? (
        <span className="text-slate-600 text-xs">No events this step</span>
      ) : (
        <div className="flex flex-col gap-0.5">
          {described.map(({ ann, desc }, i) => (
            <span key={ann.id ?? i} className={`text-xs ${desc!.color}`}>
              {desc!.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
