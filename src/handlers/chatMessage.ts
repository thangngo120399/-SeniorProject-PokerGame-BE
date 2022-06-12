import { getTable } from '../poker_modules/state';
import { ClientSendMessage } from '../types/client.message';
import { emitChatMessageToClient } from './sendMessage';

async function chatMessage(message: ClientSendMessage) {
  const table = await getTable(message.tableName);
  if (!table) return;
  const username = table.seats.find((s) => s.token === message.seatToken)?.displayName;
  if (!username) return;
  emitChatMessageToClient(message.tableName, username, message.text);
}

export default chatMessage;
