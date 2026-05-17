import type {
  SerializableMatch,
  SerializableStep,
  SerializableGameState,
  Zone,
  ZoneType,
  CardInstance,
  PlayerState,
  TurnInfo,
  Annotation,
} from '../types/game';

interface RawEvent {
  timestamp: string;
  direction: 'server' | 'client';
  raw: Record<string, unknown>;
}

interface MatchAccumulator {
  matchId: string;
  startedAt: string;
  events: RawEvent[];
  roomEvents: Record<string, unknown>[];  // MatchGameRoomStateChangedEvent payloads
}

const CRASH_DUMP_MARKERS = ['[ALLOC_TEMP_TLS]', '[ALLOC_CACHEOBJECTS]', 'Failed Allocations. Bucket layout', 'Peak Allocated memory'];

function isCrashDump(line: string): boolean {
  return CRASH_DUMP_MARKERS.some(m => line.includes(m));
}

function extractTimestamp(line: string): string {
  const m = line.match(/\[UnityCrossThreadLogger\](.+?):/);
  return m ? m[1].trim() : '';
}

function extractMatchId(line: string): string {
  const m = line.match(/Match to ([A-F0-9]+):/i) || line.match(/matchId[:\s]+([A-F0-9-]+)/i);
  return m ? m[1] : '';
}

export function parseLog(
  text: string,
  onProgress: (pct: number) => void,
): SerializableMatch[] {
  const lines = text.split('\n');
  const total = lines.length;
  const matches: SerializableMatch[] = [];
  let current: MatchAccumulator | null = null;
  let i = 0;

  while (i < total) {
    if (i % 1000 === 0) onProgress(Math.round((i / total) * 90));

    const line = lines[i];

    if (isCrashDump(line)) break;

    // Match start: look for first GreToClientEvent after a new matchId context
    if (line.includes('Connecting to matchId') || line.includes('to Match: GreToClientEvent')) {
      const matchId = extractMatchId(line);
      if (matchId && (!current || current.matchId !== matchId)) {
        if (current && current.events.length > 0) {
          const built = buildMatch(current);
          if (built) matches.push(built);
        }
        current = { matchId: matchId || `match_${matches.length}`, startedAt: extractTimestamp(line), events: [], roomEvents: [] };
      }
    }

    // Server event: GreToClientEvent — next line is single-line JSON
    if (line.includes(': GreToClientEvent') && current) {
      const jsonLine = lines[i + 1]?.trim();
      if (jsonLine?.startsWith('{')) {
        try {
          const parsed = JSON.parse(jsonLine) as Record<string, unknown>;
          current.events.push({ timestamp: extractTimestamp(line), direction: 'server', raw: parsed });
          i += 2;
          continue;
        } catch {
          // malformed — skip
        }
      }
    }

    // Client message: pretty-printed multi-line JSON
    if (line.includes(': ClientToGremessage') && current) {
      // Collect lines until we have a balanced JSON object
      let jsonStr = '';
      let depth = 0;
      let j = i + 1;
      while (j < total && j < i + 200) {
        const l = lines[j];
        for (const ch of l) {
          if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }
        jsonStr += l + '\n';
        j++;
        if (depth === 0 && jsonStr.trim().length > 0) break;
      }
      if (jsonStr.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
          current.events.push({ timestamp: extractTimestamp(line), direction: 'client', raw: parsed });
          i = j;
          continue;
        } catch {
          // skip malformed
        }
      }
    }

    // MatchGameRoomStateChangedEvent — collect for player names
    if (line.includes(': MatchGameRoomStateChangedEvent') && current) {
      const jsonLine = lines[i + 1]?.trim();
      if (jsonLine?.startsWith('{')) {
        try {
          const parsed = JSON.parse(jsonLine) as Record<string, unknown>;
          current.roomEvents.push(parsed);
        } catch { /* skip */ }
      }
    }

    // Match end
    if (line.includes('MatchGameRoomStateType_MatchCompleted') && current) {
      const built = buildMatch(current);
      if (built) matches.push(built);
      current = null;
    }

    i++;
  }

  // Finalize any open match
  if (current && current.events.length > 0) {
    const built = buildMatch(current);
    if (built) matches.push(built);
  }

  onProgress(100);
  return matches;
}

