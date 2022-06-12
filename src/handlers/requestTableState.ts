import { ClientRequestTableStateMessage } from '../types/client.message';
import { getTable } from '../poker_modules/state';
import sendTableStateMessage from './sendMessage';

async function requestTableState(data: ClientRequestTableStateMessage) {
  const table = await getTable(data.tableName);
  if (!table) return;
  sendTableStateMessage(table.name);
}
export default requestTableState;
