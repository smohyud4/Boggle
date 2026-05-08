import type { RoundResultPlayerPayload } from "../../types/payload";
import "./RoundResultModal.css";

type RoundResultCardProps = {
  player: RoundResultPlayerPayload;
};

function RoundResultCard({ player }: RoundResultCardProps) {
  return (
    <article className="result-card">
      <div className="result-card__topline">
        <div>
          <h3>{player.name}</h3>
          <p className="result-card__meta">{player.points} points</p>
        </div>
        <p className="result-card__score">{player.totalScore}</p>
      </div>

      <div className="result-card__section">
        <div className="result-card__section-header">
          <h4>Accepted words</h4>
          <span className="result-card__word-count">
            {player.acceptedWords.length}
          </span>
        </div>

        {player.acceptedWords.length > 0 ? (
          <div className="result-card__accepted-words">
            <ul className="word-list">
              {player.acceptedWords.map((word) => (
                <li key={word}>{word}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="muted-text">No accepted words this round.</p>
        )}
      </div>
    </article>
  );
}

export default RoundResultCard;
