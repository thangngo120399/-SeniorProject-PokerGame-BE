export interface ClientCreateTableMessage {
  type: 'client/create-table';
  tableName: string;
  numberOfSeats: number;
  startingChipCount: number;
  smallBlind: number;
  highlightRelevantCards: boolean;
}
export interface ClientJoinTableMessage {
  type: 'client/join-table';
  tableName: string;
  seatToken: string;
}
export interface ClientLeaveTableMessage {
  type: 'client/leave-table';
  tableName: string;
  seatToken: string;
}
export interface ClientRequestTableStateMessage {
  type: 'client/request-table-state';
  tableName: string;
  seatToken: string;
}
export interface ClientStartGameMessage {
  type: 'client/start-game';
  tableName: string;
  seatToken: string;
}
export interface ClientDealMessage {
  type: 'client/deal';
  tableName: string;
  seatToken: string;
}
export interface ClientPlaceBetMessage {
  type: 'client/place-bet';
  tableName: string;
  seatToken: string;
  chipCount: number;
}
export interface ClientFoldMessage {
  type: 'client/fold';
  tableName: string;
  seatToken: string;
}
export interface ClientCallMessage {
  type: 'client/call';
  tableName: string;
  seatToken: string;
}
export interface ClientCheckMessage {
  type: 'client/check';
  tableName: string;
  seatToken: string;
}
export interface ClientChangeDisplayNameMessage {
  type: 'client/change-display-name';
  tableName: string;
  seatToken: string;
  displayName: string;
}

export interface ClientPauseGame {
  type: 'client/pause-game';
  tableName: string;
}

export interface ClientResumeGame {
  type: 'client/resume-game'
  tableName: string;
}

export interface ClientSendMessage {
  type: 'client/send-message';
  tableName: string;
  text: string;
  seatToken: string;
}

export interface ClientKickPlayer {
  type: 'client/kick';
  tableName: string;
  playerTokenToKick: string;
  seatToken: string;
}
