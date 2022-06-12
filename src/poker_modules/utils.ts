/* eslint-disable no-plusplus */
import { ClientPot, LimitedTable } from '../types/server.message';
import { Pot, Seat, Table } from '../types/Table.interface';

export const stripPrivateTableDataForSeat = (table: Table, playerSeatToken: string)
: LimitedTable => {
  const potToClientPot = (pot: Pot): ClientPot => {
    const players = pot.seatTokens.map((seatToken) => {
      const seat = table.seats.find((s) => s.token === seatToken);

      return seat?.displayName || 'unknown player';
    });

    return {
      players,
      chipCount: pot.chipCount,
    };
  };

  return {
    isPaused: table.isPaused,
    isStarted: table.isStarted,
    name: table.name,
    bettingRound: table.bettingRound,
    activePot: potToClientPot(table.activePot),
    splitPots: table.splitPots.map((sp) => potToClientPot(sp)),
    communityCards: table.communityCards,
    maxBetChipCount: table.maxBetChipCount,
    highlightRelevantCards: table.highlightRelevantCards,
    seats: table.seats.map((s, index) => ({
      winAmount: s.winAmount,
      isHost: s.token === table.hostSeatToken,
      isWinner: s.isWinner,
      isActive: s.isActive,
      token: s.token,
      isEmpty: s.isEmpty,
      displayName: s.displayName,
      isDealer: index === table.dealerIndex,
      isTurnToBet: index === table.turnToBetIndex,
      isFolded: s.isFolded,
      isBust: s.isBust,
      chipCount: s.chipCount,
      chipsBetCount: s.chipsBetCount,
      pocketCards:
        ((s.token === playerSeatToken) || table.revealPocketIndeces.includes(index))
          ? s.pocketCards : undefined,
    })),
    currentUser: {
      isHost: playerSeatToken === table.hostSeatToken,
      seatToken: playerSeatToken,
    },
  };
};