function buildMatch(acc: MatchAccumulator): SerializableMatch | null {
  const greEvents = acc.events
    .filter(e => e.direction === 'server')
    .map(e => e.raw);

  const connectRespMsg = findConnectResp(greEvents);
  // systemSeatIds is on the message wrapper, not inside connectResp
  const seatIds = connectRespMsg?.systemSeatIds as number[] | undefined;
  const localSeatId = seatIds?.[0] ?? 1;
  const players = extractPlayers(acc.roomEvents, greEvents);

  const steps = buildSteps(greEvents);
  if (steps.length === 0) return null;

  const grpIds = collectGrpIds(steps);

  const result = extractResult(greEvents);

  return {
    matchId: acc.matchId,
    players,
    localSeatId,
    steps,
    grpIds,
    result,
    startedAt: acc.startedAt,
  };
}

function findConnectResp(events: Record<string, unknown>[]): Record<string, unknown> | null {
  for (const ev of events) {
    const msgs = getGreMessages(ev);
    for (const msg of msgs) {
      if ((msg as Record<string, unknown>).type === 'GREMessageType_ConnectResp') {
        return msg as Record<string, unknown>;
      }
    }
  }
  return null;
}

function getGreMessages(ev: Record<string, unknown>): unknown[] {
  const gre = ev.greToClientEvent as Record<string, unknown> | undefined;
  return (gre?.greToClientMessages as unknown[]) ?? [];
}

function extractPlayers(
  roomEvents: Record<string, unknown>[],
  greEvents: Record<string, unknown>[],
): { systemSeatId: number; playerName: string }[] {
  // Primary: reservedPlayers from MatchGameRoomStateChangedEvent
  for (const ev of roomEvents) {
    const mmrsc = ev.matchGameRoomStateChangedEvent as Record<string, unknown> | undefined;
    if (!mmrsc) continue;
    const gri = mmrsc.gameRoomInfo as Record<string, unknown> | undefined;
    const grc = gri?.gameRoomConfig as Record<string, unknown> | undefined;
    const reserved = grc?.reservedPlayers as Record<string, unknown>[] | undefined;
    if (Array.isArray(reserved) && reserved.length > 0) {
      return reserved.map(p => ({
        systemSeatId: Number(p.systemSeatId ?? p.seatId ?? 0),
        playerName: String(p.playerName ?? p.userId ?? 'Unknown'),
      }));
    }
  }
  // Fallback: player names from GRE GameStateMessage
  for (const ev of greEvents) {
    const msgs = getGreMessages(ev);
    for (const msg of msgs) {
      const m = msg as Record<string, unknown>;
      if (m.type === 'GREMessageType_ConnectResp') {
        const cr = m.connectResp as Record<string, unknown> | undefined;
        const players = cr?.players as Record<string, unknown>[] | undefined;
        if (Array.isArray(players) && players.length > 0) {
          return players.map(p => ({
            systemSeatId: Number(p.systemSeatId ?? p.seatId ?? 0),
            playerName: String(p.playerName ?? `Player ${p.systemSeatId}`),
          }));
        }
      }
    }
  }
  return [
    { systemSeatId: 1, playerName: 'Player 1' },
    { systemSeatId: 2, playerName: 'Player 2' },
  ];
}

function extractResult(events: Record<string, unknown>[]): { winningSeatId: number; reason: string } | undefined {
  for (const ev of events) {
    const msgs = getGreMessages(ev);
    for (const msg of msgs) {
      const m = msg as Record<string, unknown>;
      if (m.type === 'GREMessageType_GameStateMessage') {
        const gsm = m.gameStateMessage as Record<string, unknown> | undefined;
        const gi = gsm?.gameInfo as Record<string, unknown> | undefined;
        if (gi?.stage === 'GameStage_GameOver') {
          const results = gi.results as Record<string, unknown>[] | undefined;
          const win = results?.find(r => r.result === 'ResultType_Win');
          if (win) {
            return {
              winningSeatId: Number(win.winningTeamId ?? 0),
              reason: String(win.reason ?? ''),
            };
          }
        }
      }
    }
  }
  return undefined;
}

// ---- State Reconstruction ----

interface RawGameStateMsg {
  type: string;
  gameStateId: number;
  prevGameStateId?: number;
  turnInfo?: Partial<TurnInfo>;
  players?: RawPlayer[];
  zones?: RawZone[];
  gameObjects?: RawGameObject[];
  annotations?: Annotation[];
  persistentAnnotations?: Annotation[];
  diffDeletedInstanceIds?: number[];
  diffDeletedPersistentAnnotationIds?: number[];
  gameInfo?: Record<string, unknown>;
}

interface RawPlayer {
  systemSeatNumber: number;
  lifeTotal?: number;
  startingLifeTotal?: number;
  maxHandSize?: number;
}

