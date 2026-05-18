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
          <BattlefieldZone
            cards={oppBf}
            label={`${oppName}'s Field`}
            isOpponent
            isActive={turnInfo.activePlayer === opponentSeat}
          />
        </div>

        {/* Local battlefield — fixed height */}
        <div className="shrink-0 h-[340px] px-4 py-3">
          <BattlefieldZone
            cards={localBf}
            label={`${localName}'s Field`}
            isActive={turnInfo.activePlayer === localSeat}
          />
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

      {/* Right column: card preview, opp GY (aligned with opp BF), local GY (aligned with local BF), big stack at bottom */}
      <div className="w-[360px] shrink-0 flex flex-col border-l border-slate-800 bg-slate-950 p-2 gap-2">
        {/* Card preview — image only, top of column */}
        <div className="h-[220px] shrink-0">
          <CardPreviewPane />
        </div>

        {/* Opp graveyard — height roughly matching opp BF */}
        <div className="h-[180px] shrink-0">
          <GraveyardZone cards={oppGy} label={`${oppName}'s Graveyard`} shortLabel={oppName} />
        </div>

        {/* Local graveyard — height roughly matching local BF */}
        <div className="h-[180px] shrink-0">
          <GraveyardZone cards={localGy} label={`${localName}'s Graveyard`} shortLabel={localName} />
        </div>

        {/* Big stack at bottom */}
        <div className="flex-1 min-h-0">
          <StackZone cards={stackObjects} />
        </div>

        {/* Opp hand-count badge below stack */}
        <div className="shrink-0 text-slate-500 text-xs px-1 flex items-center gap-2">
          <span>{oppName} hand:</span>
          <span className="text-slate-300 font-semibold">{opponentPlayer?.handSize ?? oppHand.length}</span>
        </div>
      </div>
    </div>
  );
}
