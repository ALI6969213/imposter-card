import { io, Socket } from 'socket.io-client';
import type { NetRoom } from '../types';

const SERVER_URL = 'https://imposter-card.onrender.com';

interface CreateRoomResponse {
  success: boolean;
  room?: NetRoom;
  playerId?: string;
  error?: string;
}

interface JoinRoomResponse {
  success: boolean;
  room?: NetRoom;
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

      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        this.emit('disconnected', reason);
      });

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
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }
}

export const socketService = new SocketService();
