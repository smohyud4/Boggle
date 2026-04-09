import { GAME_CONFIG, GAME_STATUS } from '../constants/config.js';
import { Game } from '../models/Game.js';
import { Player } from '../models/Player.js';
import type { LobbyUpdateData } from '../types.js';

export function lobbySnapshot(waitingRoom: Map<string, Player>, game: Game): LobbyUpdateData {
  const players = Array.from(waitingRoom.values()).map((player) => ({
    id: player.id,
    name: player.name,
    isAdmin: player.isAdmin,
  }));

  return {
    roomId: game.roomId,
    players,
    canStart: players.length >= GAME_CONFIG.MIN_PLAYERS_TO_START,
    maxPlayers: GAME_CONFIG.MAX_PLAYERS,
    status: game.status,
    roundSeconds: GAME_CONFIG.ROUND_SECONDS,
    totalRounds: game.totalRounds,
  };
}

export function getAdminPlayer(players: Player[]): Player | null {
  return players.find((player) => player.isAdmin) || null;
}

export function ensureAdmin(players: Player[]): void {
  if (players.length === 0) return;
  if (players.some((player) => player.isAdmin)) return;
  players[0].isAdmin = true;
}

export function shouldCancelInProgressGame(game: Game): boolean {
  return game.status === GAME_STATUS.IN_PROGRESS && game.players.length < GAME_CONFIG.MIN_PLAYERS_TO_START;
}
