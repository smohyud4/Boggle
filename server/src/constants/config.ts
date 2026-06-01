import type { GameStatus } from '../types.js';

export const PORT = Number(process.env.PORT || 3000);
export const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

type GAME_CONFIG_TYPE = {
  BOARD_SIZE: number;
  MAX_PLAYERS: number;
  MIN_PLAYERS_TO_START: number;
  TOTAL_ROUNDS: number;
  ROUND_SECONDS: number;
  SCORE_BY_LENGTH: Record<number, Record<number, number>>;
};

export const GAME_CONFIG: GAME_CONFIG_TYPE = {
  BOARD_SIZE: 4,
  MAX_PLAYERS: 5,
  MIN_PLAYERS_TO_START: 2,
  TOTAL_ROUNDS: 3,
  ROUND_SECONDS: 180,
  SCORE_BY_LENGTH: {
    4: {
      3: 1,
      4: 1,
      5: 2,
      6: 3,
      7: 5,
    },
    5: {
      3: 1,
      4: 2,
      5: 3,
      6: 4,
      7: 5,
    },
  },
};

export enum GAME_STATUS {
  LOBBY = 'lobby',
  ROUND_IN_PROGRESS = 'round_in_progress',
  ROUND_OVER = 'round_over',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
