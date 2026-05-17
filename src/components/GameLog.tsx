import { useMemo, useRef, useEffect } from 'react';
import type { ParsedMatch, Annotation } from '../types/game';
import { useCardCacheStore } from '../store/cardCacheStore';

interface Props {
  match: ParsedMatch;
  currentStepIndex: number;
}

interface LogEntry {
  kind: 'turn' | 'phase' | 'event';
  text: string;
  color?: string;
}

const PHASE_LABELS: Record<string, string> = {
  Phase_Beginning: 'Beginning', Phase_Main1: 'Main 1', Phase_Combat: 'Combat',
  Phase_Main2: 'Main 2', Phase_Ending: 'End', Phase_Pregame: 'Pregame',
};

const STEP_LABELS: Record<string, string> = {
  Step_Untap: 'Untap', Step_Upkeep: 'Upkeep', Step_Draw: 'Draw',
  Step_BeginCombat: 'Begin Combat', Step_DeclareAttack: 'Declare Attackers',
  Step_DeclareBlock: 'Declare Blockers', Step_FirstStrikeDamage: 'First Strike Damage',
  Step_CombatDamage: 'Combat Damage', Step_EndCombat: 'End Combat',
  Step_End: 'End Step', Step_Cleanup: 'Cleanup',
};

function describeEvent(
  ann: Annotation,
  getCardName: (g?: number) => string,
  getPlayerName: (seatId?: number) => string,
): { text: string; color: string } | null {
  const type = ann.type[0] ?? '';
  const actor = getPlayerName(ann.affectorId);
  switch (type) {
    case 'AnnotationType_ZoneTransfer': {
      const toZone = ann.details?.find(d => d.key === 'zone_dst')?.valueString?.[0] ?? '';
      const fromZone = ann.details?.find(d => d.key === 'zone_src')?.valueString?.[0] ?? '';
      const cardGrpId = ann.details?.find(d => d.key === 'grpId')?.valueInt32?.[0];
      const name = getCardName(cardGrpId);
      if (toZone.includes('Stack')) return { text: `${actor} cast ${name}`, color: 'text-yellow-300' };
      if (toZone.includes('Battlefield')) return { text: `${name} entered the battlefield`, color: 'text-green-300' };
      if (toZone.includes('Graveyard') && fromZone.includes('Battlefield')) return { text: `${name} was destroyed`, color: 'text-slate-400' };
      if (toZone.includes('Graveyard') && fromZone.includes('Stack')) return { text: `${name} resolved`, color: 'text-slate-400' };
      if (toZone.includes('Graveyard')) return { text: `${name} → graveyard`, color: 'text-slate-500' };
      if (toZone.includes('Exile')) return { text: `${name} exiled`, color: 'text-orange-300' };
      if (toZone.includes('Hand') && fromZone.includes('Library')) return { text: `${actor} drew a card`, color: 'text-blue-300' };
      return null;
    }
    case 'AnnotationType_DamageDealt': {
      const damage = ann.details?.find(d => d.key === 'damage')?.valueInt32?.[0] ?? '?';
      const recipient = getPlayerName(ann.affectedIds?.[0]);
      return { text: `${damage} damage dealt to ${recipient}`, color: 'text-red-300' };
    }
    case 'AnnotationType_ModifiedLife': {
      const life = ann.details?.find(d => d.key === 'life')?.valueInt32?.[0];
      const prev = ann.details?.find(d => d.key === 'prev_life')?.valueInt32?.[0];
      const target = getPlayerName(ann.affectedIds?.[0]);
      if (life !== undefined && prev !== undefined) {
        const delta = life - prev;
        const sign = delta >= 0 ? '+' : '';
        return { text: `${target}: ${prev} → ${life} (${sign}${delta})`, color: delta >= 0 ? 'text-green-300' : 'text-red-300' };
      }
      return null;
    }
    case 'AnnotationType_Attacker': return { text: `${actor} attacks`, color: 'text-red-400' };
    case 'AnnotationType_Blocker':  return { text: `${actor} blocks`,  color: 'text-blue-400' };
    default: return null;
  }
}

export function GameLog({ match, currentStepIndex }: Props) {
  const getCard = useCardCacheStore(s => s.getCard);
  const getPlayerName = (seatId?: number) =>
    seatId ? match.players.find(p => p.systemSeatId === seatId)?.playerName ?? `Player ${seatId}` : 'A player';

  const entries = useMemo<LogEntry[]>(() => {
    const out: LogEntry[] = [];
    let lastTurn = -1, lastPhase = '', lastStep = '';
    const last = Math.min(currentStepIndex, match.steps.length - 1);
    const getCardName = (g?: number) => (g ? getCard(g)?.name ?? `Card #${g}` : 'a card');

    for (let i = 0; i <= last; i++) {
      const step = match.steps[i];
      const t = step.gameState.turnInfo.turnNumber;
      const p = step.gameState.turnInfo.phase;
      const s = step.gameState.turnInfo.step ?? '';

      if (t !== lastTurn) {
        out.push({ kind: 'turn', text: `Turn ${t} — ${getPlayerName(step.gameState.turnInfo.activePlayer)}` });
        lastTurn = t; lastPhase = ''; lastStep = '';
      }
      if (p && `${p}|${s}` !== `${lastPhase}|${lastStep}`) {
        const phaseLabel = PHASE_LABELS[p] ?? p.replace('Phase_', '');
        const stepLabel = s ? `: ${STEP_LABELS[s] ?? s.replace('Step_', '')}` : '';
        out.push({ kind: 'phase', text: `${phaseLabel}${stepLabel}` });
        lastPhase = p; lastStep = s;
      }
      for (const ann of step.eventsSinceLastStep) {
        const desc = describeEvent(ann, getCardName, getPlayerName);
        if (desc) out.push({ kind: 'event', text: desc.text, color: desc.color });
      }
    }
    return out;
  }, [match, currentStepIndex, getCard]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries.length]);

  return (
    <div className="h-full w-full flex flex-col bg-slate-900 border-r border-slate-700 overflow-hidden">
      <div className="shrink-0 px-3 py-2 border-b border-slate-700">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Game Log</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-1 text-xs leading-snug">
        {entries.map((e, i) => {
          if (e.kind === 'turn')  return <div key={i} className="text-yellow-400 font-semibold mt-2 pt-1 border-t border-slate-700 px-1">━ {e.text} ━</div>;
          if (e.kind === 'phase') return <div key={i} className="text-slate-500 text-[10px] uppercase tracking-wide mt-1 px-1">{e.text}</div>;
          return <div key={i} className={`px-2 py-0.5 ${e.color ?? 'text-slate-300'}`}>{e.text}</div>;
        })}
      </div>
    </div>
  );
}
