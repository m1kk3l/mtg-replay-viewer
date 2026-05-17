export type ZoneType =
  | 'ZoneType_Hand'
  | 'ZoneType_Library'
  | 'ZoneType_Battlefield'
  | 'ZoneType_Graveyard'
  | 'ZoneType_Exile'
  | 'ZoneType_Stack'
  | 'ZoneType_Sideboard'
  | 'ZoneType_Limbo'
  | 'ZoneType_Command';

export interface CardInstance {
  instanceId: number;
  grpId: number;
  zoneId: number;
  ownerSeatId: number;
  controllerSeatId: number;
  cardTypes: string[];
  isTapped: boolean;
  power?: number;
  toughness?: number;
  counters: Record<string, number>;
  isAttacking: boolean;
  name?: string;
}

export interface Zone {
  zoneId: number;
  type: ZoneType;
  ownerSeatId?: number;
  objectInstanceIds: number[];
}

export interface PlayerState {
  systemSeatId: number;
  playerName: string;
  lifeTotal: number;
  handSize: number;
  librarySize: number;
}

export interface TurnInfo {
  turnNumber: number;
  phase: string;
  step?: string;
  activePlayer: number;
  priorityPlayer?: number;
}

export interface AnnotationDetail {
  key: string;
  type: string;
  valueInt32?: number[];
  valueString?: string[];
}

export interface Annotation {
  id: number;
  affectorId?: number;
  affectedIds: number[];
  type: string[];
  details?: AnnotationDetail[];
}

export interface GameState {
  gameStateId: number;
  turnInfo: TurnInfo;
  players: PlayerState[];
  zones: Map<number, Zone>;
  gameObjects: Map<number, CardInstance>;
  annotations: Annotation[];
  battlefieldByOwner: Record<number, CardInstance[]>;
  handByOwner: Record<number, CardInstance[]>;
  graveyardByOwner: Record<number, CardInstance[]>;
  exileObjects: CardInstance[];
  stackObjects: CardInstance[];
  zoneTypeMap: Map<number, ZoneType>;
}

export interface ReplayStep {
  stepIndex: number;
  turnNumber: number;
  phase: string;
  step?: string;
  label: string;
  gameState: GameState;
  eventsSinceLastStep: Annotation[];
}

export interface MatchPlayer {
  systemSeatId: number;
  playerName: string;
}

export interface ParsedMatch {
  matchId: string;
  players: MatchPlayer[];
  localSeatId: number;
  steps: ReplayStep[];
  grpIds: Set<number>;
  result?: { winningSeatId: number; reason: string };
  startedAt: string;
}

export interface WorkerProgress {
  type: 'progress';
  pct: number;
}

export interface WorkerDone {
  type: 'done';
  matches: SerializableMatch[];
}

export interface WorkerError {
  type: 'error';
  message: string;
}

export type WorkerMessage = WorkerProgress | WorkerDone | WorkerError;

// Serializable version for postMessage (Maps converted to arrays)
export interface SerializableGameState {
  gameStateId: number;
  turnInfo: TurnInfo;
  players: PlayerState[];
  zones: [number, Zone][];
  gameObjects: [number, CardInstance][];
  annotations: Annotation[];
  battlefieldByOwner: Record<number, CardInstance[]>;
  handByOwner: Record<number, CardInstance[]>;
  graveyardByOwner: Record<number, CardInstance[]>;
  exileObjects: CardInstance[];
  stackObjects: CardInstance[];
  zoneTypeMap: [number, ZoneType][];
}

export interface SerializableStep {
  stepIndex: number;
  turnNumber: number;
  phase: string;
  step?: string;
  label: string;
  gameState: SerializableGameState;
  eventsSinceLastStep: Annotation[];
}

export interface SerializableMatch {
  matchId: string;
  players: MatchPlayer[];
  localSeatId: number;
  steps: SerializableStep[];
  grpIds: number[];
  result?: { winningSeatId: number; reason: string };
  startedAt: string;
}
