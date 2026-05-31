import type { Server, Socket } from 'socket.io';
import { EVENTS } from '../constants/events.js';
import { GAME_CONFIG, GAME_STATUS } from '../constants/config.js';
import { waitingPlayers, games, socketRoomMap } from '../state/store.js';
import { Player } from '../models/Player.js';
import { Game } from '../models/Game.js';
import { generateBoards, normalizeWords } from '../utils/game.js';
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
    scoringParams: game.scoringParams,
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
  if (!game || game.status !== GAME_STATUS.ROUND_IN_PROGRESS) {
    broadCastError(io, roomId, 'Game not found.', { roomId });
    return;
  }

  const round = game.round;
  const playerResults = game.getPlayerResults(round);

  io.to(roomId).emit(EVENTS.ROUND_RESULT, {
    roomId,
    round,
    reason,
    results: playerResults,
  });
}

function removeSocketFromRoom(
  io: Server,
  id: string,
  roomId: string,
  reason: 'left' | 'disconnected' = 'left',
): void {
  const waitingRoom = waitingPlayers.get(roomId);
  const game = games.get(roomId);
  if (!waitingRoom || !game) return;

  const player = waitingRoom.get(id);
  waitingRoom.delete(id);
  socketRoomMap.delete(id);

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
  }

  broadcastLobby(io, roomId);
}

function handleSocketDisconnect(
  io: Server,
  socket: Socket,
  roomId: string,
  reason: 'left' | 'disconnected' = 'left',
) {
  const game = games.get(roomId);
  if (!game) return;

  game.beginGracePeriod(removeSocketFromRoom, socket.id, io, reason);
}

export function registerRoomHandlers(io: Server, socket: Socket): void {
  socket.on(EVENTS.JOIN_ROOM, (payload: JoinRoomPayload) => {
    const { roomId, playerName, create, totalRounds, scoringParams } = payload;

    if (!roomId || typeof roomId !== 'string') {
      emitError(socket, 'Invalid room id.', { type: 'form_error' });
      return;
    }

    if (!playerName || typeof playerName !== 'string') {
      emitError(socket, 'Player name is required.', { type: 'form_error' });
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
        boards: generateBoards(totalRounds || GAME_CONFIG.TOTAL_ROUNDS),
        totalRounds,
        scoringParams,
      });

      waitingPlayers.set(normalizedRoomId, waitingRoom);
      games.set(normalizedRoomId, game);
    }

    if (waitingRoom.size >= GAME_CONFIG.MAX_PLAYERS) {
      emitError(socket, 'Room is full.', { type: 'form_error' });
      return;
    }

    const duplicateName = Array.from(waitingRoom.values()).some(
      (player) => player.name === normalizedName,
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
      waitingOnGame: game.status !== GAME_STATUS.LOBBY,
      totalRounds: game.totalRounds,
    });

    broadcastLobby(io, normalizedRoomId);
  });

  socket.on(EVENTS.REJOIN_ROOM, (payload: { playerId: string; roomId: string }) => {
    const { playerId, roomId } = payload;

    if (!playerId || typeof playerId !== 'string') {
      emitError(socket, 'Invalid player id.');
      return;
    }

    if (!roomId || typeof roomId !== 'string') {
      emitError(socket, 'Invalid room id.');
      return;
    }

    const game = games.get(roomId);
    if (
      !game ||
      game.status === GAME_STATUS.CANCELLED ||
      game.getPlayerById(playerId) === undefined
    ) {
      return;
    }

    const restored = game.restorePlayer(playerId);
    if (!restored) {
      emitError(socket, 'Could not rejoin.', { type: 'connection_error' });
      return;
    }

    socket.join(roomId);
    socketRoomMap.set(playerId, socket.id);
    const roundNumber = game.round;

    if (game.status === GAME_STATUS.ROUND_IN_PROGRESS) {
      socket.emit(EVENTS.ROUND_START, {
        roomId,
        round: roundNumber,
        totalRounds: game.totalRounds,
        board: game.getBoardForRound(roundNumber),
        scoringParams: game.scoringParams,
        expiresAt: game.roundExpiresAt,
      });
    } else if (game.status === GAME_STATUS.COMPLETED || game.status === GAME_STATUS.ROUND_OVER) {
      const playerResults = game.getPlayerResults(roundNumber);

      socket.emit(EVENTS.ROUND_RESULT, {
        roomId,
        round: roundNumber,
        reason: 'timer_expired',
        results: playerResults,
      });
    } else if (game.status === GAME_STATUS.LOBBY) {
      const player = game.getPlayerById(playerId);
      if (!player) {
        emitError(socket, 'Could not rejoin.', { type: 'connection_error' });
        return;
      }

      socket.emit(EVENTS.ROOM_JOINED, {
        roomId: roomId,
        playerId: player.id,
        isAdmin: player.isAdmin,
        waitingOnGame: game.status !== GAME_STATUS.LOBBY,
        totalRounds: game.totalRounds,
      });

      broadcastLobby(io, roomId);
    }
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

    io.to(roomId).emit(EVENTS.GAME_STARTING);

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

    if (game.status !== GAME_STATUS.ROUND_OVER) {
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

    if (game.status !== GAME_STATUS.ROUND_IN_PROGRESS && game.status !== GAME_STATUS.ROUND_OVER) {
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

    game.addWords(socket.id, normalizeWords(words), game.round);
  });

  socket.on(EVENTS.LEAVE_ROOM, (payload: LeaveRoomPayload = {}) => {
    const { roomId } = payload;
    if (!roomId || typeof roomId !== 'string') return;
    removeSocketFromRoom(io, socket.id, roomId, 'left');
  });

  socket.on('disconnect', () => {
    const roomId = socketRoomMap.get(socket.id);
    if (!roomId) return;
    handleSocketDisconnect(io, socket, roomId, 'disconnected');
  });
}