export const randomDisplayName = () => {
  const emojis = [
    '👨‍🎨',
    '🕵️‍♂️',
    '🎃',
    '😈',
    '👹',
    '😼',
    '💂‍♀️',
    '👩‍⚕️',
    '👨‍🌾',
    '👮‍♂️',
    '🧕',
    '🧑‍🍳',
    '🧑‍🎤',
    '👩‍🎤',
    '👨‍🎤',
    '👩‍🎓',
    '👩‍🏫',
    '👨‍🚀',
    '👸🏻',
    '🤴',
    '🦹‍♂️',
    '🦸‍♀️',
    '🤶',
    '🎅',
    '🧜🏻‍♀️',
    '🧙‍♂️',
    '🧝‍♀️',
    '🧝',
    '🧛‍♂️',
    '🧟‍♂️',
    '🧞‍♂️',
    '💃',
    '🕺',
    '🧖‍♂️',
    '🦊',
    '🐯',
    '🐸',
    '🐨',
    '🐙',
    '🐮',
    '🦖',
    '🤡',
    '👽',
    '🤖',
    '👩‍🚒',
  ];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

/**
 * mod function that works correctly with negative numbers.
 * https://web.archive.org/web/20090717035140if_/javascript.about.com/od/problemsolving/a/modulobug.htm
 */
// eslint-disable-next-line no-shadow
export const mod = (n: number, mod: number) => ((n % mod) + mod) % mod;

export const removeSeatTokenFromPot = (
  table: Table,
  seatToken: string,
  pot: Pot,
): Pot => ({
  ...pot,
  seatTokens: table.activePot.seatTokens.filter((t) => t !== seatToken),
});

/**
 * Returns the index of the player whose turn it is next
 * Ignores players who have folded already.
 */
export const nextPlayerTurnIndex = (table: Table): number => {
  if (
    !table.turnToBetIndex
    || table.turnToBetIndex === table.seats.length - 1
  ) {
    // It's currently the last players turn. Give turn to index 0;
    return 0;
  }

  return table.turnToBetIndex + 1;
};

// eslint-disable-next-line max-len
export const findHighestBetAtTable = (table: Table): number => table.seats.reduce((accu, seat) => (seat.chipsBetCount > accu ? seat.chipsBetCount : accu), 0);

export const isBettingStillPossibleThisHand = (table: Table): boolean => {
  const seatsThatCouldStillPotentiallDoShit = table.seats.filter(
    (s) => !s.isFolded && !s.isBust && s.chipCount,
  );

  if (seatsThatCouldStillPotentiallDoShit.length > 1) {
    return true;
  }

  const highestBet = findHighestBetAtTable(table);

  const seatsThatCouldStillDoShitThisRound = seatsThatCouldStillPotentiallDoShit.filter(
    (s) => s.chipsBetCount < highestBet,
  );

  if (seatsThatCouldStillDoShitThisRound.length) {
    return true;
  }

  return false;
};

const indexOfFirstSeatToRightOfIndex = (table: Table, seatIndex: number) => {
  const indexToTheRight = mod(seatIndex - 1, table.seats.length);
  return indexToTheRight;
};

export const indexOfFirstNonBustSeatToRightOfIndex = (
  table: Table,
  index: number,
) => {
  let counter = 0;
  let nextPotentialPlayerIndex = indexOfFirstSeatToRightOfIndex(table, index);
  while (counter < table.seats.length) {
    if (!table.seats[nextPotentialPlayerIndex].isBust) {
      return nextPotentialPlayerIndex;
    }

    nextPotentialPlayerIndex = indexOfFirstSeatToRightOfIndex(
      table,
      nextPotentialPlayerIndex,
    );

    counter++;
  }

  return index;
};

export const indexOfFirstNonFoldedNonAllInSeatRightOfSeatIndex = (
  table: Table,
  index: number,
): number => {
  let counter = 0;
  let nextPotentialPlayerIndex = indexOfFirstNonBustSeatToRightOfIndex(
    table,
    index,
  );
  while (counter < table.seats.length) {
    const seat = table.seats[nextPotentialPlayerIndex];

    if (!seat.isFolded && seat.chipCount) {
      return nextPotentialPlayerIndex;
    }

    nextPotentialPlayerIndex = indexOfFirstNonBustSeatToRightOfIndex(
      table,
      nextPotentialPlayerIndex,
    );

    counter++;
  }

  return index;
};

const indexOfFirstSeatToLeftOfIndex = (table: Table, seatIndex: number) => {
  const indexToTheRight = mod(seatIndex + 1, table.seats.length);
  return indexToTheRight;
};

export const indexOfFirstNonBustSeatToLeftOfIndex = (
  table: Table,
  index: number,
) => {
  let counter = 0;
  let nextPotentialPlayerIndex = indexOfFirstSeatToLeftOfIndex(table, index);
  while (counter < table.seats.length) {
    if (!table.seats[nextPotentialPlayerIndex].isBust) {
      return nextPotentialPlayerIndex;
    }

    nextPotentialPlayerIndex = indexOfFirstSeatToLeftOfIndex(
      table,
      nextPotentialPlayerIndex,
    );

    counter++;
  }

  return index;
};

export const indexOfFirstNonFoldedNonAllInSeatLeftOfSeatIndex = (
  table: Table,
  index: number,
): number => {
  let counter = 0;
  let nextPotentialPlayerIndex = indexOfFirstNonBustSeatToLeftOfIndex(
    table,
    index,
  );
  while (counter < table.seats.length) {
    const seat = table.seats[nextPotentialPlayerIndex];

    if (!seat.isFolded && seat.chipCount > 0) {
      return nextPotentialPlayerIndex;
    }

    nextPotentialPlayerIndex = indexOfFirstNonBustSeatToLeftOfIndex(
      table,
      nextPotentialPlayerIndex,
    );

    counter++;
  }

  return index;
};

export const getSeatsThatWentAllInLowestToHighestBet = (
  table: Table,
): Seat[] => {
  const seats = table.seats.filter((s) => s.chipsBetCount && s.chipCount === 0);

  seats.sort((s1, s2) => s1.chipsBetCount - s2.chipsBetCount);

  return seats;
};
