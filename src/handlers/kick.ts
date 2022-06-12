import { getTable, saveTable } from '../poker_modules/state';
import { ClientKickPlayer } from '../types/client.message';
import sendTableStateMessage from './sendMessage';

async function kick(data: ClientKickPlayer, callback: Function) {
  const table = await getTable(data.tableName);
  if (!table) {
    callback('Wrong table!');
    return;
  }
  if (table.bettingRound !== 'pre-deal') {
    callback("Can't kick, game started!");
    return;
  }
  if (table.hostSeatToken !== data.seatToken) {
    callback("Can't kick, you are not the host!");
    return;
  }
  const mutatedTable = {
    ...table,
    seats: table.seats.filter((s) => s.token !== data.playerTokenToKick),
  };
  await saveTable(mutatedTable);
  sendTableStateMessage(mutatedTable.name);
}

export default kick;
