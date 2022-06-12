import { Socket } from 'socket.io';
import { getTable, saveTable, seatTokenToSocketIdMap } from '../poker_modules/state';
import sendTableStateMessage, { emitChatMessageToClient } from './sendMessage';

async function disconnecting(socket: Socket, reason: string) {
  let tableName: string = '';
  socket.rooms.forEach((room) => {
    if (room !== socket.id) {
      tableName = room;
    }
  });
  if (!tableName) return;
  const table = await getTable(tableName);
  if (!table) return;
  const seatToken = Object.keys(seatTokenToSocketIdMap)
    .find((key) => seatTokenToSocketIdMap[key] === socket.id);
  const seatindex = table.seats.findIndex((s) => s.token === seatToken);
  if (seatindex === undefined) return;
  const userName = table.seats[seatindex].displayName;
  table.seats[seatindex].isActive = false;
  emitChatMessageToClient(table.name, 'admin', `${userName} has disconnected! (reason: ${reason})`);

  await saveTable(table);
  sendTableStateMessage(table.name);
}

export default disconnecting;
