import { create } from 'zustand';
import type { NetRoom, NetPlayer, PlayerAnswer } from '../types';
import { socketService } from '../services/socketService';

type GamePhase = 'home' | 'join' | 'waiting' | 'deal' | 'answering' | 'discussion' | 'voting' | 'results';

interface MultiplayerState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  room: NetRoom | null;
  playerId: string | null;
  playerName: string | null;

  currentPhase: GamePhase;
  currentPrompt: string | null;
  hasSubmittedAnswer: boolean;

  connect: () => Promise<void>;
  disconnect: () => void;
  createRoom: (name: string) => Promise<{ success: boolean; error?: string }>;
  joinRoom: (code: string, name: string) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => void;
  updateSettings: (votingTime?: number, answerTime?: number) => Promise<void>;
  startGame: (category: string) => Promise<{ success: boolean; error?: string }>;
  requestPrompt: (playerIndex: number) => Promise<string | null>;
  cardViewed: () => void;
  submitAnswer: (answer: string) => Promise<boolean>;
  startVoting: () => Promise<void>;
  castVote: (voterIndex: number, votedForIndex: number) => Promise<boolean>;
  playAgain: () => Promise<void>;
  goToHome: () => void;
  goToJoin: () => void;

  isHost: () => boolean;
  getMyPlayerIndex: () => number;
  getTimeRemaining: () => number | null;
  getAnswers: () => PlayerAnswer[];
}

export const useMultiplayerStore = create<MultiplayerState>((set, get) => {
  socketService.on('player_joined', ({ players }: { players: NetPlayer[] }) => {
    const room = get().room;
    if (room) {
      set({ room: { ...room, players } });
    }
  });

  socketService.on('player_left', ({ players, newHostId }: { players: NetPlayer[]; newHostId: string }) => {
    const room = get().room;
    if (room) {
      set({ room: { ...room, players, hostId: newHostId } });
    }
  });

  socketService.on('game_started', ({ room }: { room: NetRoom }) => {
    set({ room, currentPhase: 'deal', hasSubmittedAnswer: false });
  });

  socketService.on('room_updated', ({ room }: { room: NetRoom }) => {
    let newPhase: GamePhase = get().currentPhase;

    if (room.phase === 'waiting') {
      newPhase = 'waiting';
      set({ hasSubmittedAnswer: false });
    }
    else if (room.phase === 'deal') newPhase = 'deal';
    else if (room.phase === 'answering') newPhase = 'answering';
    else if (room.phase === 'discussion') newPhase = 'discussion';
    else if (room.phase === 'voting') newPhase = 'voting';
    else if (room.phase === 'results') newPhase = 'results';

    set({ room, currentPhase: newPhase });
  });

  socketService.on('disconnected', () => {
    set({ isConnected: false });
  });

  return {
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    room: null,
    playerId: null,
    playerName: null,
    currentPhase: 'home',
    currentPrompt: null,
    hasSubmittedAnswer: false,

    connect: async () => {
      set({ isConnecting: true, connectionError: null });
      try {
        await socketService.connect();
        set({ isConnected: true, isConnecting: false });
      } catch {
        set({
          isConnected: false,
          isConnecting: false,
          connectionError: 'Failed to connect to server',
        });
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
        hasSubmittedAnswer: false,
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
        hasSubmittedAnswer: false,
      });
    },

    updateSettings: async (votingTime?: number, answerTime?: number) => {
      await socketService.updateSettings(votingTime, answerTime);
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

    submitAnswer: async (answer: string) => {
      const myIndex = get().getMyPlayerIndex();
      if (myIndex < 0) return false;
      
      const response = await socketService.submitAnswer(myIndex, answer);
      if (response.success) {
        set({ hasSubmittedAnswer: true });
      }
      return response.success;
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

    isHost: () => {
      const { room, playerId } = get();
      return room?.hostId === playerId;
    },

    getMyPlayerIndex: () => {
      const { room, playerId } = get();
      if (!room || !playerId) return -1;
      return room.players.findIndex((p) => p.id === playerId);
    },

    getTimeRemaining: () => {
      const { room } = get();
      if (!room?.timerEndTime) return null;
      return Math.max(0, Math.ceil((room.timerEndTime - Date.now()) / 1000));
    },

    getAnswers: () => {
      const { room } = get();
      return room?.answers || [];
    },
  };
});
