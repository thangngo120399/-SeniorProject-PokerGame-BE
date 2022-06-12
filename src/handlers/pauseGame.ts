import {
  getTable, saveTable, seatTokenToSocketIdMap, tableNameToCountDownMap,
} from '../poker_modules/state';
import { ClientPauseGame } from '../types/client.message';

async function pauseGame(message: ClientPauseGame) {
  tableNameToCountDownMap[message.tableName]?.pauseClock();
  const table = await getTable(message.tableName);
  if (!table) return;
  table.isPaused = true;
  await saveTable(table);
  table.seats.forEach((s) => {
    if (!s.isEmpty) {
      global.io.to(seatTokenToSocketIdMap[s.token]).emit('server/pause-game');
    }
  });
}

export default pauseGame;
