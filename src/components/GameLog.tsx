import { useMemo, useRef, useEffect } from 'react';
import type { ParsedMatch, Annotation, ReplayStep, CardInstance, Zone } from '../types/game';
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

function tokenName(obj: CardInstance | undefined): string {
  if (!obj) return 'something';
  const subs = obj.cardTypes.includes('CardType_Creature') ? 'creature token' : 'token';
  if (obj.power !== undefined || obj.toughness !== undefined) {
    return `${obj.power ?? '?'}/${obj.toughness ?? '?'} ${subs}`;
  }
  return subs;
}

function describeEvent(
  ann: Annotation,
  gameObjects: Map<number, CardInstance>,
  zones: Map<number, Zone>,
  getCardName: (g?: number) => string,
  getPlayerName: (seatId?: number) => string,
): { text: string; color: string } | null {
  const type = ann.type[0] ?? '';

  const lookupCardLabel = (instId?: number): { label: string; controller?: number } => {
    if (!instId) return { label: 'a card' };
    const obj = gameObjects.get(instId);
    if (!obj) return { label: 'a card' };
    if (obj.objectType === 'GameObjectType_Token') {
      return { label: tokenName(obj), controller: obj.controllerSeatId || obj.ownerSeatId };
    }
    const grpName = obj.grpId ? getCardName(obj.grpId) : null;
    return {
      label: grpName ?? (obj.cardTypes[0]?.replace('CardType_', '') ?? 'a card'),
      controller: obj.controllerSeatId || obj.ownerSeatId,
    };
  };

  switch (type) {
    case 'AnnotationType_ZoneTransfer': {
      const category = ann.details?.find(d => d.key === 'category')?.valueString?.[0] ?? '';
      const cardId = ann.affectedIds?.[0];
      const { label, controller } = lookupCardLabel(cardId);

      // Resolve the acting player: use card controller, fall back to destination zone's owner,
      // then source zone's owner (for hidden cards in opponent's hand), then affectorId
      const destZoneId = ann.details?.find(d => d.key === 'zone_dest')?.valueInt32?.[0];
      const srcZoneId = ann.details?.find(d => d.key === 'zone_src')?.valueInt32?.[0];
      const destOwner = destZoneId !== undefined ? zones.get(destZoneId)?.ownerSeatId : undefined;
      const srcOwner = srcZoneId !== undefined ? zones.get(srcZoneId)?.ownerSeatId : undefined;
      const seat = controller ?? destOwner ?? srcOwner ?? ann.affectorId;
      const player = getPlayerName(seat);

      switch (category) {
        case 'CastSpell':    return { text: `${player} casts ${label}`, color: 'text-yellow-300' };
        case 'PlayLand':     return { text: `${player} plays ${label}`, color: 'text-green-400' };
        case 'Resolve':      return { text: `${label} resolves`, color: 'text-slate-300' };
        case 'Draw':         return { text: `${player} draws a card`, color: 'text-blue-300' };
        case 'Discard':      return { text: `${player} discards ${label}`, color: 'text-orange-300' };
        case 'Destroy':      return { text: `${label} is destroyed`, color: 'text-red-400' };
        case 'Sacrifice':    return { text: `${player} sacrifices ${label}`, color: 'text-orange-300' };
        case 'Exile':        return { text: `${label} is exiled`, color: 'text-orange-400' };
        case 'Counter':      return { text: `${label} is countered`, color: 'text-purple-300' };
        case 'Return':       return { text: `${label} returns to hand`, color: 'text-blue-300' };
        case 'PutOnBattlefield': return { text: `${label} enters the battlefield`, color: 'text-green-300' };
        case 'Mill':         return { text: `${player} mills ${label}`, color: 'text-slate-400' };
        case 'PutOnTopOfLibrary':    return { text: `${label} → top of library`, color: 'text-slate-400' };
        case 'PutOnBottomOfLibrary': return { text: `${label} → bottom of library`, color: 'text-slate-400' };
        default:
          if (category) return { text: `${player}: ${category} ${label}`, color: 'text-slate-400' };
          return null;
      }
    }
    case 'AnnotationType_DamageDealt': {
      const damage = ann.details?.find(d => d.key === 'damage')?.valueInt32?.[0] ?? '?';
      const recipientId = ann.affectedIds?.[0];
      // recipient may be a player seat id (1/2) or a creature instance id
      let target: string;
      if (recipientId === 1 || recipientId === 2) {
        target = getPlayerName(recipientId);
      } else {
        const { label } = lookupCardLabel(recipientId);
        target = label;
      }
      const { label: source } = lookupCardLabel(ann.affectorId);
      return { text: `${source} deals ${damage} to ${target}`, color: 'text-red-300' };
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
    case 'AnnotationType_Attacker': {
      const cardId = ann.affectedIds?.[0];
      const { label, controller } = lookupCardLabel(cardId);
      const player = getPlayerName(controller);
      return { text: `${player} attacks with ${label}`, color: 'text-red-400' };
    }
    case 'AnnotationType_Blocker': {
      const cardId = ann.affectedIds?.[0];
      const { label, controller } = lookupCardLabel(cardId);
      const player = getPlayerName(controller);
      return { text: `${player} blocks with ${label}`, color: 'text-blue-400' };
    }
    case 'AnnotationType_NewTurnStarted': return null; // turn header is handled separately
    case 'AnnotationType_PhaseOrStepModified': return null; // phase header is handled separately
    default: return null;
  }
}

export function GameLog({ match, currentStepIndex }: Props) {
  // Subscribe to the cards map so the log re-renders when Scryfall populates names
  const cards = useCardCacheStore(s => s.cards);
  const validSeats = new Set(match.players.map(p => p.systemSeatId));

  const getPlayerName = (seatId?: number) => {
    if (seatId === undefined || !validSeats.has(seatId)) return 'A player';
    return match.players.find(p => p.systemSeatId === seatId)?.playerName ?? `Player ${seatId}`;
  };

  const entries = useMemo<LogEntry[]>(() => {
    const out: LogEntry[] = [];
    let lastTurn = -1, lastPhase = '', lastStep = '';
    let inDeclareAttack = false;
    let attackersThisCombat = false;
    let combatActivePlayer: number | undefined;
    const last = Math.min(currentStepIndex, match.steps.length - 1);
    const getCardName = (g?: number) => (g ? cards.get(g)?.name ?? `Card #${g}` : 'a card');

    function maybeEmitNoAttackers(stepObj: ReplayStep) {
      if (inDeclareAttack && !attackersThisCombat) {
        out.push({
          kind: 'event',
          text: `${getPlayerName(combatActivePlayer)} declared no attackers`,
          color: 'text-slate-500',
        });
      }
      inDeclareAttack = false;
      void stepObj;
    }

    for (let i = 0; i <= last; i++) {
      const step = match.steps[i];
      const t = step.gameState.turnInfo.turnNumber;
      const p = step.gameState.turnInfo.phase;
      const s = step.gameState.turnInfo.step ?? '';
      const active = step.gameState.turnInfo.activePlayer;

      if (t !== lastTurn) {
        out.push({ kind: 'turn', text: `Turn ${t} — ${getPlayerName(active)}` });
        lastTurn = t; lastPhase = ''; lastStep = '';
      }
      if (p && `${p}|${s}` !== `${lastPhase}|${lastStep}`) {
        // Detect transition out of DeclareAttack without any attackers
        if (lastStep === 'Step_DeclareAttack' && s !== 'Step_DeclareAttack') {
          maybeEmitNoAttackers(step);
        }
        const phaseLabel = PHASE_LABELS[p] ?? p.replace('Phase_', '');
        const stepLabel = s ? `: ${STEP_LABELS[s] ?? s.replace('Step_', '')}` : '';
        out.push({ kind: 'phase', text: `${phaseLabel}${stepLabel}` });

        if (s === 'Step_DeclareAttack') {
          inDeclareAttack = true;
          attackersThisCombat = false;
          combatActivePlayer = active;
        }

        lastPhase = p; lastStep = s;
      }

      // Process annotations for this step
      const gameObjectsMap = new Map(step.gameState.gameObjects);
      const zonesMap = new Map(step.gameState.zones);
      for (const ann of step.eventsSinceLastStep) {
        if (ann.type.includes('AnnotationType_Attacker')) attackersThisCombat = true;
        const desc = describeEvent(ann, gameObjectsMap, zonesMap, getCardName, getPlayerName);
        if (desc) out.push({ kind: 'event', text: desc.text, color: desc.color });
      }
    }
    return out;
  }, [match, currentStepIndex, cards]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries.length]);

  return (
    <div className="h-full w-full flex flex-col bg-slate-900 overflow-hidden">
      <div className="shrink-0 px-3 py-2 border-b border-slate-700">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Game Log</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-1 text-xs leading-snug">
        {entries.map((e, i) => {
          if (e.kind === 'turn')  return <div key={i} className="text-yellow-400 font-semibold mt-2 pt-1 border-t border-slate-700 px-1">━ {e.text} ━</div>;
          if (e.kind === 'phase') return <div key={i} className="text-slate-500 text-[10px] uppercase tracking-wide mt-1 px-1">{e.text}</div>;
          return <div key={i} className={`pl-3 py-0.5 ${e.color ?? 'text-slate-300'}`}>· {e.text}</div>;
        })}
      </div>
    </div>
  );
}
