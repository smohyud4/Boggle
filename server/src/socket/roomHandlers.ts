import type { Server, Socket } from 'socket.io';
import { EVENTS } from '../constants/events.js';
import { GAME_CONFIG, GAME_STATUS } from '../constants/config.js';
import { waitingPlayers, games, socketRoomMap } from '../state/store.js';
import { Player } from '../models/Player.js';
import { Game } from '../models/Game.js';
import { generateBoards, normalizeWords } from '../utils/game.ts';
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

function emitError(socket: Socket, message: string, details: Record<string, unknown> = {}): void {
  socket.emit(EVENTS.ERROR, { message, ...details });
}

function broadcastLobby(io: Server, roomId: string): void {
  const waitingRoom = waitingPlayers.get(roomId);
  const game = games.get(roomId);
  if (!waitingRoom || !game) return;

  io.to(roomId).emit(EVENTS.LOBBY_UPDATED, lobbySnapshot(waitingRoom, game));
}

function startRound(io: Server, roomId: string, roundNumber: number): void {
  const game = games.get(roomId);
  if (!game) return;

  game.round = roundNumber;
  game.initializeRound(roundNumber);
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

  game.clearRoundTimer();
  game.roundTimer = setTimeout(() => {
    settleRound(io, roomId, 'timer_expired');
  }, GAME_CONFIG.ROUND_SECONDS * 1000);
}

function settleRound(io: Server, roomId: string, reason: 'timer_expired' | 'all_submitted'): void {
  const game = games.get(roomId);
  if (!game || game.status !== GAME_STATUS.IN_PROGRESS) return;

  const round = game.round;
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
        totalScore: game.getTotalScoreById(player.id),
      };
    })
    .sort(
      (a, b) => b.points - a.points || b.totalScore - a.totalScore || a.name.localeCompare(b.name),
    );

  io.to(roomId).emit(EVENTS.ROUND_RESULT, {
    roomId,
    round,
    reason,
    results: playerResults,
  });

  game.clearRoundTimer();

  // if (round < game.totalRounds) {
  //   startRound(io, roomId, round + 1);
  //   return;
  // }

  // game.status = GAME_STATUS.COMPLETED;
  // io.to(roomId).emit(EVENTS.GAME_OVER, {
  //   roomId,
  //   leaderboard: game.getFinalLeaderboard(),
  // });
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
    game.clearRoundTimer();
    waitingPlayers.delete(roomId);
    games.delete(roomId);
    return;
  }

  if (shouldCancelInProgressGame(game)) {
    game.status = GAME_STATUS.CANCELLED;
    game.clearRoundTimer();
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
    const { roomId, playerName, create, totalRounds, scoringParams } = payload;

    if (!roomId || typeof roomId !== 'string') {
      emitError(socket, 'Invalid room id.');
      return;
    }

    if (!playerName || typeof playerName !== 'string') {
      emitError(socket, 'Player name is required.');
      return;
    }

    const normalizedRoomId = roomId.trim();
    const normalizedName = playerName.trim();
    if (!normalizedRoomId || !normalizedName) {
      emitError(socket, 'Room id and player name cannot be empty.');
      return;
    }

    if (socketRoomMap.has(socket.id)) {
      emitError(socket, 'Socket is already in a room.');
      return;
    }

    let waitingRoom = waitingPlayers.get(normalizedRoomId);
    let game = games.get(normalizedRoomId);

    if (!create && (!waitingRoom || !game)) {
      emitError(socket, 'Room not found.', { roomId: normalizedRoomId });
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

    if (game.status === GAME_STATUS.IN_PROGRESS) {
      emitError(socket, 'Game already in progress.', { roomId: normalizedRoomId });
      return;
    }

    if (waitingRoom.size >= GAME_CONFIG.MAX_PLAYERS) {
      emitError(socket, 'Room is full.', { roomId: normalizedRoomId });
      return;
    }

    const duplicateName = Array.from(waitingRoom.values()).some(
      (player) => player.name.toLowerCase() === normalizedName.toLowerCase(),
    );

    if (duplicateName) {
      emitError(socket, 'Player name already used in this room.', { roomId: normalizedRoomId });
      return;
    }

    const player = new Player({
      id: socket.id,
      name: normalizedName,
      isAdmin: waitingRoom.size === 0,
    });

    waitingRoom.set(socket.id, player);
    game.setPlayers(Array.from(waitingRoom.values()));

    socket.join(normalizedRoomId);
    socketRoomMap.set(socket.id, normalizedRoomId);

    socket.emit(EVENTS.ROOM_JOINED, {
      roomId: normalizedRoomId,
      playerId: player.id,
      isAdmin: player.isAdmin,
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
      emitError(socket, 'Game cannot be started in current state.', { roomId });
      return;
    }

    const starter = waitingRoom.get(socket.id);
    if (!starter || !starter.isAdmin) {
      emitError(socket, 'Only admin can start the game.', { roomId });
      return;
    }

    if (waitingRoom.size < GAME_CONFIG.MIN_PLAYERS_TO_START) {
      emitError(socket, 'Not enough players to start.', { roomId });
      return;
    }

    game.setPlayers(Array.from(waitingRoom.values()));

    io.to(roomId).emit(EVENTS.GAME_STARTING);

    setTimeout(() => {
      game.start();
      startRound(io, roomId, game.round);
    }, 5000);
  });

  socket.on(EVENTS.BEGIN_ROUND, (payload: { roomId: string; round: number }) => {
    const { roomId, round } = payload;
    if (!roomId || typeof roomId !== 'string') {
      emitError(socket, 'Invalid room id.');
      return;
    }

    const game = games.get(roomId);
    if (!game) {
      emitError(socket, 'Room not found.', { roomId });
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

    startRound(io, roomId, round);
  });

  socket.on(EVENTS.SUBMIT_WORDS, (payload: SubmitWordsPayload = {}) => {
    const { roomId, words } = payload;
    if (!roomId || typeof roomId !== 'string') {
      emitError(socket, 'Invalid room id.');
      return;
    }

    const game = games.get(roomId);
    if (!game) {
      emitError(socket, 'Room not found.', { roomId });
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

    if (game.hasSubmitted(socket.id, game.round)) {
      emitError(socket, 'Words already submitted for this round.', {
        roomId,
        round: game.round,
      });
      return;
    }

    game.addWords(socket.id, normalizeWords(words), game.round);

    if (game.allActivePlayersSubmitted(game.round)) {
      settleRound(io, roomId, 'all_submitted');
    }
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
