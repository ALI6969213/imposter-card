const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameManager = require('./gameManager');
const prompts = require('./prompts.json');

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

    const result = gameManager.startGame(currentRoom, category, prompts);
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

    const room = gameManager.advanceDeal(currentRoom);
    if (room) {
      io.to(currentRoom).emit('room_updated', { room: sanitizeRoom(room) });
    }
  });

  // Start voting (after discussion)
  socket.on('start_voting', (callback) => {
    if (!currentRoom) {
      callback?.({ success: false, error: 'Not in a room' });
      return;
    }

    const room = gameManager.startVoting(currentRoom);
    if (room) {
      io.to(currentRoom).emit('room_updated', { room: sanitizeRoom(room) });
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

    io.to(currentRoom).emit('room_updated', { room: sanitizeRoom(result.room) });
    callback({ success: true });
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
      io.to(currentRoom).emit('room_updated', { room: sanitizeRoom(newRoom) });
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
  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players,
    phase: room.phase,
    category: room.category,
    currentPlayerIndex: room.currentPlayerIndex,
    currentVoterIndex: room.currentVoterIndex,
    votes: room.votes,
    eliminatedPlayerIndex: room.eliminatedPlayerIndex,
    // Don't send imposterIndex or promptPair to clients (security!)
    // Individual prompts are requested separately
    hasPrompt: !!room.promptPair,
    // Only send prompts in results phase
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
