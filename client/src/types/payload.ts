export type FormMode = 'join' | 'create';

export type RoomJoinedPayload = {
  roomId: string;
  playerId: string;
  isAdmin: boolean;
  waitingOnGame: boolean;
  totalRounds: number;
};

export type LobbyPlayer = {
  id: string;
  name: string;
  isAdmin: boolean;
};

export type LobbyUpdatedPayload = {
  roomId: string;
  players: LobbyPlayer[];
  canStart: boolean;
};

export type ErrorPayload = {
  message: string;
} & Record<string, unknown>;

export type RoundStartPayload = {
  roomId: string;
  round: number;
  totalRounds: number;
  board: string[];
  expiresAt: number;
  isAdmin?: boolean;
};

export type RoundResultPlayerPayload = {
  playerId: string;
  name: string;
  submittedWords: string[];
  acceptedWords: string[];
  points: number;
  totalWords: number;
  totalScore: number;
};

export type RoundResultPayload = {
  roomId: string;
  round: number;
  totalRounds: number;
  reason: 'timer_expired' | 'all_submitted';
  results: RoundResultPlayerPayload[];
  isAdmin?: boolean;
};

export type GameOverPayload = {
  roomId: string;
  leaderboard: Array<{
    playerId: string;
    name: string;
    totalScore: number;
  }>;
};

export type PlayerLeftPayload = {
  roomId: string;
  playerId: string;
  name: string;
  reason: 'left' | 'disconnected';
};

export type SubmitWordsPayload = {
  roomId: string;
  words: string[];
};
