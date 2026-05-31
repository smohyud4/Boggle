import type { Server, Socket } from 'socket.io';
import { EVENTS } from '../constants/events.js';
import { GAME_CONFIG, GAME_STATUS } from '../constants/config.js';
import { waitingPlayers, games, socketRoomMap } from '../state/store.js';
import { Player } from '../models/Player.js';
import { Game } from '../models/Game.js';
import { normalizeWords } from '../utils/game.js';
import {
  ensureAdmin,
  getAdminPlayer,
  lobbySnapshot,
  shouldCancelInProgressGame,
} from './helpers.js';
import type {
  JoinRoomPayload,
  LeaveRoomPayload,
  StartGamePayload,
  SubmitWordsPayload,
} from '../types.js';

function broadCastError(
  io: Server,
  roomId: string,
  message: string,
  details?: Record<string, unknown>,
): void {
  io.to(roomId).emit(EVENTS.ERROR, {
    message,
    ...details,
  });
}

function emitError(socket: Socket, message: string, details?: Record<string, unknown>): void {
  socket.emit(EVENTS.ERROR, {
    message,
    ...details,
  });
}

function emitWarning(socket: Socket, message: string, details?: Record<string, unknown>): void {
  socket.emit(EVENTS.WARNING, {
    message,
    ...details,
  });
}

function broadcastLobby(io: Server, roomId: string): void {
  const waitingRoom = waitingPlayers.get(roomId);
  const game = games.get(roomId);
  if (!waitingRoom || !game) return;

  io.to(roomId).emit(EVENTS.LOBBY_UPDATED, lobbySnapshot(waitingRoom, game));
}

function startRound(io: Server, roomId: string): void {
  const game = games.get(roomId);
  if (!game) {
    broadCastError(io, roomId, 'Game not found.', { roomId });
    return;
  }

  const roundNumber = ++game.round;
  game.initializeRound();
  game.roundExpiresAt = Date.now() + GAME_CONFIG.ROUND_SECONDS * 1000;

  const board = game.getBoardForRound(roundNumber);
  io.to(roomId).emit(EVENTS.ROUND_START, {
    roomId,
    round: roundNumber,
    totalRounds: game.totalRounds,
    board,
    expiresAt: game.roundExpiresAt,
  });

  setTimeout(() => {
    const currentGame = games.get(roomId);
    if (!currentGame || currentGame.round !== roundNumber) {
      broadCastError(io, roomId, 'Game not found.');
      return;
    }
    settleRound(io, roomId, 'timer_expired');
  }, GAME_CONFIG.ROUND_SECONDS * 1000);
}

function settleRound(io: Server, roomId: string, reason: 'timer_expired' | 'all_submitted'): void {
  const game = games.get(roomId);
  if (!game || game.status !== GAME_STATUS.IN_PROGRESS) {
    broadCastError(io, roomId, 'Game not found.', { roomId });
    return;
  }

  const round = game.round;
  const finalRound = round >= game.totalRounds;
  const resultMap = game.scoreRound();

  const playerResults = game.players
    .map((player) => {
      const roundEntry = resultMap?.get(player.id) || {
        submittedWords: [],
        acceptedWords: [],
        points: 0,
      };

      return {
        playerId: player.id,
        name: player.name,
        submittedWords: roundEntry.submittedWords,
        acceptedWords: roundEntry.acceptedWords,
        points: roundEntry.points,
        totalWords: game.getTotalWordsById(player.id),
        totalScore: game.getTotalScoreById(player.id),
      };
    })
    .sort((a, b) => {
      if (!finalRound) {
        return a.name.localeCompare(b.name);
      }
      return b.totalScore - a.totalScore || b.totalWords - a.totalWords;
    });

  io.to(roomId).emit(EVENTS.ROUND_RESULT, {
    roomId,
    round,
    reason,
    results: playerResults,
  });

  if (finalRound) game.status = GAME_STATUS.COMPLETED;
}

