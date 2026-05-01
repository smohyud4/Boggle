import { useMemo, useState } from "react";
import type { RoundResultPayload } from "../../types/payload";
import RoundResultCard from "./RoundResultCard";
import "./RoundResultModal.css";

type LeaderboardEntry = {
  playerId: string;
  name: string;
  totalScore: number;
};

type LeaderBoardProps = {
  entries: LeaderboardEntry[];
  onRefresh: () => void;
};

function LeaderBoard({ entries, onRefresh }: LeaderBoardProps) {
  return (
    <section className="leaderboard">
      <header className="leaderboard__header">
        <div>
          <p className="result-modal__eyebrow">Final ranking</p>
          <h3>LeaderBoard</h3>
        </div>
      </header>

      <ol className="leaderboard__list">
        {entries.map((entry, index) => (
          <li key={entry.playerId} className="leaderboard__row">
            <span className="leaderboard__rank">{index + 1}</span>
            <span className="leaderboard__name">{entry.name}</span>
            <span className="leaderboard__score">{entry.totalScore}</span>
          </li>
        ))}
      </ol>

      <footer className="leaderboard__footer">
        <button type="button" onClick={onRefresh}>
          Refresh Page
        </button>
      </footer>
    </section>
  );
}

type RoundResultModalProps = {
  roundResult: RoundResultPayload;
  totalRounds: number;
  isAdmin: boolean;
  isAdvancing: boolean;
  onNextRound: () => void;
};

function RoundResultModal({
  roundResult,
  totalRounds,
  isAdmin,
  isAdvancing,
  onNextRound,
}: RoundResultModalProps) {
  const hasMoreRounds = roundResult.round < totalRounds;
  const [showingLeaderboard, setShowingLeaderboard] = useState(false);

  const leaderboardEntries = useMemo(
    () =>
      [...roundResult.results].sort(
        (left, right) =>
          right.totalScore - left.totalScore ||
          left.name.localeCompare(right.name),
      ),
    [roundResult.results],
  );

  const handleRefresh = () => {
    window.location.reload();
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
          <LeaderBoard entries={leaderboardEntries} onRefresh={handleRefresh} />
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
            <p className="result-modal__eyebrow">
              Round {roundResult.round} complete
            </p>
            <h2 id="round-result-title">
              {hasMoreRounds ? "Round Results" : "Final Results"}
            </h2>
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
              {isAdvancing ? "Starting next round..." : "Next Round"}
            </button>
          ) : (
            !hasMoreRounds && (
              <button type="button" onClick={() => setShowingLeaderboard(true)}>
                Show Results
              </button>
            )
          )}
        </footer>
      </section>
    </div>
  );
}

export default RoundResultModal;
