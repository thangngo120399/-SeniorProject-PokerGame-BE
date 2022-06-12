import { Socket } from 'socket.io';
import { ClientJoinTableMessage } from '../types/client.message';
import { getTable, saveTable, seatTokenToSocketIdMap } from '../poker_modules/state';
import { Table } from '../types/Table.interface';
import sendTableStateMessage, { emitChatMessageToClient } from './sendMessage';

function addPlayerToTableMutator(table: Table, seatToken: string) {
  return {
    ...table,
    seats: table.seats.map((s) => {
      if (s.token === seatToken) {
        return { ...s, isEmpty: false, isActive: true };
      }
      return s;
    }),
  };
}

async function joinTable(socket: Socket, data: ClientJoinTableMessage) {
  const socketId = socket.id;
  const table = await getTable(data.tableName);
  if (!table) return;
  const seat = table.seats.find((s) => s.token === data.seatToken);
  if (!seat) {
    return;
  }
  if (seat.isEmpty) {
    const mutatedTable = addPlayerToTableMutator(table, data.seatToken);
    seatTokenToSocketIdMap[data.seatToken] = socketId;
    socket.join(table.name);
    await saveTable(mutatedTable);
    sendTableStateMessage(data.tableName);
    emitChatMessageToClient(data.tableName, 'admin', `${seat.displayName} has joined the game!`);
  } else { // Client reconnect to the seat
    const sockets = await global.io.in(seatTokenToSocketIdMap[data.seatToken]).fetchSockets();
    if (!sockets.length) {
      const mutatedTable = addPlayerToTableMutator(table, data.seatToken);
      seatTokenToSocketIdMap[data.seatToken] = socketId;
      socket.join(table.name);
      await saveTable(mutatedTable);
      sendTableStateMessage(data.tableName);
      emitChatMessageToClient(data.tableName, 'admin', `${seat.displayName} has reconnected to the game!`);
    }
  }
}

export default joinTable;
