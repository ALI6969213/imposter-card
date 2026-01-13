import { create } from 'zustand';
import prompts from '../data/prompts.json';
import type { AppTheme, GamePhase, GameState, Player, PromptPair } from '../types';

interface GameStore extends GameState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;

  setPhase: (phase: GamePhase) => void;
  goToHome: () => void;
  goToLobby: () => void;
  goToDeal: () => void;
  goToDiscussion: () => void;
  goToVoting: () => void;
  goToResults: () => void;

  configurePlayers: (names: string[]) => void;
  startRound: (category: string) => boolean;
  advancePhase: () => void;
  resetGame: () => void;

  getCategories: () => string[];
  promptForPlayer: (index: number) => string | null;

  castVote: (voterIndex: number, votedForIndex: number) => boolean;
  hasVoted: (voterIndex: number) => boolean;
  allVotesCast: () => boolean;
  getVoteTally: () => Record<number, number>;
  isImposterEliminated: () => boolean;
}

const generateId = () => crypto.randomUUID();

export const useGameStore = create<GameStore>((set, get) => ({
  players: [],
  currentPhase: 'home',
  currentCategory: null,
  currentPromptPair: null,
  imposterIndex: null,
  votes: {},
  eliminatedPlayerIndex: null,
  theme: 'dark',

  setTheme: (theme) => set({ theme }),

  setPhase: (phase) => set({ currentPhase: phase }),
  goToHome: () => set({ currentPhase: 'home' }),
  goToLobby: () => set({ currentPhase: 'lobby' }),
  goToDeal: () => set({ currentPhase: 'deal' }),
  goToDiscussion: () => set({ currentPhase: 'discussion' }),
  goToVoting: () => set({ currentPhase: 'voting' }),
  goToResults: () => set({ currentPhase: 'results' }),

  configurePlayers: (names) => {
    const trimmedNames = names
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    const players: Player[] = trimmedNames.map((name) => ({
      id: generateId(),
      name,
    }));

    set({ players });
  },

  startRound: (category) => {
    const state = get();
    const categoryPrompts = (prompts as PromptPair[]).filter((p) => p.category === category);

    if (categoryPrompts.length === 0 || state.players.length === 0) {
      return false;
    }

    const randomPrompt = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
    const imposterIndex = Math.floor(Math.random() * state.players.length);

    set({
      currentCategory: category,
      currentPromptPair: randomPrompt,
      imposterIndex,
      votes: {},
      eliminatedPlayerIndex: null,
      currentPhase: 'deal',
    });

    return true;
  },

  advancePhase: () => {
    const state = get();

    switch (state.currentPhase) {
      case 'lobby':
        set({ currentPhase: 'deal' });
        break;
      case 'deal':
        set({ currentPhase: 'discussion' });
        break;
      case 'discussion':
        set({ currentPhase: 'voting' });
        break;
      case 'voting': {
        const votes = state.votes;
        const voteCounts: Record<number, number> = {};

        Object.values(votes).forEach((votedForIndex) => {
          voteCounts[votedForIndex] = (voteCounts[votedForIndex] || 0) + 1;
        });

        const maxVotes = Math.max(...Object.values(voteCounts), 0);
        const tiedPlayers = Object.entries(voteCounts)
          .filter(([, count]) => count === maxVotes)
          .map(([index]) => parseInt(index, 10));

        const eliminatedIndex =
          tiedPlayers.length === 1
            ? tiedPlayers[0]
            : tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];

        set({
          eliminatedPlayerIndex: eliminatedIndex,
          currentPhase: 'results',
        });
        break;
      }
      default:
        break;
    }
  },

  resetGame: () => {
    set({
      players: [],
      currentPhase: 'lobby',
      currentCategory: null,
      currentPromptPair: null,
      imposterIndex: null,
      votes: {},
      eliminatedPlayerIndex: null,
    });
  },

  getCategories: () => {
    const categories = new Set((prompts as PromptPair[]).map((p) => p.category));
    return Array.from(categories).sort();
  },

  promptForPlayer: (index) => {
    const state = get();

    if (!state.currentPromptPair || index < 0 || index >= state.players.length) {
      return null;
    }

    if (index === state.imposterIndex) {
      return state.currentPromptPair.imposter;
    }

    return state.currentPromptPair.majority;
  },

  castVote: (voterIndex, votedForIndex) => {
    const state = get();

    if (
      voterIndex < 0 ||
      voterIndex >= state.players.length ||
      votedForIndex < 0 ||
      votedForIndex >= state.players.length ||
      voterIndex === votedForIndex ||
      state.votes[voterIndex] !== undefined ||
      state.currentPhase !== 'voting'
    ) {
      return false;
    }

    set({ votes: { ...state.votes, [voterIndex]: votedForIndex } });
    return true;
  },

  hasVoted: (voterIndex) => get().votes[voterIndex] !== undefined,

  allVotesCast: () => {
    const state = get();
    return Object.keys(state.votes).length === state.players.length;
  },

  getVoteTally: () => {
    const votes = get().votes;
    const tally: Record<number, number> = {};

    Object.values(votes).forEach((votedForIndex) => {
      tally[votedForIndex] = (tally[votedForIndex] || 0) + 1;
    });

    return tally;
  },

  isImposterEliminated: () => {
    const state = get();
    return state.imposterIndex === state.eliminatedPlayerIndex;
  },
}));
