/* eslint-disable no-use-before-define */
import {
  Cards,
  drawCardsFromDeck,
  findHighestHands,
} from '@pairjacks/poker-cards';
import { Table, Seat, Pot } from '../types/Table.interface';
import {
  indexOfFirstNonBustSeatToLeftOfIndex,
  findHighestBetAtTable,
  indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex,
  indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex,
  getSeatsThatWentAllInLowestToHighestBet,
  removeSeatTokenFromPot,
  isBettingStillPossibleThisHand,
} from './utils';

interface TableMutatorArgs<T> {
  table: Table;
  data: T;
}

// eslint-disable-next-line no-unused-vars
type TableMutatorFunction<T> = (args: TableMutatorArgs<T>) => Table;

interface EndRoundOptions {}

export const endRoundMutator: TableMutatorFunction<EndRoundOptions> = ({
  table,
// eslint-disable-next-line consistent-return
}): Table => {
  switch (table.bettingRound) {
    case 'pre-deal':
      return {
        ...table,
        bettingRound: 'pre-flop',
      };
    case 'pre-flop': {
      const { cards, deck } = drawCardsFromDeck(table.deck, 3);

      const turnToBetIndex = indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex(
        table,
        table.dealerIndex,
      );
      const roundTerminatingSeatIndex = indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex(
        table,
        turnToBetIndex,
      );
      return moveBetsToPotMutator({
        table: {
          ...table,
          bettingRound: 'flop',
          deck,
          communityCards: cards,
          turnToBetIndex,
          roundTerminatingSeatIndex,
        },
        data: {},
      });
    }

    case 'flop': {
      const { cards, deck } = drawCardsFromDeck(table.deck, 1);
      const turnToBetIndex = indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex(
        table,
        table.dealerIndex,
      );
      const roundTerminatingSeatIndex = indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex(
        table,
        turnToBetIndex,
      );

      return moveBetsToPotMutator({
        table: {
          ...table,
          bettingRound: 'turn',
          deck,
          communityCards: [...table.communityCards, ...cards],
          turnToBetIndex,
          roundTerminatingSeatIndex,
        },
        data: {},
      });
    }

    case 'turn': {
      const { cards, deck } = drawCardsFromDeck(table.deck, 1);
      const turnToBetIndex = indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex(
        table,
        table.dealerIndex,
      );
      const roundTerminatingSeatIndex = indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex(
        table,
        turnToBetIndex,
      );

      return moveBetsToPotMutator({
        table: {
          ...table,
          bettingRound: 'river',
          deck,
          communityCards: [...table.communityCards, ...cards],
          turnToBetIndex,
          roundTerminatingSeatIndex,
        },
        data: {},
      });
    }

    case 'river':
      return endHandMutator({ table, data: {} });

    default:
      return {} as Table;
  }
};

interface SkipToEndOfRoundOptions {}

const skipToEndOfRoundMutator: TableMutatorFunction<SkipToEndOfRoundOptions> = ({
  table,
}): Table => {
  let mutatedTable = table;
  while (mutatedTable.bettingRound !== 'pre-deal') {
    mutatedTable = endRoundMutator({ table: mutatedTable, data: {} });
  }
  return mutatedTable;
};

/**
 * Private Mutators
 */

 interface EndTurnOptions {
  seatIndex: number;
}

const endTurnMutator: TableMutatorFunction<EndTurnOptions> = ({
  table,
  data,
}): Table => {
  if (!isBettingStillPossibleThisHand(table)) {
    // Betting isn't possible, skip to the end of the round.
    return skipToEndOfRoundMutator({ table, data: {} });
  }

  if (data.seatIndex !== table.roundTerminatingSeatIndex) {
    const nextSeatTurnIndex = indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex(
      table,
      data.seatIndex,
    );
    return {
      ...table,
      turnToBetIndex: nextSeatTurnIndex,
    };
  }
  return endRoundMutator({ table, data: {} });
};

interface PlaceBetOptions {
  seatToken: string;
  betChipCount: number;
}

