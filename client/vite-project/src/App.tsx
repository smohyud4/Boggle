import { useEffect, useState } from "react";
import LobbyPage from "./components/LobbyPage";
import WaitingRoom from "./components/WaitingRoom";
import Game from "./components/Game";
import RoundResultModal from "./components/RoundResultModal";
import { socket } from "./socket/client";
import { SOCKET_EVENTS } from "./socket/events";
import type {
  BeginRoundPayload,
  ErrorPayload,
  LobbyUpdatedPayload,
  RoundResultPayload,
  RoundStartPayload,
  RoomJoinedPayload,
} from "./types/payload";
import type { FormMode, ScoringType } from "./types/payload";
import "./App.css";

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function App() {
  const [activeMode, setActiveMode] = useState<FormMode>("join");
  const [isWaitingRoom, setIsWaitingRoom] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);
  const [canStart, setCanStart] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameInfo, setGameInfo] = useState<RoundStartPayload | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResultPayload | null>(
    null,
  );
  const [isAdvancingRound, setIsAdvancingRound] = useState(false);

  useEffect(() => {
    const onRoomJoined = (payload: RoomJoinedPayload) => {
      setRoomId(payload.roomId);
      setIsAdmin(payload.isAdmin);
      setIsWaitingRoom(true);
      setError("");
      setIsSubmitting(false);
    };

    const onLobbyUpdated = (payload: LobbyUpdatedPayload) => {
      setRoomId(payload.roomId);
      setPlayers(payload.players.map((player) => player.name));
      setCanStart(payload.canStart);

      const me = payload.players.find((player) => player.id === socket.id);
      if (me) {
        setIsAdmin(me.isAdmin);
      }
    };

    const onRoundStart = (payload: RoundStartPayload) => {
      setRoundResult(null);
      setIsAdvancingRound(false);
      setGameInfo(payload);
    };

    const onRoundResult = (payload: RoundResultPayload) => {
      setRoundResult(payload);
      setIsSubmitting(false);
      setIsAdvancingRound(false);
    };

    const onGameOver = () => {
      setRoundResult(null);
      setIsSubmitting(false);
      setIsAdvancingRound(false);
    };

    const onError = (payload: ErrorPayload) => {
      setError(payload.message || "Something went wrong.");
      setIsSubmitting(false);
      setIsAdvancingRound(false);
    };

    socket.on(SOCKET_EVENTS.ROOM_JOINED, onRoomJoined);
    socket.on(SOCKET_EVENTS.LOBBY_UPDATED, onLobbyUpdated);
    socket.on(SOCKET_EVENTS.ROUND_START, onRoundStart);
    socket.on(SOCKET_EVENTS.ROUND_RESULT, onRoundResult);
    socket.on(SOCKET_EVENTS.GAME_OVER, onGameOver);
    socket.on(SOCKET_EVENTS.ERROR_EVENT, onError);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_JOINED, onRoomJoined);
      socket.off(SOCKET_EVENTS.LOBBY_UPDATED, onLobbyUpdated);
      socket.off(SOCKET_EVENTS.ROUND_START, onRoundStart);
      socket.off(SOCKET_EVENTS.ROUND_RESULT, onRoundResult);
      socket.off(SOCKET_EVENTS.GAME_OVER, onGameOver);
      socket.off(SOCKET_EVENTS.ERROR_EVENT, onError);
    };
  }, []);

  const handleModeChange = (mode: FormMode) => {
    setActiveMode(mode);
    setError("");
    setIsSubmitting(false);
  };

  const handleJoin = ({
    name,
    roomCode,
  }: {
    name: string;
    roomCode: string;
  }) => {
    const trimmedName = name.trim();
    const trimmedRoomCode = roomCode.trim().toUpperCase();

    if (!trimmedName || !trimmedRoomCode) {
      setError("Player name and room code are required.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
      roomId: trimmedRoomCode,
      playerName: trimmedName,
    });
  };

  const handleCreate = ({
    name,
    rounds,
    scoringType,
  }: {
    name: string;
    rounds: number;
    scoringType: ScoringType;
  }) => {
    const trimmedName = name.trim();
    const sanitizedRounds = Math.max(1, Math.floor(rounds));

    if (!trimmedName) {
      setError("Player name is required.");
      return;
    }

    if (!Number.isFinite(sanitizedRounds) || sanitizedRounds < 1) {
      setError("Rounds must be a valid number.");
      return;
    }

    const createdRoomCode = generateRoomCode();

    setError("");
    setIsSubmitting(true);

    socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
      roomId: createdRoomCode,
      playerName: trimmedName,
      create: true,
      totalRounds: sanitizedRounds,
      ...(scoringType === "equal" ? { scoringParams: {} } : {}),
    });
  };

  const handleStartGame = () => {
    if (!isAdmin || !roomId) return;

    setError("");
    setIsSubmitting(true);
    socket.emit(SOCKET_EVENTS.START_GAME, { roomId });
  };

  const handleNextRound = () => {
    if (
      !roundResult ||
      !gameInfo ||
      !isAdmin ||
      roundResult.round >= gameInfo.totalRounds
    ) {
      return;
    }

    const payload: BeginRoundPayload = {
      roomId,
      round: roundResult.round + 1,
    };

    setError("");
    setIsAdvancingRound(true);
    socket.emit(SOCKET_EVENTS.BEGIN_ROUND, payload);
  };

  return (
    <main className="app">
      {gameInfo !== null ? (
        <>
          <Game
            key={`${roomId}-${gameInfo.round}`}
            roomId={roomId}
            round={gameInfo.round}
            totalRounds={gameInfo.totalRounds}
            board={gameInfo.board}
            scoringParams={gameInfo.scoringParams}
            expiresAt={gameInfo.expiresAt}
          />

          {roundResult ? (
            <RoundResultModal
              roundResult={roundResult}
              totalRounds={gameInfo.totalRounds}
              isAdmin={isAdmin}
              isAdvancing={isAdvancingRound}
              onNextRound={handleNextRound}
            />
          ) : null}
        </>
      ) : isWaitingRoom ? (
        <WaitingRoom
          roomId={roomId}
          players={players}
          isAdmin={isAdmin}
          canStart={canStart}
          isSubmitting={isSubmitting}
          error={error}
          onStartGame={handleStartGame}
        />
      ) : (
        <LobbyPage
          activeMode={activeMode}
          error={error}
          isSubmitting={isSubmitting}
          onChangeMode={handleModeChange}
          onJoin={handleJoin}
          onCreate={handleCreate}
        />
      )}
    </main>
  );
}

export default App;
