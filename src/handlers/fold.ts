/* eslint-disable no-use-before-define */
import { ClientFoldMessage } from '../types/client.message';
import { foldMutator } from '../poker_modules/mutators';
import {
  getTable, isGamePaused, saveTable, seatTokenToSocketIdMap, tableNameToCountDownMap,
} from '../poker_modules/state';
import sendTableStateMessage from './sendMessage';
import { Table } from '../types/Table.interface';
import CountDown from '../poker_modules/countdown';
import { ServerCountDownMessage } from '../types/server.message';

async function fold(message: ClientFoldMessage) {
  const table = await getTable(message.tableName);
  if (!table) return;
  if (isGamePaused(message.tableName)) return;

  const mutatedTable = foldMutator({
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

function setFoldTimeout(table: Table) {
  if (table.bettingRound === 'pre-deal') return;
  if (table.turnToBetIndex === undefined) return;

  const messageClientFold: ClientFoldMessage = {
    type: 'client/fold',
    tableName: table.name,
    seatToken: table.seats[table.turnToBetIndex].token,
  };

  tableNameToCountDownMap[table.name] = new CountDown(
    () => {
      fold(messageClientFold);
      clearFoldTimeout(table.name);
    },
    (timeLeft: number) => {
      table.seats.forEach((s) => {
        if (!s.isEmpty) {
          const tableState: ServerCountDownMessage = {
            type: 'server/countdown',
            timeLeft,
          };
          global.io.to(seatTokenToSocketIdMap[s.token]).emit('server/countdown', tableState);
        }
      });
    },
  );
}

function clearFoldTimeout(tableName: string) {
  tableNameToCountDownMap[tableName]?.pauseClock();
  delete tableNameToCountDownMap[tableName];
}

export {
  fold, setFoldTimeout, clearFoldTimeout,
};
