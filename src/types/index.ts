export type GamePhase = 'home' | 'lobby' | 'deal' | 'discussion' | 'voting' | 'results';

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
  votes: Record<number, number>; // voterIndex: votedForIndex
  eliminatedPlayerIndex: number | null;
}

export interface VoteResult {
  index: number;
  player: Player;
  votes: number;
}
