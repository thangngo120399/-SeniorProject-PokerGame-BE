import { promisify } from 'util';
import { Table } from '../types/Table.interface';
import CountDown from './countdown';

const redis = require('redis');

const messages: {[tableName: string]: {username: string, text: string}[]} = {};

const seatTokenToSocketIdMap: {[seatToken: string]: string} = {};
const tableNameToCountDownMap: {[tableName: string]: CountDown} = {};

const REDIS_URL = process.env.REDIS_TLS_URL || 'redis://:p108214e310ece355e165fefdadac0563f489de1917a9434ef39a36f4867407f1@ec2-3-92-252-82.compute-1.amazonaws.com:21110';
const redisClient = redis.createClient(REDIS_URL, {
  tls: {
    rejectUnauthorized: false,
  },
});

redisClient.on('error', (error: any) => {
  console.log(error);
});

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.setex).bind(redisClient);

const saveTable = async (table: Table): Promise<void> => {
  const secondsInADay = 86400;
  setAsync(table.name, secondsInADay, JSON.stringify(table));
};

const getTable = async (tableName: string): Promise<Table|undefined> => {
  const tableJSON = await getAsync(tableName);
  if (!tableJSON) return undefined;
  return JSON.parse(tableJSON);
};

function isGamePaused(tableName: string):boolean {
  return Boolean(tableNameToCountDownMap[tableName]?.getIsPaused());
}

export {
  saveTable, getTable, seatTokenToSocketIdMap, tableNameToCountDownMap,
  messages, isGamePaused,
};
