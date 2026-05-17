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
      {/* LEFT/MIDDLE: main play area — fills available width, MTGO order */}
      <div className="flex flex-col flex-1 min-w-0">
        {opponentPlayer && (
          <PlayerInfo
            player={opponentPlayer}
            isActive={turnInfo.activePlayer === opponentSeat}
            hasPriority={turnInfo.priorityPlayer === opponentSeat}
            isOpponent
          />
        )}
        <div className="shrink-0 h-[160px]">
          <HandZone cards={oppHand} faceUp={false} count={opponentPlayer?.handSize} />
        </div>

        {/* Battlefields — split remaining vertical space 50/50 */}
        <div className="flex flex-col flex-1 min-h-0 px-3 gap-1 py-2">
          <div className="flex-1 min-h-0">
            <BattlefieldZone cards={oppBf} isOpponent />
          </div>
          <div className="border-t-2 border-slate-600/80 shrink-0" />
          <div className="flex-1 min-h-0">
            <BattlefieldZone cards={localBf} />
          </div>
        </div>

        <div className="shrink-0 h-[180px]">
          <HandZone cards={localHand} faceUp />
        </div>
        {localPlayer && (
          <PlayerInfo
            player={localPlayer}
            isActive={turnInfo.activePlayer === localSeat}
            hasPriority={turnInfo.priorityPlayer === localSeat}
            isOpponent={false}
          />
        )}
      </div>

      {/* RIGHT: MTGO sidebar — card preview + stack + graveyards */}
      <div className="w-[380px] shrink-0 flex flex-col gap-2 border-l border-slate-800 bg-slate-950 p-3 overflow-hidden">
        <div className="shrink-0">
          <CardPreviewPane />
        </div>
        <div className="shrink-0">
          <StackZone cards={stackObjects} />
        </div>
        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
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
  );
}
