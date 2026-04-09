export type GameStatus = 'lobby' | 'in_progress' | 'completed' | 'cancelled';

export type Board = Record<number, string[]>;

export type GameInitializer = {
  roomId: string;
  boards: string[][];
  totalRounds?: number;
  scoringParams?: Record<number, number>;
};

export type PlayerSnapshot = {
  id: string;
  name: string;
  isAdmin: boolean;
};

export type RoundResult = {
  submittedWords: string[];
  acceptedWords: string[];
  points: number;
};

export type LeaderboardEntry = {
  playerId: string;
  name: string;
  totalScore: number;
  place: number;
};

export type JoinRoomPayload = {
  roomId: string;
  playerName: string;
  create?: boolean;
  totalRounds?: number;
  scoringParams?: Record<number, number>;
};

export type StartGamePayload = {
  roomId?: string;
};

export type SubmitWordsPayload = {
  roomId?: string;
  words?: unknown;
};

export type LeaveRoomPayload = {
  roomId?: string;
};

export type GameStartData = {
  roomId: string;
  round: number;
  totalRounds: number;
  board: string[];
  expiresAt: number;
};

export type RoomJoinData = {
  roomId: string;
  playerId: string;
  isAdmin: boolean;
};

export type LobbyUpdateData = {
  roomId: string;
  players: PlayerSnapshot[];
  canStart: boolean;
  maxPlayers: number;
  status: GameStatus;
  roundSeconds: number;
  totalRounds: number;
};