export const placeBetMutator: TableMutatorFunction<PlaceBetOptions> = ({
  table,
  data,
}): Table => {
  const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);

  if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
    return table;
  }

  const seat = table.seats[seatIndex];

  if (seat.chipCount < data.betChipCount) {
    return table;
  }

  const minimumChipsToPlay = findHighestBetAtTable(table);

  if (
    seat.chipsBetCount + data.betChipCount <= minimumChipsToPlay
    && seat.chipCount !== data.betChipCount
  ) {
    // They didn't bet enough and this is not an all in.
    return table;
  }

  return endTurnMutator({
    table: {
      ...table,
      roundTerminatingSeatIndex: indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex(
        table,
        seatIndex,
      ),
      lastSeatTokenToBetOnTheRiver:
        table.bettingRound === 'river' ? data.seatToken : undefined,
      seats: table.seats.map((s) => (s.token === data.seatToken
        ? {
          ...s,
          chipCount: s.chipCount - data.betChipCount,
          chipsBetCount: s.chipsBetCount + data.betChipCount,
        }
        : s)),
    },
    data: { seatIndex },
  });
};

interface DealOptions {
  seatToken: string;
  deck: Cards;
}

export const dealMutator: TableMutatorFunction<DealOptions> = ({
  table,
  data,
}): Table => {
  if (table.bettingRound !== 'pre-deal') {
    return table;
  }

  const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
  if (seatIndex === -1 || seatIndex !== table.dealerIndex) {
    return table;
  }

  const smallBlindIndex = table.seats.length === 2
    ? table.dealerIndex
    : indexOfFirstNonBustSeatToLeftOfIndex(table, table.dealerIndex);

  const smallBlindsTurnTable = {
    ...table,
    turnToBetIndex: smallBlindIndex,
  };

  const smallBlindSeat = table.seats[smallBlindIndex];
  const smallBlindBetTable = placeBetMutator({
    table: smallBlindsTurnTable,
    data: {
      seatToken: smallBlindSeat.token,
      betChipCount:
        smallBlindSeat.chipCount >= table.smallBlind
          ? table.smallBlind
          : smallBlindSeat.chipCount,
    },
  });

  const bigBlindIndex = indexOfFirstNonBustSeatToLeftOfIndex(
    table,
    smallBlindIndex,
  );
  const bigBlindSeat = table.seats[bigBlindIndex];
  const bigBlind = table.smallBlind * 2;
  const bigBlindBetTable = placeBetMutator({
    table: smallBlindBetTable,
    data: {
      seatToken: bigBlindSeat.token,
      betChipCount:
        bigBlindSeat.chipCount >= bigBlind ? bigBlind : bigBlindSeat.chipCount,
    },
  });

  // First turn is left of big blind except in head up poker when it's the dealer.
  const firstTurnIndex = table.seats.length === 2
    ? table.dealerIndex
    : indexOfFirstNonBustSeatToLeftOfIndex(bigBlindBetTable, bigBlindIndex);

  // Assign pocket cards to seats. Use a reduce to encapsulate return type
  // of draw cards function
  const withPockets = bigBlindBetTable.seats.reduce(
    (acc: { seats: Seat[]; deck: Cards }, seat) => {
      const { cards, deck } = drawCardsFromDeck(acc.deck, 2);

      return {
        deck,
        seats: acc.seats.concat({
          ...seat,
          pocketCards: seat.isBust ? [] : cards,
        }),
      };
    },
    { seats: [], deck: data.deck },
  );

  return {
    ...bigBlindBetTable,
    bettingRound: 'pre-flop',
    seats: withPockets.seats.map((s) => ({
      ...s, isFolded: s.isBust, isWinner: false, winAmount: 0,
    })),
    deck: withPockets.deck,
    activePot: {
      seatTokens: bigBlindBetTable.seats
        .filter((s) => !s.isBust && !s.isFolded)
        .map((s) => s.token),
      chipCount: bigBlindBetTable.activePot.chipCount,
    },
    communityCards: [],
    revealPocketIndeces: [],
    turnToBetIndex: firstTurnIndex,
    roundTerminatingSeatIndex: bigBlindIndex,
    lastSeatTokenToBetOnTheRiver: undefined,
  };
};

interface CallOptions {
  seatToken: string;
}

export const callMutator: TableMutatorFunction<CallOptions> = ({
  table,
  data,
}): Table => {
  const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
  if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
    return table;
  }

  const seat = table.seats[seatIndex];

  const costToPlay = findHighestBetAtTable(table);
  const chipsToPay = costToPlay - seat.chipsBetCount;

  if (chipsToPay > seat.chipCount) {
    return table;
  }

  return endTurnMutator({
    table: {
      ...table,
      seats: table.seats.map((s) => (s.token === data.seatToken
        ? {
          ...s,
          chipCount: s.chipCount - chipsToPay,
          chipsBetCount: s.chipsBetCount + chipsToPay,
        }
        : s)),
    },
    data: { seatIndex },
  });
};

interface CheckOptions {
  seatToken: string;
}

