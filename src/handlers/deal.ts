import { createDeck, shuffleDeckNaive } from '@pairjacks/poker-cards';
import { ClientDealMessage } from '../types/client.message';
import { dealMutator } from '../poker_modules/mutators';
import { getTable, isGamePaused, saveTable } from '../poker_modules/state';
import sendTableStateMessage from './sendMessage';
import { setFoldTimeout } from './fold';

async function deal(message: ClientDealMessage) {
  const table = await getTable(message.tableName);
  if (!table) return;
  if (isGamePaused(message.tableName)) return;

  const deck = await shuffleDeckNaive(createDeck());

  const mutatedTable = dealMutator({
    table,
    data: { seatToken: message.seatToken, deck },
  });
  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable.name);
  setFoldTimeout(mutatedTable);
}

export default deal;