interface RawZone {
  zoneId: number;
  type: ZoneType;
  ownerSeatId?: number;
  objectInstanceIds?: number[];
}

interface RawGameObject {
  instanceId: number;
  grpId?: number;
  zoneId?: number;
  ownerSeatId?: number;
  controllerSeatId?: number;
  type?: string;
  cardTypes?: string[];
  power?: { value?: number };
  toughness?: { value?: number };
  name?: string;
  isTapped?: boolean;
  hasSummoningSickness?: boolean;
  attackState?: string;
}

function buildSteps(events: Record<string, unknown>[]): SerializableStep[] {
  let currentState: SerializableGameState | null = null;
  const steps: SerializableStep[] = [];
  let stepIndex = 0;

  for (const ev of events) {
    const msgs = getGreMessages(ev);
    for (const msg of msgs) {
      const m = msg as Record<string, unknown>;
      if (m.type !== 'GREMessageType_GameStateMessage') continue;
      const gsm = m.gameStateMessage as RawGameStateMsg | undefined;
      if (!gsm) continue;

      if (gsm.type === 'GameStateType_Full') {
        currentState = buildFullState(gsm);
      } else if (gsm.type === 'GameStateType_Diff' && currentState) {
        currentState = applyDiff(currentState, gsm);
      } else {
        continue;
      }

      // Emit step only when phase info is present
      const hasPhase = !!(gsm.turnInfo?.phase);
      const isGameOver = gsm.gameInfo?.stage === 'GameStage_GameOver';
      if (hasPhase || isGameOver) {
        const ti = currentState.turnInfo;
        const label = makeStepLabel(ti);
        const newAnnotations = gsm.annotations ?? [];

        // Recompute derived fields
        recomputeDerived(currentState);

        steps.push({
          stepIndex: stepIndex++,
          turnNumber: ti.turnNumber,
          phase: ti.phase,
          step: ti.step,
          label,
          gameState: structuredCloneState(currentState),
          eventsSinceLastStep: newAnnotations,
        });
      }
    }
  }

  return steps;
}

function buildFullState(gsm: RawGameStateMsg): SerializableGameState {
  const zones: [number, Zone][] = (gsm.zones ?? []).map(z => [z.zoneId, {
    zoneId: z.zoneId,
    type: z.type,
    ownerSeatId: z.ownerSeatId,
    objectInstanceIds: z.objectInstanceIds ?? [],
  }]);

  const zoneTypeMap: [number, ZoneType][] = zones.map(([id, z]) => [id, z.type]);

  const players: PlayerState[] = (gsm.players ?? []).map(p => ({
    systemSeatId: p.systemSeatNumber,
    playerName: `Player ${p.systemSeatNumber}`,
    lifeTotal: p.lifeTotal ?? 20,
    handSize: 0,
    librarySize: 0,
  }));

  const gameObjects: [number, CardInstance][] = (gsm.gameObjects ?? []).map(obj => [obj.instanceId, mapGameObject(obj)]);

  const state: SerializableGameState = {
    gameStateId: gsm.gameStateId,
    turnInfo: {
      turnNumber: gsm.turnInfo?.turnNumber ?? 1,
      phase: gsm.turnInfo?.phase ?? 'Phase_Beginning',
      step: gsm.turnInfo?.step,
      activePlayer: gsm.turnInfo?.activePlayer ?? 1,
      priorityPlayer: gsm.turnInfo?.priorityPlayer,
    },
    players,
    zones,
    gameObjects,
    annotations: gsm.annotations ?? [],
    battlefieldByOwner: {},
    handByOwner: {},
    graveyardByOwner: {},
    exileObjects: [],
    stackObjects: [],
    zoneTypeMap,
  };

  recomputeDerived(state);
  return state;
}