export const checkMutator: TableMutatorFunction<CheckOptions> = ({
  table,
  data,
}): Table => {
  const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
  if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
    return table;
  }

  const seat = table.seats[seatIndex];
  const currentHighestBet = findHighestBetAtTable(table);

  if (seat.chipsBetCount < currentHighestBet) {
    return table;
  }

  return endTurnMutator({ table, data: { seatIndex } });
};

interface FoldOptions {
  seatToken: string;
}

export const foldMutator: TableMutatorFunction<FoldOptions> = ({
  table,
  data,
}): Table => {
  const seatIndex = table.seats.findIndex((s) => s.token === data.seatToken);
  if (seatIndex === -1 || seatIndex !== table.turnToBetIndex) {
    return table;
  }

  const nextSeatTurnIndex = indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex(
    table,
    seatIndex,
  );

  const tableWithFoldedSeat = {
    ...table,
    turnToBetIndex: nextSeatTurnIndex,
    activePot: removeSeatTokenFromPot(table, data.seatToken, table.activePot),
    splitPots: table.splitPots.map((sp) => removeSeatTokenFromPot(table, data.seatToken, sp)),
    seats: table.seats.map((s) => (s.token === data.seatToken
      ? {
        ...s,
        isFolded: true,
      }
      : s)),
  };

  const unfoldedSeats = tableWithFoldedSeat.seats.filter((s) => !s.isFolded);
  if (unfoldedSeats.length === 1) {
    return endHandMutator({ table: tableWithFoldedSeat, data: {} });
  }
  return endTurnMutator({
    table: tableWithFoldedSeat,
    data: { seatIndex },
  });
};

interface EndHandOptions {}

export const endHandMutator: TableMutatorFunction<EndHandOptions> = ({
  table,
}): Table => {
  const awardedTable = awardWinnersMutator({
    table,
    data: {},
  });

  const revealHandTable = revealWinningHandsMutator({
    table: awardedTable,
    data: {},
  });

  return moveDealerButtonMutator({
    table: {
      ...revealHandTable,
      bettingRound: 'pre-deal',
      turnToBetIndex: undefined,
      splitPots: [],
      seats: revealHandTable.seats.map((s) => ({
        ...s,
        isFolded: false,
        isBust: s.chipCount === 0,
      })),
    },
    data: {},
  });
};

interface MoveDealerButtonMutatorOptions {}

export const moveDealerButtonMutator: TableMutatorFunction<MoveDealerButtonMutatorOptions> = ({
  table,
}): Table => ({
  ...table,
  dealerIndex: indexOfFirstNonBustSeatToLeftOfIndex(table, table.dealerIndex),
});

interface RevealWinningHandsOptions {}

export const revealWinningHandsMutator: TableMutatorFunction<RevealWinningHandsOptions> = ({
  table,
}): Table => {
  const unfoldedSeats = table.seats.filter((s) => !s.isBust && !s.isFolded);

  if (unfoldedSeats.length < 2) {
    return table;
  }

  const remainingHands = unfoldedSeats.map((s) => ({
    pocketCards: s.pocketCards,
    communityCards: table.communityCards,
  }));

  // eslint-disable-next-line max-len
  const winningTokens = findHighestHands(remainingHands).map((hand) => unfoldedSeats[hand.candidateIndex].token);
  const revealPocketTokens = [
    ...winningTokens,
    table.lastSeatTokenToBetOnTheRiver,
  ];

  const revealPocketIndexs = revealPocketTokens.reduce((accu, token) => {
    const index = table.seats.findIndex((s) => s.token === token);
    return index === -1 ? accu : [...accu, index];
  }, [] as number[]);

  return {
    ...table,
    revealPocketIndeces: revealPocketIndexs,
  };
};

interface AwardWinnersOptions {}

export const awardWinnersMutator: TableMutatorFunction<AwardWinnersOptions> = ({
  table,
}): Table => {
  const betInPotTable = moveBetsToPotMutator({ table, data: {} });

  return awardPotsMutator({
    table: betInPotTable,
    data: {},
  });
};

interface AwardPotsMutatorOptions {}

