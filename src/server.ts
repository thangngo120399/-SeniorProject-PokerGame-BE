import cors from 'cors';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import call from './handlers/call';
import changeDisplayName from './handlers/changeDisplayName';
import check from './handlers/check';
import createTable from './handlers/createTable';
import deal from './handlers/deal';
import disconnecting from './handlers/disconnecting';
import { fold } from './handlers/fold';
import getVacantSeatToken from './handlers/getVacantSeatToken';
import joinTable from './handlers/joinTable';
import pauseGame from './handlers/pauseGame';
import placeBet from './handlers/placeBet';
import requestTableState from './handlers/requestTableState';
import resumeGame from './handlers/resumeGame';
import chatMessage from './handlers/chatMessage';
import startGame from './handlers/startGame';
import kick from './handlers/kick';

const app = express();
const httpServer = createServer(app);

app.use(cors());

declare global {
  // eslint-disable-next-line no-unused-vars
  namespace NodeJS {
    // eslint-disable-next-line no-unused-vars
    interface Global {
      io: Server
    }
  }
}

global.io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello world');
});
app.get('/:tableName', getVacantSeatToken);

global.io.on('connection', (socket) => {
  socket.on('client/create-table', (data, callback) => { createTable(socket, data, callback); });
  socket.on('client/request-table-state', (data) => { requestTableState(data); });
  socket.on('client/join-table', (data) => { joinTable(socket, data); });
  socket.on('client/change-display-name', (data) => { changeDisplayName(data); });
  socket.on('client/start-game', (data) => { startGame(data); });
  socket.on('client/deal', (data) => { deal(data); });
  socket.on('client/place-bet', (data) => { placeBet(data); });
  socket.on('client/call', (data) => { call(data); });
  socket.on('client/check', (data) => { check(data); });
  socket.on('client/fold', (data) => { fold(data); });
  socket.on('client/pause-game', (data) => { pauseGame(data); });
  socket.on('client/resume-game', (data) => { resumeGame(data); });
  socket.on('client/send-message', (data) => { chatMessage(data); });
  socket.on('disconnecting', (reason) => { disconnecting(socket, reason); });
  socket.on('client/kick', (data, callback) => { kick(data, callback); });
});

const port = process.env.PORT || 8000;
httpServer.listen(port, () => {
  console.log(`Application started on port ${port}`);
});
