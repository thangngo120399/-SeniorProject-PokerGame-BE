import { Request, Response } from 'express';
import { getTable } from '../poker_modules/state';

async function getVacantSeatToken(req: Request, res: Response) {
  const { tableName } = req.params;

  const table = await getTable(encodeURIComponent(tableName));

  if (!table) {
    res.send({ error: 'MeNoFindTable' });
    return;
  }

  const vacantSeat = table.seats.find((s) => s.isEmpty);

  if (!vacantSeat) {
    res.send({ error: 'TableFull' });
    return;
  }

  res.send({ seatToken: vacantSeat.token });
}

export default getVacantSeatToken;
