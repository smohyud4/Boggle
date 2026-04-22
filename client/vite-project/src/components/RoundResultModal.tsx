import type { RoundResultPayload } from "../types/payload";

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
          <p className="result-modal__meta">
            Ended by {roundResult.reason.replace("_", " ")}
          </p>
        </header>

        <div className="result-modal__body">
          {roundResult.results.map((player) => (
            <article key={player.playerId} className="result-card">
              <div className="result-card__topline">
                <h3>{player.name}</h3>
                <span>{player.points} points</span>
              </div>
              <p className="result-card__score">
                Total score: {player.totalScore}
              </p>
              <div>
                <h4>Accepted words</h4>
                {player.acceptedWords.length > 0 ? (
                  <ul className="word-list">
                    {player.acceptedWords.map((word) => (
                      <li key={word}>{word}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted-text">No accepted words this round.</p>
                )}
              </div>
            </article>
          ))}
        </div>

        <footer className="result-modal__footer">
          {hasMoreRounds ? (
            isAdmin ? (
              <button
                type="button"
                onClick={onNextRound}
                disabled={isAdvancing}
              >
                {isAdvancing ? "Starting next round..." : "Next Round"}
              </button>
            ) : (
              <p className="muted-text">
                Waiting for the lobby admin to continue.
              </p>
            )
          ) : (
            <p className="muted-text">The game has ended.</p>
          )}
        </footer>
      </section>
    </div>
  );
}

export default RoundResultModal;
