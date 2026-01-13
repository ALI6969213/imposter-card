import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { ScreenContainer, Button, Card, Header } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useGameStore } from '../store/gameStore';
import { haptics } from '../utils/haptics';

export const DealScreen: React.FC = () => {
  const { players, promptForPlayer, advancePhase, goToDiscussion } = useGameStore();
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isCardRevealed, setIsCardRevealed] = useState(false);

  const currentPlayer = players[currentPlayerIndex];
  const currentPrompt = promptForPlayer(currentPlayerIndex);
  const isLastPlayer = currentPlayerIndex >= players.length - 1;

  const handleReveal = () => {
    haptics.medium();
    setIsCardRevealed(true);
  };

  const handleNext = () => {
    haptics.light();
    setIsCardRevealed(false);

    setTimeout(() => {
      if (isLastPlayer) {
        advancePhase();
        goToDiscussion();
      } else {
        setCurrentPlayerIndex(prev => prev + 1);
      }
    }, 300);
  };

  return (
    <ScreenContainer>
      <Header title="Deal Cards" />

      <View style={styles.container}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${((currentPlayerIndex + (isCardRevealed ? 1 : 0)) / players.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {currentPlayerIndex + 1} of {players.length}
          </Text>
        </View>

        <View style={styles.content}>
          {!isCardRevealed ? (
            // Pass to player screen
            <Animated.View
              key={`pass-${currentPlayerIndex}`}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.passContainer}
            >
              <View style={styles.passIconContainer}>
                <Ionicons name="hand-left-outline" size={48} color={colors.accent.primary} />
              </View>

              <Text style={styles.passLabel}>Pass device to</Text>
              <Text style={styles.playerName}>{currentPlayer?.name}</Text>

              <View style={styles.warningCard}>
                <Ionicons name="eye-off-outline" size={20} color={colors.text.tertiary} />
                <Text style={styles.warningText}>
                  Make sure no one else can see the screen
                </Text>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Reveal My Card"
                  onPress={handleReveal}
                  size="large"
                  icon={<Ionicons name="card" size={24} color={colors.text.primary} />}
                />
              </View>
            </Animated.View>
          ) : (
            // Card revealed screen
            <Animated.View
              key={`reveal-${currentPlayerIndex}`}
              entering={ZoomIn.duration(400)}
              exiting={ZoomOut.duration(200)}
              style={styles.revealContainer}
            >
              <Card style={styles.promptCard} variant="elevated">
                <View style={styles.cardHeader}>
                  <Ionicons name="help-circle" size={32} color={colors.accent.primary} />
                  <Text style={styles.cardLabel}>YOUR PROMPT</Text>
                </View>

                <Text style={styles.promptText}>{currentPrompt}</Text>

                <View style={styles.secretBadge}>
                  <Ionicons name="lock-closed" size={14} color={colors.text.tertiary} />
                  <Text style={styles.secretText}>Don't show others</Text>
                </View>
              </Card>

              <View style={styles.buttonContainer}>
                <Button
                  title={isLastPlayer ? 'Start Discussion' : 'Hide & Next'}
                  onPress={handleNext}
                  size="large"
                  icon={
                    <Ionicons
                      name={isLastPlayer ? 'chatbubbles' : 'arrow-forward'}
                      size={24}
                      color={colors.text.primary}
                    />
                  }
                />
              </View>
            </Animated.View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surface.glassLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },
  progressText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  passContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  passIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  passLabel: {
    ...typography.titleSmall,
    color: colors.text.secondary,
  },
  playerName: {
    ...typography.displaySmall,
    color: colors.text.primary,
    textAlign: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  revealContainer: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  promptCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  cardHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
  promptText: {
    ...typography.headlineSmall,
    color: colors.text.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  secretBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.full,
  },
  secretText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    textTransform: 'none',
  },
  buttonContainer: {
    width: '100%',
    marginTop: spacing.lg,
  },
});
