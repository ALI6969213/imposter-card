# Imposter Cards (Web + Multiplayer Server)

Mobile-optimized web app (PWA-ready) plus a Socket.io server for online rooms. No native/Expo assets remain.

## Structure
```
web/      # Vite + React + TS mobile web app (PWA)
server/   # Node + Express + Socket.io backend
```

## Requirements
- Node 18+
- npm

## Frontend (web)
```
cd web
npm install
npm run dev        # local
npm run build      # production build to dist/
```

### PWA / Add to Home Screen
- Manifest + service worker included.
- In-app banner instructs: iOS Safari Share → Add to Home Screen; Android Chrome menu → Add to Home Screen.

### Vercel deploy (from repo root)
```
vercel --cwd web --prod
# or use dashboard, set:
#  Root directory: web
#  Framework: Vite
#  Build command: npm run build
#  Output dir: dist
```

## Backend (server)
```
cd server
npm install
npm start      # prod
npm run dev    # dev with nodemon
```

Server URL used by frontend: `https://imposter-card.onrender.com`.

## Game flow
- Pass & Play: local deal/discussion/voting/results.
- Multiplayer: create/join via 4-digit code; host starts, deal, discussion, voting, results.
