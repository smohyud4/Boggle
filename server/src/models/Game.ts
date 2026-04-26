import { GAME_CONFIG, GAME_STATUS } from '../constants/config.js';
import type { GameInitializer, GameStatus, LeaderboardEntry, RoundResult } from '../types.js';
import { Player } from './Player.js';

export class Game {
  roomId: string;
  round: number;
  totalRounds: number;
  players: Player[];
  scoringParams: Record<number, number>;
  boards: string[][];
  status: GameStatus;
  roundSubmissions: Map<number, Map<string, string[]>>;
  roundResults: Map<number, Map<string, RoundResult>>;
  roundExpiresAt: number | null;

  constructor(payload: GameInitializer) {
    const {
      roomId,
      boards,
      totalRounds = GAME_CONFIG.TOTAL_ROUNDS,
      scoringParams = GAME_CONFIG.SCORE_BY_LENGTH,
    } = payload;

    this.roomId = roomId;
    this.round = 0;
    this.totalRounds = totalRounds;
    this.players = [];
    this.scoringParams = scoringParams;
    this.boards = boards;
    this.status = GAME_STATUS.LOBBY;
    this.roundSubmissions = new Map();
    this.roundResults = new Map();
    this.roundExpiresAt = null;
  }

  setPlayers(players: Player[]): void {
    this.players = players;
  }

  removePlayerById(playerId: string): boolean {
    const previousLength = this.players.length;
    this.players = this.players.filter((player) => player.id !== playerId);
    return this.players.length !== previousLength;
  }

  removePlayer(name: string): boolean {
    const previousLength = this.players.length;
    this.players = this.players.filter((player) => player.name !== name);
    return this.players.length !== previousLength;
  }

  start(): void {
    this.status = GAME_STATUS.IN_PROGRESS;
    this.round = 1;
    this.initializeRound(this.round);
  }

  initializeRound(round: number): void {
    this.roundSubmissions.set(round, new Map());
  }

  getBoardForRound(round = this.round): string[] {
    return this.boards[round - 1] || [];
  }

  addWords(playerId: string, words: string[], round = this.round): void {
    if (!this.roundSubmissions.has(round)) {
      this.initializeRound(round);
    }

    const roundSubmissions = this.roundSubmissions.get(round);
    if (!roundSubmissions) return;

    roundSubmissions.set(playerId, words);

    const player = this.players.find((entry) => entry.id === playerId);
    if (player) {
      player.setWords(round, words);
    }
  }

  hasSubmitted(playerId: string, round = this.round): boolean {
    const roundSubmissions = this.roundSubmissions.get(round);
    return roundSubmissions ? roundSubmissions.has(playerId) : false;
  }

  allActivePlayersSubmitted(round = this.round): boolean {
    const roundSubmissions = this.roundSubmissions.get(round);
    if (!roundSubmissions) return false;
    return this.players.every((player) => roundSubmissions.has(player.id));
  }

  getWordScore(word: string): number {
    if (Object.keys(this.scoringParams).length === 0) return 1;
    if (word.length >= 8) return 11;
    return this.scoringParams[word.length] || 0;
  }

  scoreRound() {
    let roundWordsByPlayer = this.roundSubmissions.get(this.round);
    if (!roundWordsByPlayer) return;

    const wordFreq = new Map<string, number>();

    for (const words of roundWordsByPlayer.values()) {
      for (const word of words) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    const results = new Map<string, RoundResult>();

    for (const [playerId, words] of roundWordsByPlayer.entries()) {
      let score = 0;
      const accepted = [];

      for (const word of words) {
        if (wordFreq.get(word) === 1) {
          score += this.getWordScore(word);
          accepted.push(word);
        }
      }

      results.set(playerId, {
        submittedWords: words,
        acceptedWords: accepted,
        points: score,
      });
    }

    this.roundResults.set(this.round, results);
    return results;
  }

  getPlayerScore(name: string): number {
    const player = this.players.find((entry) => entry.name === name);
    if (!player) return 0;

    let total = 0;
    for (const roundResult of this.roundResults.values()) {
      const playerResult = roundResult.get(player.id);
      if (playerResult) total += playerResult.points;
    }

    return total;
  }

  getRoundScore(round: number): Array<{ playerId: string; name: string; points: number }> {
    const roundResult = this.roundResults.get(round);
    if (!roundResult) return [];

    return this.players.map((player) => ({
      playerId: player.id,
      name: player.name,
      points: roundResult.get(player.id)?.points || 0,
    }));
  }

  getTotalScoreById(playerId: string): number {
    let total = 0;
    for (const roundResult of this.roundResults.values()) {
      const playerResult = roundResult.get(playerId);
      if (playerResult) total += playerResult.points;
    }
    return total;
  }

  getFinalLeaderboard(): LeaderboardEntry[] {
    const ranked = this.players
      .map((player) => ({
        playerId: player.id,
        name: player.name,
        totalScore: this.getTotalScoreById(player.id),
      }))
      .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));

    let placement = 0;
    let previousScore: number | null = null;

    return ranked.map((entry, index) => {
      if (entry.totalScore !== previousScore) {
        placement = index + 1;
        previousScore = entry.totalScore;
      }

      return {
        ...entry,
        place: placement,
      };
    });
  }
}