function applyDiff(
  base: SerializableGameState,
  gsm: RawGameStateMsg,
): SerializableGameState {
  // Clone zones and gameObjects shallowly
  const zones = new Map<number, Zone>(base.zones.map(([k, v]) => [k, { ...v, objectInstanceIds: [...v.objectInstanceIds] }]));
  const gameObjects = new Map<number, CardInstance>(base.gameObjects.map(([k, v]) => [k, { ...v, counters: { ...v.counters } }]));
  const players = base.players.map(p => ({ ...p }));
  const zoneTypeMap = new Map<number, ZoneType>(base.zoneTypeMap);

  // Apply zone updates
  for (const z of gsm.zones ?? []) {
    const existing = zones.get(z.zoneId);
    if (existing) {
      existing.objectInstanceIds = z.objectInstanceIds ?? existing.objectInstanceIds;
    } else {
      zones.set(z.zoneId, {
        zoneId: z.zoneId,
        type: z.type,
        ownerSeatId: z.ownerSeatId,
        objectInstanceIds: z.objectInstanceIds ?? [],
      });
      zoneTypeMap.set(z.zoneId, z.type);
    }
  }

  // Delete removed objects
  for (const id of gsm.diffDeletedInstanceIds ?? []) {
    gameObjects.delete(id);
  }

  // Upsert game objects (merge fields)
  for (const obj of gsm.gameObjects ?? []) {
    const existing = gameObjects.get(obj.instanceId);
    if (existing) {
      if (obj.grpId !== undefined) existing.grpId = obj.grpId;
      if (obj.zoneId !== undefined) existing.zoneId = obj.zoneId;
      if (obj.ownerSeatId !== undefined) existing.ownerSeatId = obj.ownerSeatId;
      if (obj.controllerSeatId !== undefined) existing.controllerSeatId = obj.controllerSeatId;
      if (obj.cardTypes !== undefined) existing.cardTypes = obj.cardTypes;
      if (obj.power?.value !== undefined) existing.power = obj.power.value;
      if (obj.toughness?.value !== undefined) existing.toughness = obj.toughness.value;
      if (typeof obj.name === 'string') existing.name = obj.name;
      // MTGA sends tap/attack state directly on the gameObject; only override if explicitly present
      if ('isTapped' in obj) existing.isTapped = obj.isTapped === true;
      if ('attackState' in obj) existing.isAttacking = obj.attackState === 'AttackState_Declared';
    } else {
      gameObjects.set(obj.instanceId, mapGameObject(obj));
    }
  }

  // Update players
  for (const p of gsm.players ?? []) {
    const idx = players.findIndex(pl => pl.systemSeatId === p.systemSeatNumber);
    if (idx !== -1) {
      if (p.lifeTotal !== undefined) players[idx].lifeTotal = p.lifeTotal;
    }
  }

  // Merge turnInfo
  const turnInfo: TurnInfo = { ...base.turnInfo };
  if (gsm.turnInfo) {
    if (gsm.turnInfo.turnNumber !== undefined) turnInfo.turnNumber = gsm.turnInfo.turnNumber;
    if (gsm.turnInfo.phase !== undefined) turnInfo.phase = gsm.turnInfo.phase;
    if (gsm.turnInfo.step !== undefined) turnInfo.step = gsm.turnInfo.step;
    else if (gsm.turnInfo.phase !== undefined) turnInfo.step = undefined; // phase changed, clear step
    if (gsm.turnInfo.activePlayer !== undefined) turnInfo.activePlayer = gsm.turnInfo.activePlayer;
    if (gsm.turnInfo.priorityPlayer !== undefined) turnInfo.priorityPlayer = gsm.turnInfo.priorityPlayer;
  }

  const state: SerializableGameState = {
    gameStateId: gsm.gameStateId,
    turnInfo,
    players,
    zones: [...zones.entries()],
    gameObjects: [...gameObjects.entries()],
    annotations: gsm.annotations ?? [],
    battlefieldByOwner: {},
    handByOwner: {},
    graveyardByOwner: {},
    exileObjects: [],
    stackObjects: [],
    zoneTypeMap: [...zoneTypeMap.entries()],
  };

  recomputeDerived(state);
  return state;
}

function mapGameObject(obj: RawGameObject): CardInstance {
  return {
    instanceId: obj.instanceId,
    grpId: obj.grpId ?? 0,
    zoneId: obj.zoneId ?? 0,
    ownerSeatId: obj.ownerSeatId ?? 0,
    controllerSeatId: obj.controllerSeatId ?? obj.ownerSeatId ?? 0,
    cardTypes: obj.cardTypes ?? [],
    isTapped: obj.isTapped === true,
    power: obj.power?.value,
    toughness: obj.toughness?.value,
    counters: {},
    isAttacking: obj.attackState === 'AttackState_Declared',
    name: typeof obj.name === 'string' ? obj.name : undefined,
  };
}

