import { useEffect, useState } from 'react';
import { socket } from '../../socket/client';
import { SOCKET_EVENTS } from '../../socket/events';
import { Flip, toast } from 'react-toastify';
import { Check, Copy, Star } from 'lucide-react';
import type { LobbyPlayer } from '../../types/payload';
import './WaitingRoom.css';

type WaitingRoomProps = {
  roomId: string;
  players: LobbyPlayer[];
  isAdmin: boolean;
  canStart: boolean;
  isSubmitting: boolean;
  onStartGame: () => void;
};

function ToastComponent() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}
    >
      <span>Code Copied</span>
      <Check />
    </div>
  );
}

function WaitingRoom({
  roomId,
  players,
  isAdmin,
  canStart,
  isSubmitting,
  onStartGame,
}: WaitingRoomProps) {
  const [countdown, setCountdown] = useState(false);
  const notify = () => {
    toast(<ToastComponent />, {
      className: 'copy-toast',
      position: 'bottom-center',
      autoClose: 2000,
      pauseOnHover: false,
      transition: Flip,
    });
  };

  useEffect(() => {
    const onGameStarting = () => {
      setCountdown(true);
    };

    socket.on(SOCKET_EVENTS.GAME_STARTING, onGameStarting);

    return () => {
      socket.off(SOCKET_EVENTS.GAME_STARTING, onGameStarting);
    };
  }, []);

  if (countdown) {
    return (
      <section className="starting-shell">
        <div className="loader-container">
          {Array.from({ length: 16 }).map((_, index) => (
            <span key={index} className="loader" />
          ))}
        </div>
        <h2>Game is Starting...</h2>
      </section>
    );
  }

  return (
    <section className="waiting-shell">
      <div className="code-container">
        <div className="room-code">
          Room Code: <span>{roomId}</span>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(roomId);
                notify();
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (err) {
                toast.error('Failed to copy room code');
              }
            }}
          >
            <Copy className="copy-icon" />
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Players</h2>
        <ul className="players-list">
          {players.map((player) => (
            <li key={player.id}>
              {player.name}
              {player.isAdmin && <Star className="star-icon" />}
            </li>
          ))}
        </ul>

        {isAdmin ? (
          <button
            type="button"
            onClick={onStartGame}
            className={`start-game ${!canStart || isSubmitting ? 'disabled' : ''}`}
            disabled={!canStart || isSubmitting}
          >
            {isSubmitting ? 'Pending...' : 'Start Game'}
          </button>
        ) : (
          <p className="waiting-text">Waiting for admin to start...</p>
        )}

        {isAdmin && !canStart ? (
          <p className="waiting-text">Need at least 2 players to start.</p>
        ) : null}
      </div>
    </section>
  );
}

export default WaitingRoom;
