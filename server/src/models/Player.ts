export class Player {
  id: string;
  name: string;
  isAdmin: boolean;
  isConnected: boolean;

  constructor(payload: { id: string; name: string; isAdmin?: boolean }) {
    const { id, name, isAdmin = false } = payload;
    this.id = id;
    this.name = name;
    this.isAdmin = isAdmin;
    this.isConnected = true;
  }
}
