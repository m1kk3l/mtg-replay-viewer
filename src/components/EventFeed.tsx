import type { Annotation } from '../types/game';
import { useCardCacheStore } from '../store/cardCacheStore';

interface Props {
  events: Annotation[];
  phase: string;
  step?: string;
  activePlayerName: string;
}

function getCardName(grpId: number | undefined): string {
  if (!grpId) return 'a card';
  const card = useCardCacheStore.getState().getCard(grpId);
  return card?.name ?? `Card #${grpId}`;
}

interface EventLine {
  text: string;
  color: string;
  priority: number; // higher = more interesting
}

function describeAnnotation(ann: Annotation): EventLine | null {
  const type = ann.type[0] ?? '';

  switch (type) {
    case 'AnnotationType_NewTurnStarted': {
      const turn = ann.details?.find(d => d.key === 'turnNumber')?.valueInt32?.[0];
      return { text: `─── Turn ${turn ?? '?'} ───`, color: 'text-slate-400', priority: 0 };
    }
    case 'AnnotationType_ZoneTransfer': {
      const toZone = ann.details?.find(d => d.key === 'zone_dst')?.valueString?.[0] ?? '';
      const fromZone = ann.details?.find(d => d.key === 'zone_src')?.valueString?.[0] ?? '';
      const cardGrpId = ann.details?.find(d => d.key === 'grpId')?.valueInt32?.[0];
      const name = getCardName(cardGrpId);

      if (toZone.includes('Stack')) return { text: `⬆ ${name} cast`, color: 'text-yellow-300', priority: 4 };
      if (toZone.includes('Battlefield')) return { text: `▶ ${name} entered the battlefield`, color: 'text-green-300', priority: 3 };
      if (toZone.includes('Graveyard')) return { text: `✕ ${name} → graveyard`, color: 'text-slate-400', priority: 1 };
      if (toZone.includes('Exile')) return { text: `◈ ${name} exiled`, color: 'text-orange-300', priority: 2 };
      if (toZone.includes('Hand') && fromZone.includes('Library')) return { text: `✦ Drew a card`, color: 'text-blue-300', priority: 1 };
      // Skip transfers we can't describe meaningfully
      if (!fromZone && !toZone) return null;
      return { text: `→ ${name}: ${fromZone.replace('ZoneType_', '') || '?'} → ${toZone.replace('ZoneType_', '') || '?'}`, color: 'text-slate-300', priority: 1 };
    }
    case 'AnnotationType_DamageDealt': {
      const damage = ann.details?.find(d => d.key === 'damage')?.valueInt32?.[0] ?? '?';
      return { text: `⚔ ${damage} damage dealt`, color: 'text-red-300', priority: 4 };
    }
    case 'AnnotationType_ModifiedLife': {
      const life = ann.details?.find(d => d.key === 'life')?.valueInt32?.[0];
      const prev = ann.details?.find(d => d.key === 'prev_life')?.valueInt32?.[0];
      if (life !== undefined && prev !== undefined) {
        const delta = life - prev;
        const sign = delta >= 0 ? '+' : '';
        const color = delta >= 0 ? 'text-green-300' : 'text-red-300';
        return { text: `♥ Life: ${prev} → ${life} (${sign}${delta})`, color, priority: 3 };
      }
      return null;
    }
    case 'AnnotationType_TappedUntappedPermanent':
      return null; // too noisy for headline
    case 'AnnotationType_Attacker':
      return { text: `⚔ Attacker declared`, color: 'text-red-400', priority: 3 };
    case 'AnnotationType_Blocker':
      return { text: `🛡 Blocker declared`, color: 'text-blue-400', priority: 3 };
    default:
      return null;
  }
}

const PHASE_LABELS: Record<string, string> = {
  Phase_Beginning: 'Beginning',
  Phase_Main1: 'Main Phase 1',
  Phase_Combat: 'Combat',
  Phase_Main2: 'Main Phase 2',
  Phase_Ending: 'End',
  Phase_Pregame: 'Pregame',
};
const STEP_LABELS: Record<string, string> = {
  Step_Upkeep: 'Upkeep',
  Step_Draw: 'Draw',
  Step_BeginCombat: 'Begin Combat',
  Step_DeclareAttack: 'Declare Attackers',
  Step_DeclareBlock: 'Declare Blockers',
  Step_CombatDamage: 'Combat Damage',
  Step_FirstStrikeDamage: 'First Strike Damage',
  Step_EndCombat: 'End Combat',
  Step_End: 'End Step',
  Step_Cleanup: 'Cleanup',
};

export function EventFeed({ events, phase, step, activePlayerName }: Props) {
  const lines = events
    .map(ann => ({ ann, line: describeAnnotation(ann) }))
    .filter(x => x.line !== null) as { ann: Annotation; line: EventLine }[];

  const headline = [...lines].sort((a, b) => b.line.priority - a.line.priority)[0]?.line ?? null;

  const phaseLabel = step ? `${PHASE_LABELS[phase] ?? phase}: ${STEP_LABELS[step] ?? step}` : (PHASE_LABELS[phase] ?? phase);

  return (
    <div className="bg-slate-950 border-t border-slate-800 flex flex-col shrink-0" style={{ maxHeight: 110 }}>
      {/* What's happening bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-slate-800/60 bg-slate-900/50">
        <span className="text-slate-500 text-xs shrink-0">{phaseLabel} · {activePlayerName}</span>
        {headline ? (
          <span className={`text-xs font-medium truncate ${headline.color}`}>{headline.text}</span>
        ) : (
          <span className="text-slate-600 text-xs italic">—</span>
        )}
      </div>
      {/* Detail list */}
      {lines.length > 0 && (
        <div className="flex gap-3 flex-wrap px-3 py-1.5 overflow-y-auto">
          {lines.map(({ ann, line }, i) => (
            <span key={ann.id ?? i} className={`text-xs ${line.color} shrink-0`}>
              {line.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
