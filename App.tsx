import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

// Local game screens
import {
  HomeScreen,
  LobbyScreen,
  DealScreen,
  DiscussionScreen,
  VotingScreen,
  ResultsScreen,
  JoinScreen,
  WaitingRoomScreen,
} from './src/screens';

// Multiplayer screens
import {
  MultiplayerDealScreen,
  MultiplayerDiscussionScreen,
  MultiplayerVotingScreen,
  MultiplayerResultsScreen,
} from './src/screens/multiplayer';

// Stores
import { useGameStore } from './src/store/gameStore';
import { useMultiplayerStore } from './src/store/multiplayerStore';
import { colors } from './src/theme/colors';

type GameMode = 'none' | 'local' | 'multiplayer';

export default function App() {
  const localPhase = useGameStore(state => state.currentPhase);
  const multiplayerPhase = useMultiplayerStore(state => state.currentPhase);
  
  const [gameMode, setGameMode] = useState<GameMode>('none');

  const renderScreen = () => {
    // Determine which mode we're in based on phases
    if (gameMode === 'multiplayer' || multiplayerPhase !== 'home') {
      // Multiplayer mode
      switch (multiplayerPhase) {
        case 'home':
          return (
            <HomeScreen
              onMultiplayer={() => {
                setGameMode('multiplayer');
                useMultiplayerStore.getState().goToJoin();
              }}
            />
          );
        case 'join':
          return <JoinScreen />;
        case 'waiting':
          return <WaitingRoomScreen />;
        case 'deal':
          return <MultiplayerDealScreen />;
        case 'discussion':
          return <MultiplayerDiscussionScreen />;
        case 'voting':
          return <MultiplayerVotingScreen />;
        case 'results':
          return <MultiplayerResultsScreen />;
        default:
          return (
            <HomeScreen
              onMultiplayer={() => {
                setGameMode('multiplayer');
                useMultiplayerStore.getState().goToJoin();
              }}
            />
          );
      }
    }

    // Local pass-and-play mode
    switch (localPhase) {
      case 'home':
        return (
          <HomeScreen
            onMultiplayer={() => {
              setGameMode('multiplayer');
              useMultiplayerStore.getState().goToJoin();
            }}
          />
        );
      case 'lobby':
        return <LobbyScreen />;
      case 'deal':
        return <DealScreen />;
      case 'discussion':
        return <DiscussionScreen />;
      case 'voting':
        return <VotingScreen />;
      case 'results':
        return <ResultsScreen />;
      default:
        return (
          <HomeScreen
            onMultiplayer={() => {
              setGameMode('multiplayer');
              useMultiplayerStore.getState().goToJoin();
            }}
          />
        );
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {renderScreen()}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
