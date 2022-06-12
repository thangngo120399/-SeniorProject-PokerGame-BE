import { ClientChangeDisplayNameMessage } from '../types/client.message';
import { getTable, saveTable } from '../poker_modules/state';
import { Table } from '../types/Table.interface';
import sendTableStateMessage, { emitChatMessageToClient } from './sendMessage';

function changeSeatDisplayNameMutator(
  table: Table,
  data: {displayName: string, seatToken: string},
): Table {
  return {
    ...table,
    seats: table.seats.map((s) => {
      if (s.token === data.seatToken) {
        return { ...s, displayName: data.displayName };
      }

      return s;
    }),
  };
}

async function changeDisplayName(data: ClientChangeDisplayNameMessage) {
  const table = await getTable(data.tableName);
  if (!table) return;
  const oldName = table.seats.find((s) => s.token === data.seatToken)?.displayName;
  if (!oldName) return;
  const mutatedTable = changeSeatDisplayNameMutator(table,
    {
      seatToken: data.seatToken,
      displayName: data.displayName,
    });

  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable.name);

  emitChatMessageToClient(mutatedTable.name, 'admin', `${oldName} has changed display name to ${data.displayName}!`);
}

export default changeDisplayName;
