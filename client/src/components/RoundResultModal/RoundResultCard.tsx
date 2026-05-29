import type { RoundResultPlayerPayload } from '../../types/payload';
import './index.css';

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
      </div>

      <div className="result-card__section">
        <div className="result-card__section-header">
          <h4>Unique words</h4>
          <span className="result-card__word-count">{player.acceptedWords.length}</span>
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
