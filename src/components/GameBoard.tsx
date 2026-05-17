import type { ReplayStep, ParsedMatch } from '../types/game';
import { PlayerInfo } from './PlayerInfo';
import { HandZone } from './HandZone';
import { BattlefieldZone } from './BattlefieldZone';
import { GraveyardZone } from './GraveyardZone';
import { StackZone } from './StackZone';
import { CardPreviewPane } from './CardImage';

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
    <div className="flex flex-1 min-h-0 bg-slate-950 overflow-hidden">
      {/* LEFT: main play area — MTGO classic layout */}
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        {opponentPlayer && (
          <PlayerInfo
            player={opponentPlayer}
            isActive={turnInfo.activePlayer === opponentSeat}
            hasPriority={turnInfo.priorityPlayer === opponentSeat}
            isOpponent
          />
        )}
        <HandZone cards={oppHand} faceUp={false} count={opponentPlayer?.handSize} />

        <div className="px-2 py-1 flex flex-col gap-1">
          <BattlefieldZone cards={oppBf} isOpponent />
          <div className="border-t-2 border-slate-600/80 shrink-0 my-1" />
          <BattlefieldZone cards={localBf} />
        </div>

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

      {/* RIGHT: MTGO-style sidebar with card preview + zones */}
      <div className="w-48 sm:w-60 flex flex-col gap-2 shrink-0 border-l border-slate-800 bg-slate-950 p-2 overflow-y-auto">
        <CardPreviewPane />
        <StackZone cards={stackObjects} />
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
  );
}
