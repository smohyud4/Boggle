import type { RoundResultPlayerPayload } from '../../../types/payload';
import RoundResultCard from '../RoundResultCard';
import '../index.css';

type RoundResultModalProps = {
  player: RoundResultPlayerPayload;
  onNextRound: () => void;
};

function LocalRoundResultModal({ player, onNextRound }: RoundResultModalProps) {
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
          <button type="button" onClick={onNextRound}>
            Play Again
          </button>
        </footer>
      </section>
    </div>
  );
}

export default LocalRoundResultModal;
