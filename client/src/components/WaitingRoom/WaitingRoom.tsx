import { useEffect, useState } from "react";
import { socket } from "../../socket/client";
import { SOCKET_EVENTS } from "../../socket/events";
import "./WaitingRoom.css";
import { Copy, Star } from "lucide-react";
import type { LobbyPlayer } from "../../types/payload";

type WaitingRoomProps = {
  roomId: string;
  players: LobbyPlayer[];
  isAdmin: boolean;
  canStart: boolean;
  isSubmitting: boolean;
  onStartGame: () => void;
};

function WaitingRoom({
  roomId,
  players,
  isAdmin,
  canStart,
  isSubmitting,
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
      <section className="waiting-shell">
        <h1>Game Starting In...</h1>
        <p className="countdown">{countdown}</p>
      </section>
    );
  }
  
  return (
    <section className="waiting-shell">
      <div className="code-container">
        <div className="room-code">
          Room Code: <span>{roomId}</span>
          <button onClick={() => {
            navigator.clipboard.writeText(roomId);
          }}>
            <Copy /> 
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Players</h2>
        <ul className="players-list">
          {players.map((player) => (
            <li key={player.id}>
              {player.name}
              {player.isAdmin && <Star size={20}/>}
            </li>
          ))}
        </ul>

        {isAdmin ? (
          <button
            type="button"
            onClick={onStartGame}
            className={`start-game ${!canStart || isSubmitting ? "disabled" : ""}`}
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
