import { ClientStartGameMessage } from '../types/client.message';
import { getTable, saveTable } from '../poker_modules/state';
import { Table } from '../types/Table.interface';
import sendTableStateMessage from './sendMessage';

function startGameMutator(table: Table): Table {
  return {
    ...table,
    isStarted: true,
    seats: table.seats.filter((s) => !s.isEmpty),
  };
}

async function startGame(message: ClientStartGameMessage) {
  const table = await getTable(message.tableName);
  if (!table) return;
  if (!table.seats.find((s) => s.token === message.seatToken)) {
    return;
  }

  const mutatedTable = startGameMutator(table);

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable.name);
}

export default startGame;
