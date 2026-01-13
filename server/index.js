const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const gameManager = new GameManager();

// Clean up old rooms every 30 minutes
setInterval(() => {
  gameManager.cleanupOldRooms();
}, 1800000);

// REST endpoint for health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: gameManager.rooms.size });
});

// Broadcast room update to all players
function broadcastRoomUpdate(roomCode, room) {
  io.to(roomCode).emit('room_updated', { room: sanitizeRoom(room) });
}

// Broadcast timer tick
function broadcastTimerTick(roomCode, timeRemaining) {
  io.to(roomCode).emit('timer_tick', { timeRemaining });
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  let currentRoom = null;
  let playerName = null;

  // Create a new room
  socket.on('create_room', ({ name }, callback) => {
    playerName = name;
    const room = gameManager.createRoom(socket.id, name);
    currentRoom = room.code;
    socket.join(room.code);
    
    console.log(`Room ${room.code} created by ${name}`);
    callback({ success: true, room: sanitizeRoom(room), playerId: socket.id });
  });

  // Update room settings (host only)
  socket.on('update_settings', ({ votingTime, answerTime }, callback) => {
    if (!currentRoom) {
      callback?.({ success: false, error: 'Not in a room' });
      return;
    }

    const room = gameManager.getRoom(currentRoom);
    if (!room || room.hostId !== socket.id) {
      callback?.({ success: false, error: 'Only host can change settings' });
      return;
    }

    const updatedRoom = gameManager.updateSettings(currentRoom, { votingTime, answerTime });
    if (updatedRoom) {
      broadcastRoomUpdate(currentRoom, updatedRoom);
      callback?.({ success: true });
    }
  });

  // Join an existing room
  socket.on('join_room', ({ code, name }, callback) => {
    const result = gameManager.joinRoom(code, socket.id, name);
    
    if (result.error) {
      callback({ success: false, error: result.error });
      return;
    }

    playerName = name;
    currentRoom = code;
    socket.join(code);
    
    // Notify others in the room
    socket.to(code).emit('player_joined', {
      player: { id: socket.id, name, isHost: false, isConnected: true },
      players: result.room.players,
    });
    
    console.log(`${name} joined room ${code}`);
    callback({ success: true, room: sanitizeRoom(result.room), playerId: socket.id });
  });

  // Start the game (host only)
  socket.on('start_game', ({ category }, callback) => {
    if (!currentRoom) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }

    const room = gameManager.getRoom(currentRoom);
    if (!room || room.hostId !== socket.id) {
      callback({ success: false, error: 'Only host can start the game' });
      return;
    }

    const result = gameManager.startGame(currentRoom, category);
    if (result.error) {
      callback({ success: false, error: result.error });
      return;
    }

    // Send game started event to all players
    io.to(currentRoom).emit('game_started', {
      room: sanitizeRoom(result.room),
    });

    callback({ success: true });
  });

  // Request prompt (during deal phase)
  socket.on('request_prompt', ({ playerIndex }, callback) => {
    if (!currentRoom) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }

    const prompt = gameManager.getPromptForPlayer(currentRoom, playerIndex);
    callback({ success: true, prompt });
  });

  // Player viewed their card
  socket.on('card_viewed', () => {
    if (!currentRoom) return;

    console.log(`Player ${socket.id} viewed card in room ${currentRoom}`);
    
    const result = gameManager.playerViewedCard(currentRoom, socket.id);
    if (result && result.room) {
      console.log(`Room ${currentRoom}: ${result.room.currentPlayerIndex}/${result.room.players.length} viewed`);
      broadcastRoomUpdate(currentRoom, result.room);
      
      // If all players viewed, start answering phase
      if (result.allViewed) {
        console.log(`All players viewed in room ${currentRoom}, starting answering phase`);
        const room = gameManager.startAnswering(currentRoom, (code, updatedRoom) => {
          // Timer expired - auto advance to discussion
          if (updatedRoom) {
            broadcastRoomUpdate(code, updatedRoom);
          }
        });
        if (room) {
          broadcastRoomUpdate(currentRoom, room);
        }
      }
    }
  });

  // Submit answer (during answering phase)
  socket.on('submit_answer', ({ playerIndex, answer }, callback) => {
    if (!currentRoom) {
      callback?.({ success: false, error: 'Not in a room' });
      return;
    }

    const result = gameManager.submitAnswer(currentRoom, playerIndex, answer);
    if (result.error) {
      callback?.({ success: false, error: result.error });
      return;
    }

    // Notify all about submission count
    broadcastRoomUpdate(currentRoom, result.room);
    callback?.({ success: true });

    // If all answered, end answering early
    if (result.allAnswered) {
      const room = gameManager.endAnswering(currentRoom);
      if (room) {
        broadcastRoomUpdate(currentRoom, room);
      }
    }
  });

  // Get all answers (for discussion phase)
  socket.on('get_answers', (callback) => {
    if (!currentRoom) {
      callback?.({ success: false, error: 'Not in a room' });
      return;
    }

    const answers = gameManager.getAnswers(currentRoom);
    callback?.({ success: true, answers });
  });

  // Start voting (after discussion)
  socket.on('start_voting', (callback) => {
    if (!currentRoom) {
      callback?.({ success: false, error: 'Not in a room' });
      return;
    }

    const existingRoom = gameManager.getRoom(currentRoom);
    if (!existingRoom || existingRoom.hostId !== socket.id) {
      callback?.({ success: false, error: 'Only host can start voting' });
      return;
    }

    const room = gameManager.startVoting(currentRoom, (code, updatedRoom) => {
      // Timer expired - auto calculate results
      if (updatedRoom) {
        broadcastRoomUpdate(code, updatedRoom);
      }
    });
    
    if (room) {
      broadcastRoomUpdate(currentRoom, room);
      callback?.({ success: true });
    }
  });

  // Cast vote
  socket.on('cast_vote', ({ voterIndex, votedForIndex }, callback) => {
    if (!currentRoom) {
      callback({ success: false, error: 'Not in a room' });
      return;
    }

    const result = gameManager.castVote(currentRoom, voterIndex, votedForIndex);
    if (result.error) {
      callback({ success: false, error: result.error });
      return;
    }

    broadcastRoomUpdate(currentRoom, result.room);
    callback({ success: true });

    // If all voted, end voting early
    if (result.allVoted) {
      const room = gameManager.endVoting(currentRoom);
      if (room) {
        broadcastRoomUpdate(currentRoom, room);
      }
    }
  });

  // Get time remaining
  socket.on('get_time', (callback) => {
    if (!currentRoom) {
      callback?.({ success: false, error: 'Not in a room' });
      return;
    }

    const timeRemaining = gameManager.getTimeRemaining(currentRoom);
    callback?.({ success: true, timeRemaining });
  });

  // Play again (reset for new round)
  socket.on('play_again', (callback) => {
    if (!currentRoom) {
      callback?.({ success: false, error: 'Not in a room' });
      return;
    }

    const room = gameManager.getRoom(currentRoom);
    if (!room || room.hostId !== socket.id) {
      callback?.({ success: false, error: 'Only host can restart' });
      return;
    }

    const newRoom = gameManager.resetRound(currentRoom);
    if (newRoom) {
      broadcastRoomUpdate(currentRoom, newRoom);
      callback?.({ success: true });
    }
  });

  // Leave room
  socket.on('leave_room', () => {
    if (currentRoom) {
      handleLeaveRoom();
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    if (currentRoom) {
      handleLeaveRoom();
    }
  });

  function handleLeaveRoom() {
    const room = gameManager.leaveRoom(currentRoom, socket.id);
    socket.leave(currentRoom);
    
    if (room) {
      io.to(currentRoom).emit('player_left', {
        playerId: socket.id,
        playerName,
        players: room.players,
        newHostId: room.hostId,
      });
    }
    
    console.log(`${playerName} left room ${currentRoom}`);
    currentRoom = null;
    playerName = null;
  }
});