function recomputeDerived(state: SerializableGameState): void {
  const zoneTypeMap = new Map<number, ZoneType>(state.zoneTypeMap);
  const gameObjectsMap = new Map<number, CardInstance>(state.gameObjects);

  const battlefieldByOwner: Record<number, CardInstance[]> = {};
  const handByOwner: Record<number, CardInstance[]> = {};
  const graveyardByOwner: Record<number, CardInstance[]> = {};
  const exileObjects: CardInstance[] = [];
  const stackObjects: CardInstance[] = [];

  for (const [zoneId, zone] of state.zones) {
    const type = zoneTypeMap.get(zoneId) ?? zone.type;
    for (const instId of zone.objectInstanceIds) {
      const obj = gameObjectsMap.get(instId);
      if (!obj) continue;
      switch (type) {
        case 'ZoneType_Battlefield': {
          // Use controller (so stolen permanents follow the new controller's side)
          const side = obj.controllerSeatId || obj.ownerSeatId;
          if (!battlefieldByOwner[side]) battlefieldByOwner[side] = [];
          battlefieldByOwner[side].push(obj);
          break;
        }
        case 'ZoneType_Hand': {
          const owner = obj.ownerSeatId;
          if (!handByOwner[owner]) handByOwner[owner] = [];
          handByOwner[owner].push(obj);
          break;
        }
        case 'ZoneType_Graveyard': {
          const owner = obj.ownerSeatId;
          if (!graveyardByOwner[owner]) graveyardByOwner[owner] = [];
          graveyardByOwner[owner].push(obj);
          break;
        }
        case 'ZoneType_Exile':
          exileObjects.push(obj);
          break;
        case 'ZoneType_Stack':
          stackObjects.push(obj);
          break;
      }
    }
  }

  // Update hand/library sizes directly from zone objectInstanceIds counts
  // (opponent hand cards have grpId=0 so they won't be in gameObjects, but the zone count is accurate)
  for (const [zoneId, zone] of state.zones) {
    const type = zoneTypeMap.get(zoneId) ?? zone.type;
    const owner = zone.ownerSeatId;
    if (!owner) continue;
    const player = state.players.find(p => p.systemSeatId === owner);
    if (!player) continue;
    if (type === 'ZoneType_Hand') player.handSize = zone.objectInstanceIds.length;
    if (type === 'ZoneType_Library') player.librarySize = zone.objectInstanceIds.length;
  }

  state.battlefieldByOwner = battlefieldByOwner;
  state.handByOwner = handByOwner;
  state.graveyardByOwner = graveyardByOwner;
  state.exileObjects = exileObjects;
  state.stackObjects = stackObjects;
}

function structuredCloneState(state: SerializableGameState): SerializableGameState {
  return {
    gameStateId: state.gameStateId,
    turnInfo: { ...state.turnInfo },
    players: state.players.map(p => ({ ...p })),
    zones: state.zones.map(([k, v]) => [k, { ...v, objectInstanceIds: [...v.objectInstanceIds] }]),
    gameObjects: state.gameObjects.map(([k, v]) => [k, { ...v, counters: { ...v.counters }, cardTypes: [...v.cardTypes] }]),
    annotations: state.annotations,
    battlefieldByOwner: Object.fromEntries(Object.entries(state.battlefieldByOwner).map(([k, v]) => [k, v.map(o => ({ ...o }))])),
    handByOwner: Object.fromEntries(Object.entries(state.handByOwner).map(([k, v]) => [k, v.map(o => ({ ...o }))])),
    graveyardByOwner: Object.fromEntries(Object.entries(state.graveyardByOwner).map(([k, v]) => [k, v.map(o => ({ ...o }))])),
    exileObjects: state.exileObjects.map(o => ({ ...o })),
    stackObjects: state.stackObjects.map(o => ({ ...o })),
    zoneTypeMap: [...state.zoneTypeMap],
  };
}

function collectGrpIds(steps: SerializableStep[]): number[] {
  const ids = new Set<number>();
  for (const step of steps) {
    for (const [, obj] of step.gameState.gameObjects) {
      if (obj.grpId && obj.grpId > 0) ids.add(obj.grpId);
    }
  }
  return [...ids];
}

function makeStepLabel(ti: TurnInfo): string {
  const phaseLabels: Record<string, string> = {
    Phase_Beginning: 'Beginning',
    Phase_Main1: 'Main 1',
    Phase_Combat: 'Combat',
    Phase_Main2: 'Main 2',
    Phase_Ending: 'End',
    Phase_Pregame: 'Pregame',
  };
  const stepLabels: Record<string, string> = {
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

  const phase = phaseLabels[ti.phase] ?? ti.phase;
  const step = ti.step ? stepLabels[ti.step] ?? ti.step : null;
  const turn = ti.turnNumber > 0 ? `T${ti.turnNumber}` : 'Pre';

  return step ? `${turn} · ${phase}: ${step}` : `${turn} · ${phase}`;
}
