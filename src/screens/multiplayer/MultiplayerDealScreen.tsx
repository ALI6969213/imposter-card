import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
} from 'react-native-reanimated';
import { ScreenContainer, Button, Card, Header } from '../../components';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { haptics } from '../../utils/haptics';

export const MultiplayerDealScreen: React.FC = () => {
  const { room, playerId, getMyPlayerIndex, requestPrompt, cardViewed, currentPrompt } = useMultiplayerStore();
  const [isCardRevealed, setIsCardRevealed] = useState(false);
  const [hasViewedCard, setHasViewedCard] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);

  const myIndex = getMyPlayerIndex();
  const isMyTurn = room?.currentPlayerIndex === myIndex;
  const currentPlayer = room?.players[room.currentPlayerIndex];

  useEffect(() => {
    // Reset when it becomes my turn
    if (isMyTurn && !hasViewedCard) {
      setIsCardRevealed(false);
      setPrompt(null);
    }
  }, [isMyTurn, room?.currentPlayerIndex]);

  const handleReveal = async () => {
    haptics.medium();
    const myPrompt = await requestPrompt(myIndex);
    setPrompt(myPrompt);
    setIsCardRevealed(true);
  };

  const handleHide = () => {
    haptics.light();
    setIsCardRevealed(false);
    setHasViewedCard(true);
    cardViewed();
  };

  if (!room) return null;

  // Waiting for others
  if (!isMyTurn || hasViewedCard) {
    return (
      <ScreenContainer>
        <Header title="Deal Cards" />
        <View style={styles.container}>
          <View style={styles.waitingContainer}>
            <View style={styles.waitingIconContainer}>
              <Ionicons name="hourglass-outline" size={48} color={colors.text.tertiary} />
            </View>
            
            {hasViewedCard ? (
              <>
                <Text style={styles.waitingTitle}>Card Viewed!</Text>
                <Text style={styles.waitingSubtitle}>
                  Waiting for other players to view their cards...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.waitingTitle}>
                  {currentPlayer?.name}'s Turn
                </Text>
                <Text style={styles.waitingSubtitle}>
                  Wait for them to view their card
                </Text>
              </>
            )}

            {/* Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { width: `${((room.currentPlayerIndex) / room.players.length) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {room.currentPlayerIndex} of {room.players.length} viewed
              </Text>
            </View>
          </View>
        </View>
      </ScreenContainer>
    );
  }

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
                { width: `${((room.currentPlayerIndex + (isCardRevealed ? 0.5 : 0)) / room.players.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {room.currentPlayerIndex + 1} of {room.players.length}
          </Text>
        </View>

        <View style={styles.content}>
          {!isCardRevealed ? (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.revealContainer}
            >
              <View style={styles.turnIconContainer}>
                <Ionicons name="person" size={48} color={colors.accent.primary} />
              </View>

              <Text style={styles.turnLabel}>Your Turn!</Text>
              <Text style={styles.turnSubtitle}>Tap to reveal your secret prompt</Text>

              <View style={styles.warningCard}>
                <Ionicons name="eye-off-outline" size={20} color={colors.text.tertiary} />
                <Text style={styles.warningText}>
                  Make sure no one else can see your screen
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
            <Animated.View
              entering={ZoomIn.duration(400)}
              style={styles.cardContainer}
            >
              <Card style={styles.promptCard} variant="elevated">
                <View style={styles.cardHeader}>
                  <Ionicons name="help-circle" size={32} color={colors.accent.primary} />
                  <Text style={styles.cardLabel}>YOUR PROMPT</Text>
                </View>

                <Text style={styles.promptText}>{prompt || currentPrompt}</Text>

                <View style={styles.secretBadge}>
                  <Ionicons name="lock-closed" size={14} color={colors.text.tertiary} />
                  <Text style={styles.secretText}>Don't show others</Text>
                </View>
              </Card>

              <View style={styles.buttonContainer}>
                <Button
                  title="I've Memorized It"
                  onPress={handleHide}
                  size="large"
                  icon={<Ionicons name="checkmark" size={24} color={colors.text.primary} />}
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
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  waitingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingTitle: {
    ...typography.headlineMedium,
    color: colors.text.primary,
    textAlign: 'center',
  },
  waitingSubtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  revealContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  turnIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  turnLabel: {
    ...typography.displaySmall,
    color: colors.text.primary,
  },
  turnSubtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
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
  cardContainer: {
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
