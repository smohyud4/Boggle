import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PORT } from './constants/config.js';
import { EVENTS } from './constants/events.js';
import { registerHandlers } from './socket/registerHandlers.js';

const app = express();
app.use(
  cors({
    origin: ['https://boggle-verse.vercel.app', 'https://boggleverse.com', 'http://localhost:5173'],
  }),
);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['https://boggle-verse.vercel.app', 'https://boggleverse.com', 'http://localhost:5173'],
  },
});

io.on(EVENTS.CONNECTION, (socket) => {
  registerHandlers(io, socket);
});

server.listen(PORT, () => {
  console.log(`boggle server running on port ${PORT}`);
});
