import { ClientPlaceBetMessage } from '../types/client.message';
import { placeBetMutator } from '../poker_modules/mutators';
import { getTable, isGamePaused, saveTable } from '../poker_modules/state';
import sendTableStateMessage from './sendMessage';
import { clearFoldTimeout, setFoldTimeout } from './fold';

async function placeBet(message: ClientPlaceBetMessage) {
  const table = await getTable(message.tableName);
  if (!table) return;
  if (isGamePaused(message.tableName)) return;

  const mutatedTable = placeBetMutator({
    table,
    data: {
      seatToken: message.seatToken,
      betChipCount: message.chipCount,
    },
  });

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable.name);

  if (mutatedTable !== table) {
    clearFoldTimeout(message.tableName);
    setFoldTimeout(mutatedTable);
  }
}

export default placeBet;
