import type { RoundResultPlayerPayload } from '../../../types/payload';
import RoundResultCard from '../RoundResultCard';
import { ExternalLink } from 'lucide-react';
import '../index.css';
import { generateGameId, share } from '../../../utils/share';
import { encode } from '../../../utils/game';

type RoundResultModalProps = {
  player: RoundResultPlayerPayload;
  dimension: number;
  gameId: string | null;
  board: string[];
  onNextRound: () => void;
};

function LocalRoundResultModal({
  player,
  dimension,
  gameId,
  board,
  onNextRound,
}: RoundResultModalProps) {
  const handleShare = () => {
    let result;

    if (gameId !== null) {
      result = `Boggle ${dimension}x${dimension} #${gameId}\nScore: ${player.points}`;
      share(result);
      return;
    }

    const id = generateGameId();
    result = `Boggle ${dimension}x${dimension} #${id}\nScore: ${player.points}`;
    const shareURL = `${window.location.origin}?board=${encode(board)}&id=${id}`;

    share(result, shareURL);
  };

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
            <h2 id="round-result-title">Round Over</h2>
          </div>
        </header>

        <div className="result-modal__body">
          <RoundResultCard player={player} />
        </div>

        <footer className="result-modal__footer">
          <button type="button" className="local-action" onClick={onNextRound}>
            Play Again
          </button>
          <button type="button" className="local-action" onClick={() => handleShare()}>
            {gameId === null ? 'Challenge' : 'Share'}
            <ExternalLink />
          </button>
        </footer>
      </section>
    </div>
  );
}

export default LocalRoundResultModal;
