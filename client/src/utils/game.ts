type BoggleDice = Record<number, string[]>;

const BOGGLE_4x4: BoggleDice = {
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

const BOGGLE_5x5: BoggleDice = {
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
  22: ['m', 'k', 'z', 'x', 'b', 'j'],
  23: ['s', 'f', 'r', 'i', 'a', 'a'],
  24: ['r', 'o', 'r', 'g', 'v', 'w'],
  25: ['an', 'in', 'er', 'he', 'qu', 'th'],
};

const BOGGLE_BOARDS: Record<number, BoggleDice> = {
  4: BOGGLE_4x4,
  5: BOGGLE_5x5,
};

const BOGGLE_SCORING_PARAMS: Record<number, Record<number, number>> = {
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

export function generateRoomCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 5 }, () => letters[Math.floor(Math.random() * 26)]).join('');
}

export function getWordScore(word: string, dimension: number) {
  if (word.length >= 8) return 11;
  return BOGGLE_SCORING_PARAMS[dimension][word.length] || 0;
}

export function formatTime(time: number): string {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${String(minutes).padStart(1, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function canSpell(board: string[], word: string) {
  const grid: string[][] = [];
  const n = Math.sqrt(board.length);

  for (let i = 0; i < n; i++) {
    grid.push(board.slice(i * n, (i + 1) * n));
  }

  function dfs(r: number, c: number, index: number, visited = new Set<number>()): boolean {
    if (r < 0 || r >= n || c < 0 || c >= n) return false;

    const square = r * n + c;
    const cellContent = grid[r][c];
    const cellLength = cellContent.length;

    if (visited.has(square)) return false;
    if (index >= word.length) return false;

    if (cellContent !== word.slice(index, index + cellLength)) return false;

    if (index + cellLength === word.length) return true;

    visited.add(square);

    const nextIndex = index + cellLength;

    if (dfs(r + 1, c, nextIndex, visited)) return true;
    if (dfs(r - 1, c, nextIndex, visited)) return true;
    if (dfs(r, c - 1, nextIndex, visited)) return true;
    if (dfs(r, c + 1, nextIndex, visited)) return true;
    if (dfs(r + 1, c + 1, nextIndex, visited)) return true;
    if (dfs(r - 1, c - 1, nextIndex, visited)) return true;
    if (dfs(r + 1, c - 1, nextIndex, visited)) return true;
    if (dfs(r - 1, c + 1, nextIndex, visited)) return true;

    visited.delete(square);
    return false;
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (dfs(i, j, 0)) return true;
    }
  }

  return false;
}
