import { Socket } from 'socket.io';
import { ClientCreateTableMessage } from '../types/client.message';
import { Table } from '../types/Table.interface';
import { getTable, saveTable, seatTokenToSocketIdMap } from '../poker_modules/state';
import { randomDisplayName } from '../poker_modules/utils';
import sendTableStateMessage, { emitChatMessageToClient } from './sendMessage';

const generateSeatToken = (): string => Math.random().toString(36).substring(2, 15);

// eslint-disable-next-line no-unused-vars
type CreateTableCallback = (args: string) => void;

async function createTable(
  socket: Socket, data: ClientCreateTableMessage, callback: CreateTableCallback,
) {
  const socketId = socket.id;
  const tableName = encodeURIComponent(data.tableName);
  const table = await getTable(tableName);
  if (table) {
    callback('TableName existed');
    return;
  }
  const numberOfSeats = data.numberOfSeats || 2;
  const startingChipCount = data.startingChipCount || 100;
  const smallBlind = data.smallBlind || 1;
  const creatorSeatToken = generateSeatToken();
  const creatorDisplayName = randomDisplayName();
  seatTokenToSocketIdMap[creatorSeatToken] = socketId;
  socket.join(tableName);
  const newTable: Table = {
    isPaused: false,
    hostSeatToken: creatorSeatToken,
    isStarted: false,
    name: tableName,
    bettingRound: 'pre-deal',
    activePot: { seatTokens: [], chipCount: 0 },
    splitPots: [],
    maxBetChipCount: startingChipCount * numberOfSeats,
    highlightRelevantCards: data.highlightRelevantCards,
    dealerIndex: 0,
    turnToBetIndex: 0,
    roundTerminatingSeatIndex: 0,
    revealPocketIndeces: [],
    smallBlind,
    deck: [],
    communityCards: [],
    seats: [
      {
        winAmount: 0,
        isWinner: false,
        isActive: true,
        token: creatorSeatToken,
        chipCount: startingChipCount,
        chipsBetCount: 0,
        pocketCards: [],
        displayName: creatorDisplayName,
        isEmpty: false,
        isFolded: false,
        isBust: false,
      },
      ...Array(numberOfSeats - 1)
        .fill(0)
        .map(() => ({
          winAmount: 0,
          isWinner: false,
          isActive: false,
          token: generateSeatToken(),
          chipCount: startingChipCount,
          chipsBetCount: 0,
          pocketCards: [],
          displayName: randomDisplayName(),
          isEmpty: true,
          isFolded: false,
          isBust: false,
        })),
    ],
  };

  await saveTable(newTable);
  sendTableStateMessage(newTable.name);

  emitChatMessageToClient(newTable.name, 'admin', `${creatorDisplayName} has created this game!`);
}

export default createTable;
