import { Cards } from '@pairjacks/poker-cards';

type BettingRound = 'pre-deal' | 'pre-flop' | 'flop' | 'turn' | 'river';

export interface Pot {
  seatTokens: string[];
  chipCount: number;
}

export interface Seat {
  readonly winAmount: number;
  readonly isWinner: boolean;
  isActive: boolean;
  readonly token: string;
  readonly isEmpty: boolean;
  readonly chipCount: number;
  readonly displayName: string;
  readonly pocketCards: Cards;
  readonly chipsBetCount: number;
  readonly isFolded: boolean;
  readonly isBust: boolean;
}

/**
 * Table contains the entire state of a poker table
 * it knows everything. This should never be directly
 * exposed to the client
 */
export interface Table {
  isPaused: boolean;
  readonly hostSeatToken: string;
  readonly isStarted: boolean;
  readonly name: string;
  readonly smallBlind: number;
  readonly bettingRound: BettingRound;
  readonly activePot: Pot;
  readonly splitPots: Pot[];
  readonly maxBetChipCount: number;
  readonly highlightRelevantCards: boolean;

  readonly dealerIndex: number;
  readonly roundTerminatingSeatIndex: number;
  readonly turnToBetIndex?: number;
  readonly revealPocketIndeces: number[];
  readonly lastSeatTokenToBetOnTheRiver?: string;

  readonly seats: Seat[];

  readonly deck: Cards;
  readonly communityCards: Cards;
}