// Sanitize room data before sending to clients (hide sensitive info)
function sanitizeRoom(room) {
  // Track who has done what
  const viewedCards = room.viewedCards ? Array.from(room.viewedCards) : [];
  const answeredIndices = Object.keys(room.answers || {}).map(Number);
  const votedIndices = Object.keys(room.votes || {}).map(Number);
  
  // Create player status for each player
  const playersWithStatus = room.players.map((player, idx) => ({
    ...player,
    hasViewedCard: viewedCards.includes(player.id),
    hasAnswered: answeredIndices.includes(idx),
    hasVoted: votedIndices.includes(idx),
  }));
  
  return {
    code: room.code,
    hostId: room.hostId,
    players: playersWithStatus,
    phase: room.phase,
    category: room.category,
    currentPlayerIndex: room.currentPlayerIndex,
    currentVoterIndex: room.currentVoterIndex,
    votes: room.votes,
    eliminatedPlayerIndex: room.eliminatedPlayerIndex,
    hasPrompt: !!room.promptPair,
    // Timer info
    timerEndTime: room.timerEndTime,
    timerType: room.timerType,
    settings: room.settings,
    // Progress counts
    viewedCount: viewedCards.length,
    answeredCount: answeredIndices.length,
    votedCount: votedIndices.length,
    // Answers (only in discussion/voting/results)
    ...(room.phase === 'discussion' || room.phase === 'voting' || room.phase === 'results' ? {
      answers: room.players.map((p, idx) => ({
        name: p.name,
        answer: room.answers[idx] || "(No answer)",
        playerIndex: idx,
      })),
    } : {}),
    // Reveal imposter only in results
    ...(room.phase === 'results' ? {
      imposterIndex: room.imposterIndex,
      promptPair: room.promptPair,
    } : {}),
  };
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 Imposter Cards server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
