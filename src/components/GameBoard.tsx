import type { ReplayStep, ParsedMatch } from '../types/game';
import { PlayerInfo } from './PlayerInfo';
import { HandZone } from './HandZone';
import { BattlefieldZone } from './BattlefieldZone';
import { GraveyardZone } from './GraveyardZone';
import { StackZone } from './StackZone';

interface Props {
  step: ReplayStep;
  match: ParsedMatch;
}

export function GameBoard({ step, match }: Props) {
  const { gameState } = step;
  const { turnInfo, players, battlefieldByOwner, handByOwner, graveyardByOwner, stackObjects } = gameState;

  const localSeat = match.localSeatId;
  const opponentSeat = match.players.find(p => p.systemSeatId !== localSeat)?.systemSeatId ?? 1;

  // Merge player names from match metadata into gameState players
  const enrichedPlayers = players.map(p => ({
    ...p,
    playerName: match.players.find(mp => mp.systemSeatId === p.systemSeatId)?.playerName ?? p.playerName,
  }));

  const localPlayer = enrichedPlayers.find(p => p.systemSeatId === localSeat);
  const opponentPlayer = enrichedPlayers.find(p => p.systemSeatId === opponentSeat);

  const localBf = battlefieldByOwner[localSeat] ?? [];
  const oppBf = battlefieldByOwner[opponentSeat] ?? [];
  const localHand = handByOwner[localSeat] ?? [];
  const oppHand = handByOwner[opponentSeat] ?? [];
  const localGy = graveyardByOwner[localSeat] ?? [];
  const oppGy = graveyardByOwner[opponentSeat] ?? [];

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-950 min-h-0">
      {/* Opponent */}
      {opponentPlayer && (
        <PlayerInfo
          player={opponentPlayer}
          isActive={turnInfo.activePlayer === opponentSeat}
          hasPriority={turnInfo.priorityPlayer === opponentSeat}
          isOpponent
        />
      )}

      {/* Opponent hand (face-down) */}
      <HandZone cards={oppHand} faceUp={false} count={opponentPlayer?.handSize} />

      {/* Battlefield area */}
      <div className="flex flex-1 gap-2 px-2 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 gap-2 min-h-0">
          <BattlefieldZone cards={oppBf} label="Opponent's battlefield" />
          <div className="border-t border-slate-700/50" />
          <BattlefieldZone cards={localBf} label="Your battlefield" />
        </div>

        {/* Side panel */}
        <div className="w-32 flex flex-col gap-2 shrink-0">
          {stackObjects.length > 0 && <StackZone cards={stackObjects} />}
          <div className="flex gap-1">
            {oppGy.length >= 0 && (
              <GraveyardZone cards={oppGy} label={`${opponentPlayer?.playerName ?? 'Opponent'}'s Graveyard`} />
            )}
          </div>
          <div className="flex gap-1">
            {localGy.length >= 0 && (
              <GraveyardZone cards={localGy} label={`${localPlayer?.playerName ?? 'You'}'s Graveyard`} />
            )}
          </div>
        </div>
      </div>

      {/* Local player hand (face-up) */}
      <HandZone cards={localHand} faceUp />

      {/* Local player info */}
      {localPlayer && (
        <PlayerInfo
          player={localPlayer}
          isActive={turnInfo.activePlayer === localSeat}
          hasPriority={turnInfo.priorityPlayer === localSeat}
          isOpponent={false}
        />
      )}
    </div>
  );
}
