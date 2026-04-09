import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { CLIENT_ORIGIN, PORT } from './constants/config.js';
import { EVENTS } from './constants/events.js';
import { registerHandlers } from './socket/registerHandlers.js';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
  },
});

io.on(EVENTS.CONNECTION, (socket) => {
  registerHandlers(io, socket);
});

server.listen(PORT, () => {
  console.log(`boggle server running at http://localhost:${PORT}`);
});