function removeSocketFromRoom(
  io: Server,
  socket: Socket,
  roomId: string,
  reason: 'left' | 'disconnected' = 'left',
): void {
  const waitingRoom = waitingPlayers.get(roomId);
  const game = games.get(roomId);
  if (!waitingRoom || !game) return;

  const player = waitingRoom.get(socket.id);
  waitingRoom.delete(socket.id);
  socketRoomMap.delete(socket.id);
  socket.leave(roomId);

  if (player) {
    game.removePlayerById(player.id);
    ensureAdmin(game.players);

    const nextAdmin = getAdminPlayer(game.players);
    if (nextAdmin) {
      const adminEntry = waitingRoom.get(nextAdmin.id);
      if (adminEntry) adminEntry.isAdmin = true;
    }

    io.to(roomId).emit(EVENTS.PLAYER_LEFT, {
      roomId,
      playerId: player.id,
      name: player.name,
      reason,
    });
  }

  if (waitingRoom.size === 0) {
    waitingPlayers.delete(roomId);
    games.delete(roomId);
    return;
  }

  if (shouldCancelInProgressGame(game)) {
    game.status = GAME_STATUS.CANCELLED;
    io.to(roomId).emit(EVENTS.GAME_CANCELLED, {
      roomId,
      reason: 'not_enough_players',
    });
  } else if (
    game.status === GAME_STATUS.IN_PROGRESS &&
    game.roundSubmissions.has(game.round) &&
    game.allActivePlayersSubmitted(game.round)
  ) {
    settleRound(io, roomId, 'all_submitted');
  }

  broadcastLobby(io, roomId);
}

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on(EVENTS.JOIN_ROOM, (payload: JoinRoomPayload) => {
    const { roomId, playerName, create, totalRounds, boardDimension } = payload;

    if (!roomId || typeof roomId !== 'string') {
      emitError(socket, 'Invalid room id.', { type: 'form_error' });
      return;
    }

    if (!playerName || typeof playerName !== 'string') {
      emitError(socket, 'Player name is required.', { type: 'form_error' });
      return;
    }

    if (create && boardDimension !== 4 && boardDimension !== 5) {
      emitError(socket, 'Board dimension should be 4 or 5.', { type: 'form_error' });
      return;
    }

    const normalizedRoomId = roomId.trim();
    const normalizedName = playerName.trim();
    if (!normalizedRoomId || !normalizedName) {
      emitError(socket, 'Room id and player name cannot be empty.', { type: 'form_error' });
      return;
    }

    if (socketRoomMap.has(socket.id)) {
      emitError(socket, 'You are already in a room.', { type: 'form_error' });
      return;
    }

    let waitingRoom = waitingPlayers.get(normalizedRoomId);
    let game = games.get(normalizedRoomId);

    if (!create && (!waitingRoom || !game)) {
      emitError(socket, 'Room not found.', { type: 'form_error' });
      return;
    }

    if (!waitingRoom || !game) {
      waitingRoom = new Map<string, Player>();

      game = new Game({
        roomId: normalizedRoomId,
        totalRounds,
        boardDimension,
      });

      waitingPlayers.set(normalizedRoomId, waitingRoom);
      games.set(normalizedRoomId, game);
    }

    if (waitingRoom.size >= GAME_CONFIG.MAX_PLAYERS) {
      emitError(socket, 'Room is full.', { type: 'form_error' });
      return;
    }

    const duplicateName = Array.from(waitingRoom.values()).some(
      (player) => player.name.toLowerCase() === normalizedName.toLowerCase(),
    );

    if (duplicateName) {
      emitError(socket, 'Player name already used in this room.', { type: 'form_error' });
      return;
    }

    const player = new Player({
      id: socket.id,
      name: normalizedName,
      isAdmin: waitingRoom.size === 0,
    });

    waitingRoom.set(socket.id, player);
    game.addPlayer(player);

    socket.join(normalizedRoomId);
    socketRoomMap.set(socket.id, normalizedRoomId);

    socket.emit(EVENTS.ROOM_JOINED, {
      roomId: normalizedRoomId,
      playerId: player.id,
      isAdmin: player.isAdmin,
      waitingOnGame: game.status === GAME_STATUS.IN_PROGRESS,
      totalRounds: game.totalRounds,
    });

    broadcastLobby(io, normalizedRoomId);
  });

  socket.on(EVENTS.START_GAME, (payload: StartGamePayload = {}) => {
    const { roomId } = payload;
    if (!roomId || typeof roomId !== 'string') {
      emitError(socket, 'Invalid room id.');
      return;
    }

    const game = games.get(roomId);
    const waitingRoom = waitingPlayers.get(roomId);
    if (!game || !waitingRoom) {
      emitError(socket, 'Room not found.', { roomId });
      return;
    }

    if (game.status !== GAME_STATUS.LOBBY) {
      emitError(socket, 'Game cannot be started in current state.', { type: 'form_error' });
      return;
    }

    const starter = waitingRoom.get(socket.id);
    if (!starter || !starter.isAdmin) {
      emitError(socket, 'Only admin can start the game.', { type: 'form_error' });
      return;
    }

    if (waitingRoom.size < GAME_CONFIG.MIN_PLAYERS_TO_START) {
      emitError(socket, 'Not enough players to start.', { type: 'form_error' });
      return;
    }

    game.setPlayers(Array.from(waitingRoom.values()));

    io.to(roomId).emit(EVENTS.GAME_STARTING, game.boardDimension);

    setTimeout(() => {
      game.start();
      startRound(io, roomId);
    }, 5000);
  });

  socket.on(EVENTS.BEGIN_ROUND, (payload: { roomId: string }) => {
    const { roomId } = payload;
    if (!roomId || typeof roomId !== 'string') {
      emitError(socket, 'Invalid room id.');
      return;
    }

    const game = games.get(roomId);
    if (!game) {
      broadCastError(io, roomId, 'Room not found.');
      return;
    }

    if (game.status !== GAME_STATUS.IN_PROGRESS) {
      emitError(socket, 'Game is not in progress.', { roomId });
      return;
    }

    const player = game.players.find((entry) => entry.id === socket.id);
    if (!player) {
      emitError(socket, 'Player is not in this game.', { roomId });
      return;
    }

    startRound(io, roomId);
  });

  socket.on(EVENTS.RESTART_GAME, (payload: { roomId: string }) => {
    const { roomId } = payload;

    if (!roomId || typeof roomId !== 'string') {
      emitError(socket, 'Invalid room id.');
      return;
    }

    const game = games.get(roomId);
    if (!game) {
      broadCastError(io, roomId, 'Room not found.');
      return;
    }

    if (game.status !== GAME_STATUS.COMPLETED) {
      emitWarning(socket, 'Game is not completed.', { roomId });
      return;
    }

    game.restart();
    startRound(io, roomId);
  });

  socket.on(EVENTS.SUBMIT_WORDS, (payload: SubmitWordsPayload) => {
    const { roomId, words, timeStamp } = payload;
    if (!roomId || typeof roomId !== 'string') {
      emitError(socket, 'Invalid room id.');
      return;
    }

    if (!timeStamp || typeof timeStamp !== 'number') {
      return;
    }

    if (!words || !Array.isArray(words)) {
      return;
    }

    const game = games.get(roomId);
    if (!game) {
      broadCastError(io, roomId, 'Room not found.');
      return;
    }

    if (game.status !== GAME_STATUS.IN_PROGRESS) {
      return;
    }

    const player = game.players.find((entry) => entry.id === socket.id);
    if (!player) {
      return;
    }

    const expiryTime = game.roundExpiresAt ?? 0;
    if (timeStamp > expiryTime + 1000) {
      emitWarning(socket, 'Could not save your last word in time.', {
        roomId,
        round: game.round,
      });
      return;
    }

    game.addWords(socket.id, normalizeWords(words, game.boardDimension), game.round);
  });

  socket.on(EVENTS.LEAVE_ROOM, (payload: LeaveRoomPayload = {}) => {
    const { roomId } = payload;
    if (!roomId || typeof roomId !== 'string') return;
    removeSocketFromRoom(io, socket, roomId, 'left');
  });

  socket.on('disconnect', () => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;
    removeSocketFromRoom(io, socket, roomId, 'disconnected');
  });
}
