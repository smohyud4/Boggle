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
