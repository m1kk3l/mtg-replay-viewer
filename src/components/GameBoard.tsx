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
      {/* Center column: info bars + fixed-height battlefields + hand */}
      <div className="flex flex-col flex-1 min-w-0">
        {opponentPlayer && (
          <PlayerInfo
            player={opponentPlayer}
            isActive={turnInfo.activePlayer === opponentSeat}
            hasPriority={turnInfo.priorityPlayer === opponentSeat}
            isOpponent
          />
        )}

        {/* Opponent battlefield — fixed height */}
        <div className="shrink-0 h-[340px] px-4 pt-3">
          <BattlefieldZone cards={oppBf} label={`${oppName}'s Field`} isOpponent />
        </div>

        {/* Local battlefield — fixed height */}
        <div className="shrink-0 h-[340px] px-4 py-3">
          <BattlefieldZone cards={localBf} label={`${localName}'s Field`} />
        </div>

        {localPlayer && (
          <PlayerInfo
            player={localPlayer}
            isActive={turnInfo.activePlayer === localSeat}
            hasPriority={turnInfo.priorityPlayer === localSeat}
            isOpponent={false}
          />
        )}

        {/* Full-width hand at bottom — flex-1 fills remaining vertical space */}
        <div className="flex-1 min-h-[160px]">
          <HandZone cards={localHand} faceUp />
        </div>
      </div>

      {/* Right column: opponent hand counter + card preview pane + stack + graveyards */}
      <div className="w-[360px] shrink-0 flex flex-col border-l border-slate-800 bg-slate-950">
        {/* Opp hand strip (compact card backs) */}
        <div className="shrink-0 h-[80px] border-b border-slate-800">
          <HandZone cards={oppHand} faceUp={false} count={opponentPlayer?.handSize} />
        </div>

        {/* Large card preview — takes most of the right column */}
        <div className="flex-1 min-h-0 p-2">
          <CardPreviewPane />
        </div>

        {/* Stack + graveyards strip */}
        <div className="shrink-0 h-[200px] border-t border-slate-800 p-2 flex gap-2">
          <div className="w-[100px] shrink-0">
            <StackZone cards={stackObjects} />
          </div>
          <div className="flex-1 min-w-0">
            <GraveyardZone cards={oppGy} label={`${oppName}'s Graveyard`} shortLabel={oppName} />
          </div>
          <div className="flex-1 min-w-0">
            <GraveyardZone cards={localGy} label={`${localName}'s Graveyard`} shortLabel={localName} />
          </div>
        </div>
      </div>
    </div>
  );
}
