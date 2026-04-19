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
  roundNumber: number;
  totalRounds: number;
  board: string[];
  scoringParams: Record<number, number>;
  expiresAt: number;
};
