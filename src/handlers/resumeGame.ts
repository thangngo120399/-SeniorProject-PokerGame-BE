import {
  getTable, saveTable, seatTokenToSocketIdMap, tableNameToCountDownMap,
} from '../poker_modules/state';
import { ClientResumeGame } from '../types/client.message';

async function resumeGame(message: ClientResumeGame) {
  tableNameToCountDownMap[message.tableName]?.resumeClock();
  const table = await getTable(message.tableName);
  if (!table) return;
  table.isPaused = false;
  await saveTable(table);
  table.seats.forEach((s) => {
    if (!s.isEmpty) {
      global.io.to(seatTokenToSocketIdMap[s.token]).emit('server/resume-game');
    }
  });
}

export default resumeGame;
