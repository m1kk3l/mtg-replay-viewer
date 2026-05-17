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

  const oppName = opponentPlayer?.playerName ?? 'Opponent';
  const localName = localPlayer?.playerName ?? 'You';

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-950 min-h-0">
      {/* Opponent header */}
      {opponentPlayer && (
        <PlayerInfo
          player={opponentPlayer}
          isActive={turnInfo.activePlayer === opponentSeat}
          hasPriority={turnInfo.priorityPlayer === opponentSeat}
          isOpponent
        />
      )}
      <HandZone cards={oppHand} faceUp={false} count={opponentPlayer?.handSize} />

      {/* Board area: battlefields + right panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden gap-2 px-2 py-1">

        {/* Battlefields — each half takes 50% and scrolls internally so divider never moves */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <BattlefieldZone cards={oppBf} label="Opponent's battlefield" isOpponent />
          </div>
          <div className="border-t border-slate-600/60 shrink-0" />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <BattlefieldZone cards={localBf} label="Your battlefield" />
          </div>
        </div>

        {/* Right panel: stack + graveyards — always visible */}
        <div className="w-28 sm:w-36 flex flex-col gap-2 shrink-0 overflow-y-auto">
          <StackZone cards={stackObjects} />
          <div className="flex flex-col gap-1.5 flex-1">
            <GraveyardZone
              cards={oppGy}
              label={`${oppName}'s Graveyard`}
              shortLabel={oppName}
            />
            <GraveyardZone
              cards={localGy}
              label={`${localName}'s Graveyard`}
              shortLabel={localName}
            />
          </div>
        </div>
      </div>

      {/* Local player hand + info */}
      <HandZone cards={localHand} faceUp />
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
