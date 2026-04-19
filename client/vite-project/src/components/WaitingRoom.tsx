import { useEffect, useState } from "react";
import { socket } from "../socket/client";
import { SOCKET_EVENTS } from "../socket/events";

type WaitingRoomProps = {
  roomId: string;
  players: string[];
  isAdmin: boolean;
  canStart: boolean;
  isSubmitting: boolean;
  error: string;
  onStartGame: () => void;
};

function WaitingRoom({
  roomId,
  players,
  isAdmin,
  canStart,
  isSubmitting,
  error,
  onStartGame,
}: WaitingRoomProps) {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    const onGameStarting = () => {
      setCountdown(5);
    };

    socket.on(SOCKET_EVENTS.GAME_STARTING, onGameStarting);

    return () => {
      socket.off(SOCKET_EVENTS.GAME_STARTING, onGameStarting);
    };
  }, []);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      // Timer finished, wait for GAME_READY event from server
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  if (countdown !== null) {
    return (
      <section className="lobby-shell">
        <h1>Game Starting In...</h1>
        <p className="countdown">{countdown}</p>
      </section>
    );
  }

  return (
    <section className="lobby-shell">
      <h1>Waiting Room</h1>
      <p className="room-code">Room Code: {roomId}</p>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="panel">
        <h2>Players</h2>
        <ul className="players-list">
          {players.map((player) => (
            <li key={player}>{player}</li>
          ))}
        </ul>

        {isAdmin ? (
          <button
            type="button"
            onClick={onStartGame}
            disabled={!canStart || isSubmitting}
          >
            {isSubmitting ? "Pending..." : "Start Game"}
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
