import { AlertCircle } from 'lucide-react';
import './ErrorModal.css';

type Props = {
  message?: string;
  onRefresh: () => void;
};

export default function ErrorModal({ message, onRefresh }: Props) {
  return (
    <div className="error-modal-overlay">
      <div className="error-modal">
        <div className="error-modal-icon">
          <AlertCircle size={48} />
        </div>
        <div className="error-modal-message">
          {message || 'Sorry, an error has occurred on the server'}
        </div>
        <div className="error-modal-actions">
          <button className="error-modal-button" onClick={onRefresh}>
            Refresh page
          </button>
        </div>
      </div>
    </div>
  );
}
