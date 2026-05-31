import type { GameStatus } from '../types.js';

export const PORT = Number(process.env.PORT || 3000);
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

export const GAME_CONFIG = {
  BOARD_SIZE: 4,
  MAX_PLAYERS: 5,
  MIN_PLAYERS_TO_START: 2,
  TOTAL_ROUNDS: 3,
  ROUND_SECONDS: 180,
  SCORE_BY_LENGTH: {
    3: 1,
    4: 1,
    5: 2,
    6: 3,
    7: 5,
  },
};

export enum GAME_STATUS {
  LOBBY = 'lobby',
  ROUND_IN_PROGRESS = 'round_in_progress',
  ROUND_OVER = 'round_over',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
