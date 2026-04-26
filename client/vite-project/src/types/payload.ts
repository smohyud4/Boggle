export type FormMode = "join" | "create";
export type ScoringType = "default" | "equal";

export type RoomJoinedPayload = {
  roomId: string;
  playerId: string;
  isAdmin: boolean;
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
  message?: string;
};

export type RoundStartPayload = {
  roomId: string;
  round: number;
  totalRounds: number;
  board: string[];
  scoringParams: Record<number, number>;
  expiresAt: number;
};

export type RoundResultPlayerPayload = {
  playerId: string;
  name: string;
  submittedWords: string[];
  acceptedWords: string[];
  points: number;
  totalScore: number;
};

export type RoundResultPayload = {
  roomId: string;
  round: number;
  reason: "timer_expired" | "all_submitted";
  results: RoundResultPlayerPayload[];
};

export type GameOverPayload = {
  roomId: string;
  leaderboard: Array<{
    playerId: string;
    name: string;
    totalScore: number;
  }>;
};

export type BeginRoundPayload = {
  roomId: string;
  round: number;
};

export type PlayerLeftPayload = {
  roomId: string;
  playerId: string;
  name: string;
  reason: "left" | "disconnected";
};

export type SubmitWordsPayload = {
  roomId: string;
  words: string[];
};
