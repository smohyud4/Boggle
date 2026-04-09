import { GAME_CONFIG } from '../constants/config.ts';
import { Board } from '../types.ts';

// https://boardgames.stackexchange.com/questions/29264/boggle-what-is-the-dice-configuration-for-boggle-in-various-languages

const BOGGLE_DICE: Board = {
  1: ['R', 'I', 'F', 'O', 'B', 'X'],
  2: ['I', 'F', 'E', 'H', 'E', 'Y'],
  3: ['D', 'E', 'N', 'O', 'W', 'S'],
  4: ['U', 'T', 'O', 'K', 'N', 'D'],
  5: ['H', 'M', 'S', 'R', 'A', 'O'],
  6: ['L', 'U', 'P', 'E', 'T', 'S'],
  7: ['A', 'C', 'I', 'T', 'O', 'A'],
  8: ['Y', 'L', 'G', 'K', 'U', 'E'],
  9: ['QU', 'B', 'M', 'J', 'O', 'A'],
  10: ['E', 'H', 'I', 'S', 'P', 'N'],
  11: ['V', 'E', 'T', 'I', 'G', 'N'],
  12: ['B', 'A', 'L', 'I', 'Y', 'T'],
  13: ['E', 'Z', 'A', 'V', 'N', 'D'],
  14: ['R', 'A', 'L', 'E', 'S', 'C'],
  15: ['U', 'W', 'I', 'L', 'R', 'G'],
  16: ['P', 'A', 'C', 'E', 'M', 'D'],
};

export function generateBoard(): string[] {
  const board: string[] = [];
  const numbers = Array.from({ length: 16 }, (_, i) => i + 1);

  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  for (const num of numbers) {
    const dice = BOGGLE_DICE[num];
    board.push(dice[Math.floor(Math.random() * dice.length)]);
  }

  return board;
}

export function generateBoards(totalRounds: number): string[][] {
  return Array.from({ length: totalRounds }, () => generateBoard());
}
