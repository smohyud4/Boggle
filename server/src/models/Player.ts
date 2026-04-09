export class Player {
  id: string;
  name: string;
  isAdmin: boolean;
  words: Record<number, string[]>;

  constructor(payload: { id: string; name: string; isAdmin?: boolean }) {
    const { id, name, isAdmin = false } = payload;
    this.id = id;
    this.name = name;
    this.isAdmin = isAdmin;
    this.words = {};
  }

  setWords(round: number, words: string[]): void {
    this.words[round] = words;
  }
}
