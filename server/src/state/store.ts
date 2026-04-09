import { Game } from '../models/Game.js';
import { Player } from '../models/Player.js';

export const waitingPlayers = new Map<string, Map<string, Player>>();
export const games = new Map<string, Game>();
export const socketRoomMap = new Map<string, string>();
