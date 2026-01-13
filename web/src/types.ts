export type GamePhase = 'home' | 'lobby' | 'deal' | 'answering' | 'discussion' | 'voting' | 'results';

export type AppTheme = 'system' | 'light' | 'dark';

export interface Player {
  id: string;
  name: string;
}

export interface PromptPair {
  id: string;
  category: string;
  majority: string;
  imposter: string;
}

export interface GameState {
  players: Player[];
  currentPhase: GamePhase;
  currentCategory: string | null;
  currentPromptPair: PromptPair | null;
  imposterIndex: number | null;
  votes: Record<number, number>;
  eliminatedPlayerIndex: number | null;
}

export interface VoteResult {
  index: number;
  player: Player;
  votes: number;
}

export type NetPhase = 'waiting' | 'deal' | 'answering' | 'discussion' | 'voting' | 'results';

export interface NetPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  hasViewedCard?: boolean;
  hasAnswered?: boolean;
  hasVoted?: boolean;
}

export interface PlayerAnswer {
  name: string;
  answer: string;
  playerIndex: number;
}

export interface RoomSettings {
  answerTime: number;  // seconds
  votingTime: number;  // seconds
}

export interface NetRoom {
  code: string;
  hostId: string;
  players: NetPlayer[];
  phase: NetPhase;
  category: string | null;
  currentPlayerIndex: number;
  currentVoterIndex: number;
  votes: Record<number, number>;
  eliminatedPlayerIndex: number | null;
  hasPrompt: boolean;
  // Timer info
  timerEndTime: number | null;
  timerType: 'answering' | 'voting' | null;
  settings: RoomSettings;
  // Progress tracking
  viewedCount: number;
  answeredCount: number;
  votedCount: number;
  // Answers (available after answering phase)
  answers?: PlayerAnswer[];
  // Reveal info (only in results)
  imposterIndex?: number;
  promptPair?: PromptPair;
}