const awardPotsMutator: TableMutatorFunction<AwardPotsMutatorOptions> = ({
  table,
}): Table => {
  const pots: Pot[] = [table.activePot, ...table.splitPots];

  const splitPotsAwarded = pots.reduce(
    (accu, pot) => {
      const validSeats = accu.table.seats
        .filter((s) => !s.isFolded)
        .filter((s) => pot.seatTokens.includes(s.token));

      if (validSeats.length === 0) {
        return accu;
      }

      const potentialWinningHands = validSeats.map((s) => ({
        pocketCards: s.pocketCards,
        communityCards: table.communityCards,
      }));

      const winningHands = findHighestHands(potentialWinningHands);

      const winningSeats = winningHands.map(
        (hand) => validSeats[hand.candidateIndex],
      );
      const winningSeatTokens = winningSeats.map((s) => s.token);
      const chipsCountAwardedToWinners = Math.floor(
        pot.chipCount / winningHands.length,
      );
      const chipCountMoveToPot = pot.chipCount - chipsCountAwardedToWinners * winningHands.length;

      const seatsAfterAward = accu.table.seats.map((s) => {
        if (winningSeatTokens.includes(s.token)) {
          return {
            ...s,
            chipCount: s.chipCount + chipsCountAwardedToWinners,
          };
        }

        return s;
      });

      return {
        table: {
          ...accu.table,
          seats: seatsAfterAward.map((s) => {
            if (winningSeatTokens.includes(s.token)) {
              return {
                ...s,
                isWinner: true,
                winAmount: chipsCountAwardedToWinners,
              };
            }
            return s;
          }),
        },
        leftOverChips: accu.leftOverChips + chipCountMoveToPot,
      };
    },
    { table, leftOverChips: 0 },
  );

  return {
    ...splitPotsAwarded.table,
    activePot: {
      ...splitPotsAwarded.table.activePot,
      chipCount: splitPotsAwarded.leftOverChips,
    },
    splitPots: [],
  };
};

interface MoveBetsToPotOptions {}

export const moveBetsToPotMutator: TableMutatorFunction<MoveBetsToPotOptions> = ({
  table,
}): Table => {
  const splitPotTable = createSplitPotsMutator({ table, data: {} });

  const totalBetsFromRound = splitPotTable.seats.reduce((accu, s) => accu + s.chipsBetCount, 0);

  const remainingSeatTokens = splitPotTable.seats
    .filter((s) => !s.isBust && !s.isFolded && s.chipCount)
    .map((s) => s.token);

  const newPotChipCount = splitPotTable.activePot.chipCount + totalBetsFromRound;

  return {
    ...splitPotTable,
    activePot: { seatTokens: remainingSeatTokens, chipCount: newPotChipCount },
    seats: splitPotTable.seats.map((s) => ({ ...s, chipsBetCount: 0 })),
  };
};

interface CreateSplitPotsOptions {}

const createSplitPotsMutator: TableMutatorFunction<CreateSplitPotsOptions> = ({
  table,
}): Table => {
  const seatsThatWentAllInLowestToHighestBet = getSeatsThatWentAllInLowestToHighestBet(
    table,
  );

  if (!seatsThatWentAllInLowestToHighestBet.length) {
    // No split pots needed. Thank god, this shit is confusing
    return table;
  }

  // eslint-disable-next-line no-shadow
  return seatsThatWentAllInLowestToHighestBet.reduce((table, seat) => splitPotForSeatMutator({
    table,
    data: { seatToken: seat.token },
  }), table);
};

interface SplitPotForSeatOptions {
  seatToken: string;
}

const splitPotForSeatMutator: TableMutatorFunction<SplitPotForSeatOptions> = ({
  table,
  data,
}): Table => {
  const seat = table.seats.find((s) => s.token === data.seatToken);
  if (!seat) {
    return table;
  }

  const amountToBet = seat.chipsBetCount;

  const tableCopy = JSON.parse(JSON.stringify(table)) as Table;

  // Move chips from activePot to this new split pot.
  tableCopy.activePot.chipCount = 0;
  const newSplitPot = {
    chipCount: table.activePot.chipCount,
    seatTokens: table.seats
      .filter((s) => !s.isFolded && s.chipsBetCount)
      .map((s) => s.token),
  };

  table.seats.forEach((s, index) => {
    if (s.chipsBetCount >= amountToBet) {
      // @ts-ignore
      tableCopy.seats[index].chipsBetCount = s.chipsBetCount - amountToBet;
      newSplitPot.chipCount += amountToBet;
    } else if (s.isFolded) {
      newSplitPot.chipCount += tableCopy.seats[index].chipsBetCount;
      // @ts-ignore
      tableCopy.seats[index].chipsBetCount = 0;
    }
  });

  return {
    ...tableCopy,
    activePot: removeSeatTokenFromPot(
      tableCopy,
      data.seatToken,
      table.activePot,
    ),
    splitPots: [...table.splitPots, newSplitPot],
  };
};
