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
            {isSubmitting ? "Starting..." : "Start Game"}
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
