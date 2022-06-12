import { ServerSendMessage, ServerTableStateMessage } from '../types/server.message';
import { getTable, messages, seatTokenToSocketIdMap } from '../poker_modules/state';
import { stripPrivateTableDataForSeat } from '../poker_modules/utils';

const sendTableStateMessage = async (tableName: string) => {
  const table = await getTable(tableName);
  if (!table) return;
  table.seats.forEach((s) => {
    if (!s.isEmpty) {
      const limitedTable = stripPrivateTableDataForSeat(table, s.token);
      const tableState: ServerTableStateMessage = {
        type: 'server/table-state',
        table: limitedTable,
      };
      global.io.to(seatTokenToSocketIdMap[s.token]).emit('server/table-state', tableState);
    }
  });
};

function emitChatMessageToClient(tableName: string, username: string, text: string) {
  if (!messages[tableName]) messages[tableName] = [];
  messages[tableName].push({ username, text });
  const serverMessage: ServerSendMessage = {
    type: 'server/send-message',
    messages: messages[tableName],
  };
  global.io.to(tableName).emit('server/send-message', serverMessage);
}

export default sendTableStateMessage;
export { emitChatMessageToClient };
