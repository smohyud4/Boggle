import { useState } from 'react';
import type { RoundResultPayload } from '../../types/payload';
import RoundResultCard from './RoundResultCard';
import './RoundResultModal.css';
import { socket } from '../../socket/client';
import { SOCKET_EVENTS } from '../../socket/events';
import LeaderBoard from '../Leaderboard/Leaderboard';

type RoundResultModalProps = {
  roundResult: RoundResultPayload;
  roomId: string;
  totalRounds: number;
  isAdmin: boolean;
  isAdvancing: boolean;
  onNextRound: () => void;
};

function RoundResultModal({
  roundResult,
  roomId,
  totalRounds,
  isAdmin,
  isAdvancing,
  onNextRound,
}: RoundResultModalProps) {
  const hasMoreRounds = roundResult.round < totalRounds;
  const [showingLeaderboard, setShowingLeaderboard] = useState(false);

  const leaderboardEntries = roundResult.results;

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleRestartGame = () => {
    socket.emit(SOCKET_EVENTS.RESTART_GAME, { roomId });
  };

  if (showingLeaderboard) {
    return (
      <div className="modal-backdrop">
        <section
          className="result-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="round-result-title"
        >
          <LeaderBoard
            entries={leaderboardEntries}
            onRefresh={handleRefresh}
            onStartNewGame={handleRestartGame}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <section
        className="result-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="round-result-title"
      >
        <header className="result-modal__header">
          <div>
            <p className="result-modal__eyebrow">Round {roundResult.round} complete</p>
            <h2 id="round-result-title">Round Results</h2>
          </div>
        </header>

        <div className="result-modal__body">
          {roundResult.results.map((player) => (
            <RoundResultCard key={player.playerId} player={player} />
          ))}
        </div>

        <footer className="result-modal__footer">
          {hasMoreRounds && isAdmin ? (
            <button type="button" onClick={onNextRound} disabled={isAdvancing}>
              {isAdvancing ? 'Starting next round...' : 'Next Round'}
            </button>
          ) : (
            !hasMoreRounds && (
              <button type="button" onClick={() => setShowingLeaderboard(true)}>
                Show Final Results
              </button>
            )
          )}
        </footer>
      </section>
    </div>
  );
}

export default RoundResultModal;
