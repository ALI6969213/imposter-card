// Game Room Manager - handles all game state and logic

class GameManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> GameRoom
  }

  // Generate unique 4-digit code
  generateRoomCode() {
    let code;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (this.rooms.has(code));
    return code;
  }

  // Create a new game room
  createRoom(hostId, hostName) {
    const code = this.generateRoomCode();
    const room = {
      code,
      hostId,
      players: [{
        id: hostId,
        name: hostName,
        isHost: true,
        isConnected: true,
      }],
      phase: 'waiting', // waiting, deal, discussion, voting, results
      category: null,
      promptPair: null,
      imposterIndex: null,
      votes: {},
      eliminatedPlayerIndex: null,
      currentPlayerIndex: 0, // For deal phase
      currentVoterIndex: 0, // For voting phase
      createdAt: Date.now(),
    };
    this.rooms.set(code, room);
    return room;
  }

  // Join an existing room
  joinRoom(code, playerId, playerName) {
    const room = this.rooms.get(code);
    if (!room) {
      return { error: 'Room not found' };
    }
    if (room.phase !== 'waiting') {
      return { error: 'Game already in progress' };
    }
    if (room.players.length >= 12) {
      return { error: 'Room is full' };
    }
    if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      return { error: 'Name already taken' };
    }

    room.players.push({
      id: playerId,
      name: playerName,
      isHost: false,
      isConnected: true,
    });

    return { room };
  }

  // Leave a room
  leaveRoom(code, playerId) {
    const room = this.rooms.get(code);
    if (!room) return null;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return null;

    const wasHost = room.players[playerIndex].isHost;
    room.players.splice(playerIndex, 1);

    // If host left and there are other players, assign new host
    if (wasHost && room.players.length > 0) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].id;
    }

    // Delete room if empty
    if (room.players.length === 0) {
      this.rooms.delete(code);
      return null;
    }

    return room;
  }

  // Mark player as disconnected (for reconnection)
  disconnectPlayer(code, playerId) {
    const room = this.rooms.get(code);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
    }
    return room;
  }

  // Reconnect player
  reconnectPlayer(code, playerId) {
    const room = this.rooms.get(code);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = true;
    }
    return room;
  }

  // Start the game
  startGame(code, category, prompts) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };
    if (room.players.length < 3) return { error: 'Need at least 3 players' };

    // Select random prompt from category
    const categoryPrompts = prompts.filter(p => p.category === category);
    if (categoryPrompts.length === 0) return { error: 'Invalid category' };

    const promptPair = categoryPrompts[Math.floor(Math.random() * categoryPrompts.length)];
    const imposterIndex = Math.floor(Math.random() * room.players.length);

    room.category = category;
    room.promptPair = promptPair;
    room.imposterIndex = imposterIndex;
    room.phase = 'deal';
    room.currentPlayerIndex = 0;
    room.votes = {};
    room.eliminatedPlayerIndex = null;

    return { room };
  }

  // Get prompt for a specific player
  getPromptForPlayer(code, playerIndex) {
    const room = this.rooms.get(code);
    if (!room || !room.promptPair) return null;

    if (playerIndex === room.imposterIndex) {
      return room.promptPair.imposter;
    }
    return room.promptPair.majority;
  }

  // Advance deal phase
  advanceDeal(code) {
    const room = this.rooms.get(code);
    if (!room) return null;

    room.currentPlayerIndex++;
    if (room.currentPlayerIndex >= room.players.length) {
      room.phase = 'discussion';
    }
    return room;
  }

  // Start voting phase
  startVoting(code) {
    const room = this.rooms.get(code);
    if (!room) return null;

    room.phase = 'voting';
    room.currentVoterIndex = 0;
    room.votes = {};
    return room;
  }

  // Cast a vote
  castVote(code, voterIndex, votedForIndex) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };
    if (room.phase !== 'voting') return { error: 'Not in voting phase' };
    if (voterIndex === votedForIndex) return { error: 'Cannot vote for yourself' };
    if (room.votes[voterIndex] !== undefined) return { error: 'Already voted' };

    room.votes[voterIndex] = votedForIndex;
    room.currentVoterIndex++;

    // Check if all votes are in
    if (Object.keys(room.votes).length === room.players.length) {
      this.calculateResults(code);
    }

    return { room };
  }

  // Calculate voting results
  calculateResults(code) {
    const room = this.rooms.get(code);
    if (!room) return null;

    const voteCounts = {};
    Object.values(room.votes).forEach(votedFor => {
      voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
    });

    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const tiedPlayers = Object.entries(voteCounts)
      .filter(([_, count]) => count === maxVotes)
      .map(([index]) => parseInt(index));

    room.eliminatedPlayerIndex = tiedPlayers.length === 1
      ? tiedPlayers[0]
      : tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];

    room.phase = 'results';
    return room;
  }

  // Reset for new round (keep players)
  resetRound(code) {
    const room = this.rooms.get(code);
    if (!room) return null;

    room.phase = 'waiting';
    room.category = null;
    room.promptPair = null;
    room.imposterIndex = null;
    room.votes = {};
    room.eliminatedPlayerIndex = null;
    room.currentPlayerIndex = 0;
    room.currentVoterIndex = 0;

    return room;
  }

  // Get room by code
  getRoom(code) {
    return this.rooms.get(code);
  }

  // Clean up old rooms (call periodically)
  cleanupOldRooms(maxAgeMs = 3600000) { // 1 hour default
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (now - room.createdAt > maxAgeMs) {
        this.rooms.delete(code);
      }
    }
  }
}

module.exports = GameManager;
