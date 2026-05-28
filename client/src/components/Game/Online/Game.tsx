import { useEffect, useState } from 'react';
import LobbyPage from '../../LobbyPage/LobbyPage';
import WaitingRoom from '../../WaitingRoom/WaitingRoom';
import ErrorModal from '../../ErrorModal/ErrorModal';
import OnlineBoggle from '../../Boggle/Online/Boggle';
import OnlineRoundResultModal from '../../RoundResultModal/Online/RoundResultModal';
import { socket } from '../../../socket/client';
import { SOCKET_EVENTS } from '../../../socket/events';
import type {
  ErrorPayload,
  LobbyUpdatedPayload,
  RoundResultPayload,
  RoundStartPayload,
  RoomJoinedPayload,
  PlayerLeftPayload,
  LobbyPlayer,
} from '../../../types/payload';
import { ToastContainer, toast } from 'react-toastify';
import type { ScoringType } from '../../../types/payload';
import '../index.css';
import { generateRoomCode } from '../../../utils/game';
import Header from '../../Header/Header';

const searchParams = new URLSearchParams(window.location.search);

function OnlineGame() {
  const [isWaitingRoom, setIsWaitingRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [canStart, setCanStart] = useState(false);
  const [error, setError] = useState('');
  const [isWaitingOnGame, setIsWaitingOnGame] = useState(false);
  const [totalRounds, setTotalRounds] = useState(0);
  const [showServerErrorModal, setShowServerErrorModal] = useState(false);
  const [gameInfo, setGameInfo] = useState<RoundStartPayload | null>(null);
  const [roundResult, setRoundResult] = useState<RoundResultPayload | null>(null);
  const [isAdvancingRound, setIsAdvancingRound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState({
    join: false,
    create: false,
    startGame: false,
  });

  const roomCode = searchParams.get('room') ?? '';

  useEffect(() => {
    const onRoomJoined = (payload: RoomJoinedPayload) => {
      setRoomId(payload.roomId);
      setIsAdmin(payload.isAdmin);
      setIsWaitingOnGame(payload.waitingOnGame);
      setTotalRounds(payload.totalRounds);
      setIsWaitingRoom(true);
      setError('');
      setIsSubmitting({
        join: false,
        create: false,
        startGame: false,
      });

      searchParams.delete('room');
      const newUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, '', newUrl);
    };

    const onLobbyUpdated = (payload: LobbyUpdatedPayload) => {
      setRoomId(payload.roomId);
      setPlayers(payload.players);
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
      setIsAdvancingRound(false);
      setIsWaitingOnGame(false);
    };

    const onPlayerLeft = ({ name, reason }: PlayerLeftPayload) => {
      toast.info(`${name} has ${reason === 'left' ? 'left the room' : 'disconnected'}.`);
    };

    const onError = (payload: ErrorPayload) => {
      if (payload?.type === 'form_error') {
        setError(payload.message || 'Something went wrong.');
        setIsSubmitting({
          join: false,
          create: false,
          startGame: false,
        });
        setIsAdvancingRound(false);
        return;
      }

      setShowServerErrorModal(true);
      setIsSubmitting({
        join: false,
        create: false,
        startGame: false,
      });
      setIsAdvancingRound(false);
    };

    const onWarning = (payload: ErrorPayload) => {
      toast.warning(payload.message, {
        position: 'bottom-right',
        hideProgressBar: false,
      });
    };

    socket.on(SOCKET_EVENTS.ROOM_JOINED, onRoomJoined);
    socket.on(SOCKET_EVENTS.LOBBY_UPDATED, onLobbyUpdated);
    socket.on(SOCKET_EVENTS.ROUND_START, onRoundStart);
    socket.on(SOCKET_EVENTS.ROUND_RESULT, onRoundResult);
    socket.on(SOCKET_EVENTS.PLAYER_LEFT, onPlayerLeft);
    socket.on(SOCKET_EVENTS.ERROR_EVENT, onError);
    socket.on(SOCKET_EVENTS.WARNING_EVENT, onWarning);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_JOINED, onRoomJoined);
      socket.off(SOCKET_EVENTS.LOBBY_UPDATED, onLobbyUpdated);
      socket.off(SOCKET_EVENTS.ROUND_START, onRoundStart);
      socket.off(SOCKET_EVENTS.ROUND_RESULT, onRoundResult);
      socket.off(SOCKET_EVENTS.PLAYER_LEFT, onPlayerLeft);
      socket.off(SOCKET_EVENTS.ERROR_EVENT, onError);
      socket.off(SOCKET_EVENTS.WARNING_EVENT, onWarning);
    };
  }, []);

  const handleJoin = ({ name, roomCode }: { name: string; roomCode: string }) => {
    const trimmedName = name.trim();
    const trimmedRoomCode = roomCode.trim().toUpperCase();

    if (!trimmedName || !trimmedRoomCode) {
      setError('Player name and room code are required.');
      return;
    }

    setError('');
    setIsSubmitting((prev) => ({ ...prev, join: true }));

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
      setError('Player name is required.');
      return;
    }

    if (!Number.isFinite(sanitizedRounds) || sanitizedRounds < 1) {
      setError('Rounds must be a valid number.');
      return;
    }

    const createdRoomCode = generateRoomCode();

    setError('');
    setIsSubmitting((prev) => ({ ...prev, create: true }));

    socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
      roomId: createdRoomCode,
      playerName: trimmedName,
      create: true,
      totalRounds: sanitizedRounds,
      ...(scoringType === 'equal' ? { scoringParams: {} } : {}),
    });
  };

  const handleStartGame = () => {
    if (!isAdmin || !roomId) return;

    setError('');
    setIsSubmitting((prev) => ({ ...prev, startGame: true }));
    socket.emit(SOCKET_EVENTS.START_GAME, { roomId });
  };

  const handleNextRound = () => {
    if (!roundResult || !gameInfo || !isAdmin || roundResult.round >= gameInfo.totalRounds) {
      return;
    }

    setError('');
    setIsAdvancingRound(true);
    socket.emit(SOCKET_EVENTS.BEGIN_ROUND, { roomId });
  };

  return (
    <>
      <Header />
      <main className="app">
        {gameInfo !== null ? (
          <>
            <OnlineBoggle
              key={`${roomId}-${gameInfo.round}`}
              roomId={roomId}
              round={gameInfo.round}
              totalRounds={gameInfo.totalRounds}
              board={gameInfo.board}
              scoringParams={gameInfo.scoringParams}
              expiresAt={gameInfo.expiresAt}
            />
          </>
        ) : isWaitingRoom ? (
          <WaitingRoom
            roomId={roomId}
            players={players}
            isAdmin={isAdmin}
            canStart={canStart}
            isSubmitting={isSubmitting.startGame}
            isGameInProgress={isWaitingOnGame}
            onStartGame={handleStartGame}
          />
        ) : (
          <LobbyPage
            isJoinSubmitting={isSubmitting.join}
            isCreateSubmitting={isSubmitting.create}
            controlledRoomCode={roomCode}
            onJoin={handleJoin}
            onCreate={handleCreate}
          />
        )}
        {error && <div className="error-display">{error}</div>}
      </main>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        theme="colored"
      />
      {showServerErrorModal ? <ErrorModal onRefresh={() => window.location.reload()} /> : null}
      {roundResult !== null ? (
        <OnlineRoundResultModal
          roundResult={roundResult}
          roomId={roomId}
          totalRounds={totalRounds}
          isAdmin={isAdmin}
          isAdvancing={isAdvancingRound}
          onNextRound={handleNextRound}
        />
      ) : null}
    </>
  );
}

export default OnlineGame;
