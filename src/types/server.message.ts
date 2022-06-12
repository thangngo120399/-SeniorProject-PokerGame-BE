import { Cards } from '@pairjacks/poker-cards';

export interface ClientPot {
  players: string[];
  chipCount: number;
}

export interface Seat {
  readonly winAmount: number;
  readonly isHost: boolean;
  readonly isWinner: boolean;
  readonly isActive: boolean;
  readonly token: string;
  readonly isEmpty: boolean;
  readonly isDealer: boolean;
  readonly isTurnToBet: boolean;
  readonly isFolded: boolean;
  readonly isBust: boolean;
  readonly chipCount: number;
  readonly chipsBetCount: number;
  readonly displayName: string;
  readonly pocketCards?: Cards;
}

type BettingRound = 'pre-deal' | 'pre-flop' | 'flop' | 'turn' | 'river';

export interface LimitedTable {
  readonly isPaused: boolean;
  readonly isStarted: boolean;
  readonly name: string;
  readonly bettingRound: BettingRound;
  readonly activePot: ClientPot;
  readonly splitPots: ClientPot[];
  readonly seats: Seat[];
  readonly communityCards: Cards;
  readonly maxBetChipCount: number;
  readonly highlightRelevantCards: boolean;
  readonly currentUser: {
    seatToken: string;
    isHost: boolean;
  };
}

/**
* Messages
*/
export interface ServerTableStateMessage {
  type: 'server/table-state';
  table?: LimitedTable;
}

export interface ServerPauseGameMessage {
  type: 'server/pause-game';
}

export interface ServerResumeGameMessage {
  type: 'server/resume-game';
}

export interface ServerCountDownMessage {
  type: 'server/countdown';
  timeLeft: number;
}

export interface ServerSendMessage {
  type: 'server/send-message';
  messages: {username: string, text: string}[];
}
