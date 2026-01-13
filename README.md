# Imposter Cards

A social deduction party game built with React Native and Expo. One player receives a different prompt than everyone else - find the imposter among your friends!

## Features

- 🎮 **3-12 Players** - Perfect for parties and gatherings
- 🎯 **6 Categories** - General, Deep, Social, Fun, Food, Entertainment
- ⏱️ **Discussion Timer** - Customizable 1-10 minute timer
- 🗳️ **Secret Voting** - Private voting system
- 🎨 **Beautiful UI** - Dark mode with electric crimson accents
- 📱 **iOS Optimized** - Native haptic feedback and animations

## How to Play

1. **Setup**: Add 3-12 player names and select a category
2. **Deal**: Pass the device around - each player sees their secret prompt
3. **Discuss**: Everyone answers their prompt. One person has a different question!
4. **Vote**: Each player secretly votes for who they think is the imposter
5. **Reveal**: See if the group correctly identified the imposter!

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator or physical iOS device

### Installation

```bash
# Navigate to the project
cd MafiaCards

# Install dependencies
npm install

# Start the development server
npx expo start

# Run on iOS
npx expo start --ios
```

### Running on Device

1. Install the [Expo Go](https://expo.dev/client) app on your iPhone
2. Run `npx expo start`
3. Scan the QR code with your phone's camera

## Project Structure

```
MafiaCards/
├── App.tsx              # Main app entry point
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   └── ScreenContainer.tsx
│   ├── screens/         # Game screens
│   │   ├── HomeScreen.tsx
│   │   ├── LobbyScreen.tsx
│   │   ├── DealScreen.tsx
│   │   ├── DiscussionScreen.tsx
│   │   ├── VotingScreen.tsx
│   │   └── ResultsScreen.tsx
│   ├── store/           # State management (Zustand)
│   │   └── gameStore.ts
│   ├── theme/           # Colors and typography
│   │   ├── colors.ts
│   │   └── typography.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── data/            # Static data
│   │   └── prompts.json
│   └── utils/           # Utility functions
│       └── haptics.ts
├── assets/              # App icons and splash screen
├── package.json
└── app.json
```

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **TypeScript** - Type safety
- **Zustand** - Lightweight state management
- **React Native Reanimated** - Smooth animations
- **Expo Haptics** - Native haptic feedback

## Game Phases

1. **Home** - Start screen with game branding
2. **Lobby** - Player setup and category selection
3. **Deal** - Secret prompt distribution
4. **Discussion** - Timer-based discussion phase
5. **Voting** - Private vote casting
6. **Results** - Vote tally and imposter reveal

## Customization

### Adding Prompts

Edit `src/data/prompts.json` to add new prompt pairs:

```json
{
  "id": "custom-1",
  "category": "general",
  "majority": "Question for most players",
  "imposter": "Different question for imposter"
}
```

### Adding Categories

Add new prompts with a new category name - categories are auto-detected from the prompts data.

## License

MIT License - feel free to use and modify!

## Credits

Inspired by social deduction games like Werewolf, Mafia, and The Chameleon.
