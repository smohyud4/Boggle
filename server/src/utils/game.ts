import { Board } from '../types.js';

// https://boardgames.stackexchange.com/questions/29264/boggle-what-is-the-dice-configuration-for-boggle-in-various-languages

const BOGGLE_4x4: Board = {
  1: ['r', 'i', 'f', 'o', 'b', 'x'],
  2: ['i', 'f', 'e', 'h', 'e', 'y'],
  3: ['d', 'e', 'n', 'o', 'w', 's'],
  4: ['u', 't', 'o', 'k', 'n', 'd'],
  5: ['h', 'm', 's', 'r', 'a', 'o'],
  6: ['l', 'u', 'p', 'e', 't', 's'],
  7: ['a', 'c', 'i', 't', 'o', 'a'],
  8: ['y', 'l', 'g', 'k', 'u', 'e'],
  9: ['qu', 'b', 'm', 'j', 'o', 'a'],
  10: ['e', 'h', 'i', 's', 'p', 'n'],
  11: ['v', 'e', 't', 'i', 'g', 'n'],
  12: ['b', 'a', 'l', 'i', 'y', 't'],
  13: ['e', 'z', 'a', 'v', 'n', 'd'],
  14: ['r', 'a', 'l', 'e', 's', 'c'],
  15: ['u', 'w', 'i', 'l', 'r', 'g'],
  16: ['p', 'a', 'c', 'e', 'm', 'd'],
};

// Owned board game

const BOGGLE_5x5: Board = {
  1: ['s', 'y', 'r', 'f', 'p', 'i'],
  2: ['c', 'l', 'i', 't', 'i', 'e'],
  3: ['k', 'i', 'qu', 'w', 'l', 'u'],
  4: ['o', 'l', 'd', 'n', 'h', 'h'],
  5: ['t', 'i', 't', 'i', 'e', 'i'],
  6: ['c', 't', 'i', 's', 'e', 'p'],
  7: ['a', 'a', 'a', 'r', 'f', 's'],
  8: ['i', 'y', 'a', 'f', 'r', 's'],
  9: ['n', 'l', 'h', 'd', 'r', 'o'],
  10: ['m', 'g', 'n', 'a', 'e', 'n'],
  11: ['n', 'c', 'c', 's', 'e', 't'],
  12: ['e', 'g', 'u', 'e', 'a', 'm'],
  13: ['a', 'd', 'n', 'n', 'n', 'e'],
  14: ['h', 'r', 'l', 'h', 'o', 'd'],
  15: ['p', 'e', 'i', 'l', 'c', 't'],
  16: ['o', 't', 'o', 'u', 'w', 'n'],
  17: ['t', 'n', 'h', 'd', 'd', 'o'],
  18: ['t', 't', 't', 'o', 'm', 'e'],
  19: ['a', 'a', 'e', 'e', 'e', 'e'],
  20: ['s', 's', 's', 'e', 'n', 'u'],
  21: ['t', 'o', 'o', 'o', 'u', 't'],
  22: ['e', 'k', 'z', 'x', 'b', 'j'],
  23: ['s', 'f', 'r', 'i', 'a', 'a'],
  24: ['r', 'o', 'r', 'g', 'v', 'w'],
  25: ['an', 'in', 'er', 'he', 'qu', 'th'],
};

const BOGGLE_BOARDS: Record<number, Board> = {
  4: BOGGLE_4x4,
  5: BOGGLE_5x5,
};

export function generateBoard(n: number): string[] {
  const board: string[] = [];
  const numbers = Array.from({ length: n * n }, (_, i) => i + 1);

  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  for (const num of numbers) {
    const dice = BOGGLE_BOARDS[n][num];
    board.push(dice[Math.floor(Math.random() * dice.length)]);
  }

  return board;
}

export function generateBoards(totalRounds: number, dimension: number): string[][] {
  return Array.from({ length: totalRounds }, () => generateBoard(dimension));
}

export function normalizeWords(words: unknown): string[] {
  if (!Array.isArray(words)) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const rawWord of words) {
    if (typeof rawWord !== 'string') continue;

    const cleaned = rawWord
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '');

    if (cleaned.length < 3) continue;
    if (seen.has(cleaned)) continue;

    seen.add(cleaned);
    normalized.push(cleaned);
  }

  return normalized;
}
