import { ClientCheckMessage } from '../types/client.message';
import { checkMutator } from '../poker_modules/mutators';
import { getTable, isGamePaused, saveTable } from '../poker_modules/state';
import sendTableStateMessage from './sendMessage';
import { clearFoldTimeout, setFoldTimeout } from './fold';

async function check(message: ClientCheckMessage) {
  const table = await getTable(message.tableName);
  if (!table) return;
  if (isGamePaused(message.tableName)) return;

  const mutatedTable = checkMutator({
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

export default check;
