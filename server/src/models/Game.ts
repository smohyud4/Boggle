import { GAME_CONFIG, GAME_STATUS } from '../constants/config.js';
import type { GameInitializer, GameStatus, RoundResult } from '../types.js';
import { generateBoards } from '../utils/game.js';
import { Player } from './Player.js';

export class Game {
  roomId: string;
  round: number;
  totalRounds: number;
  players: Player[];
  scoringParams: Record<number, number>;
  boards: string[][];
  status: GameStatus;
  roundSubmissions: Map<number, Map<string, Set<string>>>;
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

  addPlayer(player: Player): void {
    this.players.push(player);
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

  restart() {
    this.roundResults = new Map();
    this.roundSubmissions = new Map();
    this.roundExpiresAt = null;
    this.boards = generateBoards(this.totalRounds);
    this.start();
  }

  start(): void {
    this.round = 0;
    this.initializeRound(this.round);
  }

  initializeRound(round = this.round): void {
    this.status = GAME_STATUS.ROUND_IN_PROGRESS;
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

    let currWords = roundSubmissions.get(playerId);
    if (!currWords) {
      currWords = new Set<string>();
      roundSubmissions.set(playerId, currWords);
    }

    words.forEach((word) => currWords.add(word));
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

  scoreRound(round = this.round) {
    let roundWordsByPlayer = this.roundSubmissions.get(round);
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
        submittedWords: Array.from(words),
        acceptedWords: accepted,
        points: score,
      });
    }

    this.roundResults.set(round, results);
    return results;
  }

  getPlayerResults(round = this.round) {
    const resultMap = this.scoreRound(round);
    const finalRound = round >= this.totalRounds;
    this.status = finalRound ? GAME_STATUS.COMPLETED : GAME_STATUS.ROUND_OVER;

    return this.players
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
          totalWords: this.getTotalWordsById(player.id),
          totalScore: this.getTotalScoreById(player.id),
        };
      })
      .sort((a, b) => {
        if (!finalRound) {
          return a.name.localeCompare(b.name);
        }
        return b.totalScore - a.totalScore || b.totalWords - a.totalWords;
      });
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

  getTotalWordsById(playerId: string): number {
    let total = 0;
    for (const roundResult of this.roundResults.values()) {
      const playerResult = roundResult.get(playerId);
      if (playerResult) total += playerResult.acceptedWords.length;
    }
    return total;
  }
}
