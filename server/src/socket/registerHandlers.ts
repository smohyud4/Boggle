import type { Server, Socket } from 'socket.io';
import { registerRoomHandlers } from './roomHandlers.js';
import { EVENTS } from '../constants/events.js';

export function registerHandlers(io: Server, socket: Socket): void {
  registerRoomHandlers(io, socket);

  socket.on(EVENTS.ERROR, () => {
    // no-op guard to avoid uncaught errors if clients emit this reserved app event.
  });
}
