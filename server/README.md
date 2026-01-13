# Imposter Cards Server

Multiplayer server for the Imposter Cards game using Socket.io.

## Deploy to Railway (Recommended - Free)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Deploy
1. Click "New Project" → "Deploy from GitHub repo"
2. Connect your GitHub and select your repository
3. Select the `server` folder as the root directory
4. Railway will auto-detect Node.js and deploy

### Step 3: Get Your URL
1. Go to your project settings → Networking
2. Click "Generate Domain"
3. Your server URL will be something like: `https://your-project.up.railway.app`

### Step 4: Update the App
Update `src/services/socketService.ts` with your new server URL.

---

## Alternative: Deploy to Render (Free)

1. Go to [render.com](https://render.com)
2. Create account with GitHub
3. New → Web Service
4. Connect your repo, set root to `server/`
5. Build command: `npm install`
6. Start command: `npm start`

---

## Local Development

```bash
npm install
npm start
```

Server runs on http://localhost:3001

## API Endpoints

- `GET /health` - Health check, returns `{ status: "ok", rooms: <count> }`

## Socket Events

### Client → Server
- `create_room` - Create a new game room
- `join_room` - Join existing room with code
- `start_game` - Start the game (host only)
- `request_prompt` - Get prompt for a player
- `card_viewed` - Player has viewed their card
- `start_voting` - Begin voting phase
- `cast_vote` - Submit a vote
- `play_again` - Reset for new round
- `leave_room` - Leave current room

### Server → Client
- `player_joined` - New player joined room
- `player_left` - Player left room
- `game_started` - Game has begun
- `room_updated` - Room state changed
