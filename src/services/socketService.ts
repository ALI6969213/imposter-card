import { io, Socket } from 'socket.io-client';

// ============================================
// SERVER URL CONFIGURATION
// ============================================
// Change this to your deployed server URL after deploying to Railway/Render
// Local development: 'http://localhost:3001'
// Production example: 'https://imposter-cards-server-production.up.railway.app'
// ============================================
const SERVER_URL = 'http://localhost:3001';
// ============================================

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  phase: 'waiting' | 'deal' | 'discussion' | 'voting' | 'results';
  category: string | null;
  currentPlayerIndex: number;
  currentVoterIndex: number;
  votes: Record<number, number>;
  eliminatedPlayerIndex: number | null;
  hasPrompt: boolean;
  imposterIndex?: number;
  promptPair?: {
    id: string;
    category: string;
    majority: string;
    imposter: string;
  };
}

type Callback<T> = (response: T) => void;

interface CreateRoomResponse {
  success: boolean;
  room?: Room;
  playerId?: string;
  error?: string;
}

interface JoinRoomResponse {
  success: boolean;
  room?: Room;
  playerId?: string;
  error?: string;
}

interface PromptResponse {
  success: boolean;
  prompt?: string;
  error?: string;
}

interface SimpleResponse {
  success: boolean;
  error?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      console.log('Connecting to server:', SERVER_URL);
      
      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
        this.emit('disconnected', reason);
      });

      // Forward room events to listeners
      this.socket.on('player_joined', (data) => this.emit('player_joined', data));
      this.socket.on('player_left', (data) => this.emit('player_left', data));
      this.socket.on('game_started', (data) => this.emit('game_started', data));
      this.socket.on('room_updated', (data) => this.emit('room_updated', data));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Room management
  createRoom(name: string): Promise<CreateRoomResponse> {
    return new Promise((resolve) => {
      this.socket?.emit('create_room', { name }, (response: CreateRoomResponse) => {
        resolve(response);
      });
    });
  }

  joinRoom(code: string, name: string): Promise<JoinRoomResponse> {
    return new Promise((resolve) => {
      this.socket?.emit('join_room', { code, name }, (response: JoinRoomResponse) => {
        resolve(response);
      });
    });
  }

  leaveRoom(): void {
    this.socket?.emit('leave_room');
  }

  // Game actions
  startGame(category: string): Promise<SimpleResponse> {
    return new Promise((resolve) => {
      this.socket?.emit('start_game', { category }, (response: SimpleResponse) => {
        resolve(response);
      });
    });
  }

  requestPrompt(playerIndex: number): Promise<PromptResponse> {
    return new Promise((resolve) => {
      this.socket?.emit('request_prompt', { playerIndex }, (response: PromptResponse) => {
        resolve(response);
      });
    });
  }

  cardViewed(): void {
    this.socket?.emit('card_viewed');
  }

  startVoting(): Promise<SimpleResponse> {
    return new Promise((resolve) => {
      this.socket?.emit('start_voting', (response: SimpleResponse) => {
        resolve(response);
      });
    });
  }

  castVote(voterIndex: number, votedForIndex: number): Promise<SimpleResponse> {
    return new Promise((resolve) => {
      this.socket?.emit('cast_vote', { voterIndex, votedForIndex }, (response: SimpleResponse) => {
        resolve(response);
      });
    });
  }

  playAgain(): Promise<SimpleResponse> {
    return new Promise((resolve) => {
      this.socket?.emit('play_again', (response: SimpleResponse) => {
        resolve(response);
      });
    });
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const socketService = new SocketService();
