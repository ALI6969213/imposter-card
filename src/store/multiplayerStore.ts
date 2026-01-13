import { create } from 'zustand';
import { socketService, Room, Player } from '../services/socketService';

type GamePhase = 'home' | 'join' | 'waiting' | 'deal' | 'discussion' | 'voting' | 'results';

interface MultiplayerState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Room state
  room: Room | null;
  playerId: string | null;
  playerName: string | null;
  
  // UI state
  currentPhase: GamePhase;
  currentPrompt: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  createRoom: (name: string) => Promise<{ success: boolean; error?: string }>;
  joinRoom: (code: string, name: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => void;
  startGame: (category: string) => Promise<{ success: boolean; error?: string }>;
  requestPrompt: (playerIndex: number) => Promise<string | null>;
  cardViewed: () => void;
  startVoting: () => Promise<void>;
  castVote: (voterIndex: number, votedForIndex: number) => Promise<boolean>;
  playAgain: () => Promise<void>;
  goToHome: () => void;
  goToJoin: () => void;
  
  // Computed
  isHost: () => boolean;
  getMyPlayerIndex: () => number;
  getCategories: () => string[];
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => {
  // Set up socket event listeners
  socketService.on('player_joined', ({ players }: { players: Player[] }) => {
    const room = get().room;
    if (room) {
      set({ room: { ...room, players } });
    }
  });

  socketService.on('player_left', ({ players, newHostId }: { players: Player[]; newHostId: string }) => {
    const room = get().room;
    if (room) {
      set({ room: { ...room, players, hostId: newHostId } });
    }
  });

  socketService.on('game_started', ({ room }: { room: Room }) => {
    set({ room, currentPhase: 'deal' });
  });

  socketService.on('room_updated', ({ room }: { room: Room }) => {
    const currentPhase = get().currentPhase;
    let newPhase: GamePhase = currentPhase;
    
    // Map server phase to client phase
    if (room.phase === 'waiting') newPhase = 'waiting';
    else if (room.phase === 'deal') newPhase = 'deal';
    else if (room.phase === 'discussion') newPhase = 'discussion';
    else if (room.phase === 'voting') newPhase = 'voting';
    else if (room.phase === 'results') newPhase = 'results';
    
    set({ room, currentPhase: newPhase });
  });

  socketService.on('disconnected', () => {
    set({ isConnected: false });
  });

  return {
    // Initial state
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    room: null,
    playerId: null,
    playerName: null,
    currentPhase: 'home',
    currentPrompt: null,

    // Actions
    connect: async () => {
      set({ isConnecting: true, connectionError: null });
      try {
        await socketService.connect();
        set({ isConnected: true, isConnecting: false });
      } catch (error) {
        set({
          isConnected: false,
          isConnecting: false,
          connectionError: 'Failed to connect to server',
        });
        throw error;
      }
    },

    disconnect: () => {
      socketService.disconnect();
      set({
        isConnected: false,
        room: null,
        playerId: null,
        playerName: null,
        currentPhase: 'home',
        currentPrompt: null,
      });
    },

    createRoom: async (name: string) => {
      const response = await socketService.createRoom(name);
      if (response.success && response.room && response.playerId) {
        set({
          room: response.room,
          playerId: response.playerId,
          playerName: name,
          currentPhase: 'waiting',
        });
        return { success: true };
      }
      return { success: false, error: response.error || 'Failed to create room' };
    },

    joinRoom: async (code: string, name: string) => {
      const response = await socketService.joinRoom(code, name);
      if (response.success && response.room && response.playerId) {
        set({
          room: response.room,
          playerId: response.playerId,
          playerName: name,
          currentPhase: 'waiting',
        });
        return { success: true };
      }
      return { success: false, error: response.error || 'Failed to join room' };
    },

    leaveRoom: () => {
      socketService.leaveRoom();
      set({
        room: null,
        playerId: null,
        currentPhase: 'home',
        currentPrompt: null,
      });
    },

    startGame: async (category: string) => {
      const response = await socketService.startGame(category);
      return { success: response.success, error: response.error };
    },

    requestPrompt: async (playerIndex: number) => {
      const response = await socketService.requestPrompt(playerIndex);
      if (response.success && response.prompt) {
        set({ currentPrompt: response.prompt });
        return response.prompt;
      }
      return null;
    },

    cardViewed: () => {
      socketService.cardViewed();
    },

    startVoting: async () => {
      await socketService.startVoting();
    },

    castVote: async (voterIndex: number, votedForIndex: number) => {
      const response = await socketService.castVote(voterIndex, votedForIndex);
      return response.success;
    },

    playAgain: async () => {
      await socketService.playAgain();
    },

    goToHome: () => {
      get().leaveRoom();
      set({ currentPhase: 'home' });
    },

    goToJoin: () => {
      set({ currentPhase: 'join' });
    },

    // Computed
    isHost: () => {
      const { room, playerId } = get();
      return room?.hostId === playerId;
    },

    getMyPlayerIndex: () => {
      const { room, playerId } = get();
      if (!room || !playerId) return -1;
      return room.players.findIndex(p => p.id === playerId);
    },

    getCategories: () => {
      // Import prompts and get unique categories
      const prompts = require('../data/prompts.json');
      const categories = new Set(prompts.map((p: any) => p.category));
      return Array.from(categories).sort() as string[];
    },
  };
});
