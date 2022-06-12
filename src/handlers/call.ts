import { ClientCallMessage } from '../types/client.message';
import { callMutator } from '../poker_modules/mutators';
import { getTable, isGamePaused, saveTable } from '../poker_modules/state';
import sendTableStateMessage from './sendMessage';
import { clearFoldTimeout, setFoldTimeout } from './fold';

async function call(message: ClientCallMessage) {
  const table = await getTable(message.tableName);
  if (!table) return;
  if (isGamePaused(message.tableName)) return;

  const mutatedTable = callMutator({
    table,
    data: {
      seatToken: message.seatToken,
    },
  });

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable.name);

  if (mutatedTable !== table) {
    clearFoldTimeout(message.tableName);
    setFoldTimeout(mutatedTable);
  }
}

export default call;
