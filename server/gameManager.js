// Game Room Manager - handles all game state and logic
const PromptGenerator = require('./promptGenerator');

class GameManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> GameRoom
    this.promptGenerator = new PromptGenerator();
    this.timers = new Map(); // roomCode -> timer
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
      phase: 'waiting', // waiting, deal, answering, discussion, voting, results
      category: null,
      promptPair: null,
      imposterIndex: null,
      votes: {},
      answers: {}, // playerIndex -> answer
      eliminatedPlayerIndex: null,
      currentPlayerIndex: 0,
      currentVoterIndex: 0,
      createdAt: Date.now(),
      // Timer settings (in seconds)
      settings: {
        answerTime: 30,    // 30 seconds to answer
        votingTime: 60,    // 60 seconds to vote (configurable by host)
      },
      // Timer state
      timerEndTime: null,
      timerType: null, // 'answering' or 'voting'
    };
    this.rooms.set(code, room);
    return room;
  }

  // Update room settings
  updateSettings(code, settings) {
    const room = this.rooms.get(code);
    if (!room) return null;
    
    if (settings.votingTime !== undefined) {
      room.settings.votingTime = Math.max(15, Math.min(300, settings.votingTime)); // 15s - 5min
    }
    if (settings.answerTime !== undefined) {
      room.settings.answerTime = Math.max(15, Math.min(120, settings.answerTime)); // 15s - 2min
    }
    
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
      this.clearTimer(code);
      this.rooms.delete(code);
      return null;
    }

    return room;
  }

  // Start the game with dynamic prompts
  startGame(code, category) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };
    if (room.players.length < 3) return { error: 'Need at least 3 players' };

    // Generate dynamic prompt
    const promptPair = this.promptGenerator.generate(category);
    const imposterIndex = Math.floor(Math.random() * room.players.length);

    room.category = category || 'spicy';
    room.promptPair = promptPair;
    room.imposterIndex = imposterIndex;
    room.phase = 'deal';
    room.currentPlayerIndex = 0;
    room.viewedCards = new Set(); // Track who has viewed their card
    room.votes = {};
    room.answers = {};
    room.eliminatedPlayerIndex = null;
    room.timerEndTime = null;
    room.timerType = null;

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

  // All players viewed cards - start answering phase
  startAnswering(code, onTimeout) {
    const room = this.rooms.get(code);
    if (!room) return null;

    room.phase = 'answering';
    room.answers = {};
    
    // Set timer
    const endTime = Date.now() + (room.settings.answerTime * 1000);
    room.timerEndTime = endTime;
    room.timerType = 'answering';
    
    // Set timeout
    this.clearTimer(code);
    const timer = setTimeout(() => {
      this.endAnswering(code);
      if (onTimeout) onTimeout(code, this.rooms.get(code));
    }, room.settings.answerTime * 1000);
    this.timers.set(code, timer);

    return room;
  }

  // Submit answer
  submitAnswer(code, playerIndex, answer) {
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found' };
    if (room.phase !== 'answering') return { error: 'Not in answering phase' };
    if (room.answers[playerIndex] !== undefined) return { error: 'Already answered' };
    
    room.answers[playerIndex] = answer.trim().substring(0, 280); // Max 280 chars

    // Check if all answered
    const allAnswered = room.players.every((_, idx) => room.answers[idx] !== undefined);
    
    return { room, allAnswered };
  }

  // End answering phase
  endAnswering(code) {
    const room = this.rooms.get(code);
    if (!room) return null;
    
    this.clearTimer(code);
    
    // Fill in empty answers
    room.players.forEach((_, idx) => {
      if (room.answers[idx] === undefined) {
        room.answers[idx] = "(No answer submitted)";
      }
    });
    
    room.phase = 'discussion';
    room.timerEndTime = null;
    room.timerType = null;
    
    return room;
  }

  // Get all answers (for discussion phase)
  getAnswers(code) {
    const room = this.rooms.get(code);
    if (!room) return null;
    
    return room.players.map((player, idx) => ({
      name: player.name,
      answer: room.answers[idx] || "(No answer)",
    }));
  }

  // Start voting phase with timer
  startVoting(code, onTimeout) {
    const room = this.rooms.get(code);
    if (!room) return null;

    room.phase = 'voting';
    room.currentVoterIndex = 0;
    room.votes = {};
    
    // Set timer
    const endTime = Date.now() + (room.settings.votingTime * 1000);
    room.timerEndTime = endTime;
    room.timerType = 'voting';
    
    // Set timeout
    this.clearTimer(code);
    const timer = setTimeout(() => {
      this.endVoting(code);
      if (onTimeout) onTimeout(code, this.rooms.get(code));
    }, room.settings.votingTime * 1000);
    this.timers.set(code, timer);

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
    const allVoted = Object.keys(room.votes).length === room.players.length;

    return { room, allVoted };
  }

  // End voting and calculate results
  endVoting(code) {
    const room = this.rooms.get(code);
    if (!room) return null;
    
    this.clearTimer(code);
    this.calculateResults(code);
    
    return room;
  }

  // Calculate voting results
  calculateResults(code) {
    const room = this.rooms.get(code);
    if (!room) return null;

    const voteCounts = {};
    Object.values(room.votes).forEach(votedFor => {
      voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
    });

    // If no votes, pick random
    if (Object.keys(voteCounts).length === 0) {
      room.eliminatedPlayerIndex = Math.floor(Math.random() * room.players.length);
    } else {
      const maxVotes = Math.max(...Object.values(voteCounts), 0);
      const tiedPlayers = Object.entries(voteCounts)
        .filter(([_, count]) => count === maxVotes)
        .map(([index]) => parseInt(index));

      room.eliminatedPlayerIndex = tiedPlayers.length === 1
        ? tiedPlayers[0]
        : tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
    }

    room.phase = 'results';
    room.timerEndTime = null;
    room.timerType = null;
    
    return room;
  }

  // Reset for new round (keep players)
  resetRound(code) {
    const room = this.rooms.get(code);
    if (!room) return null;

    this.clearTimer(code);
    
    room.phase = 'waiting';
    room.category = null;
    room.promptPair = null;
    room.imposterIndex = null;
    room.votes = {};
    room.answers = {};
    room.viewedCards = new Set();
    room.eliminatedPlayerIndex = null;
    room.currentPlayerIndex = 0;
    room.currentVoterIndex = 0;
    room.timerEndTime = null;
    room.timerType = null;

    return room;
  }

  // Mark player as viewed their card
  playerViewedCard(code, playerId) {
    const room = this.rooms.get(code);
    if (!room) return null;

    // Initialize viewedCards set if needed
    if (!room.viewedCards) {
      room.viewedCards = new Set();
    }

    // Add this player to viewed set
    room.viewedCards.add(playerId);
    room.currentPlayerIndex = room.viewedCards.size;
    
    // Check if all players have viewed
    const allViewed = room.viewedCards.size >= room.players.length;
    
    return { room, allViewed };
  }

  // Get room by code
  getRoom(code) {
    return this.rooms.get(code);
  }

  // Clear timer for room
  clearTimer(code) {
    const timer = this.timers.get(code);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(code);
    }
  }

  // Get time remaining for current phase
  getTimeRemaining(code) {
    const room = this.rooms.get(code);
    if (!room || !room.timerEndTime) return null;
    
    return Math.max(0, Math.ceil((room.timerEndTime - Date.now()) / 1000));
  }

  // Clean up old rooms
  cleanupOldRooms(maxAgeMs = 3600000) {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (now - room.createdAt > maxAgeMs) {
        this.clearTimer(code);
        this.rooms.delete(code);
      }
    }
  }
}

module.exports = GameManager;
