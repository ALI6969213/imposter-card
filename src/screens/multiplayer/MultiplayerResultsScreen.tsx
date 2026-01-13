import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import { ScreenContainer, Button, Card, Header } from '../../components';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { haptics } from '../../utils/haptics';

export const MultiplayerResultsScreen: React.FC = () => {
  const { room, isHost, playAgain, goToHome } = useMultiplayerStore();
  const [showReveal, setShowReveal] = useState(false);

  if (!room) return null;

  const voteTally: Record<number, number> = {};
  Object.values(room.votes).forEach(votedFor => {
    voteTally[votedFor] = (voteTally[votedFor] || 0) + 1;
  });

  const imposterCaught = room.imposterIndex === room.eliminatedPlayerIndex;
  const imposterPlayer = room.imposterIndex !== null && room.imposterIndex !== undefined
    ? room.players[room.imposterIndex]
    : null;
  const eliminatedPlayer = room.eliminatedPlayerIndex !== null && room.eliminatedPlayerIndex !== undefined
    ? room.players[room.eliminatedPlayerIndex]
    : null;

  const sortedResults = room.players
    .map((player, index) => ({
      index,
      player,
      votes: voteTally[index] || 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  const handleReveal = () => {
    haptics.heavy();
    setShowReveal(true);
  };

  const handlePlayAgain = async () => {
    haptics.medium();
    await playAgain();
  };

  const handleNewGame = () => {
    haptics.medium();
    goToHome();
  };

  return (
    <ScreenContainer>
      <Header title="Results" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vote Tally */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <Card style={styles.tallyCard}>
            <Text style={styles.sectionTitle}>Vote Tally</Text>

            <View style={styles.voteList}>
              {sortedResults.map((result, index) => (
                <Animated.View
                  key={result.player.id}
                  entering={FadeInUp.delay(200 + index * 100).duration(300)}
                  style={[
                    styles.voteItem,
                    result.index === room.eliminatedPlayerIndex && styles.voteItemEliminated,
                  ]}
                >
                  <View style={styles.voteItemLeft}>
                    {result.index === room.eliminatedPlayerIndex && (
                      <Ionicons name="skull" size={18} color={colors.semantic.error} />
                    )}
                    <Text
                      style={[
                        styles.voteItemName,
                        result.index === room.eliminatedPlayerIndex && styles.voteItemNameEliminated,
                      ]}
                    >
                      {result.player.name}
                    </Text>
                  </View>
                  <View style={styles.voteBadge}>
                    <Text
                      style={[
                        styles.voteCount,
                        result.index === room.eliminatedPlayerIndex && styles.voteCountEliminated,
                      ]}
                    >
                      {result.votes}
                    </Text>
                    <Text style={styles.voteLabel}>
                      {result.votes === 1 ? 'vote' : 'votes'}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Reveal Button */}
        {!showReveal && (
          <Animated.View entering={FadeIn.delay(600).duration(400)}>
            <Button
              title="Reveal Imposter"
              onPress={handleReveal}
              size="large"
              icon={<Ionicons name="eye" size={24} color={colors.text.primary} />}
            />
          </Animated.View>
        )}

        {/* Imposter Reveal */}
        {showReveal && (
          <Animated.View entering={SlideInUp.duration(500)} style={styles.revealSection}>
            <Card
              style={[
                styles.resultCard,
                imposterCaught ? styles.resultCardSuccess : styles.resultCardFailure,
              ]}
              variant="elevated"
            >
              <Animated.View entering={ZoomIn.delay(200).duration(400)} style={styles.resultIcon}>
                <Ionicons
                  name={imposterCaught ? 'checkmark-circle' : 'close-circle'}
                  size={72}
                  color={imposterCaught ? colors.semantic.success : colors.semantic.error}
                />
              </Animated.View>

              <Text style={styles.resultLabel}>The Imposter was</Text>
              <Text style={styles.imposterName}>{imposterPlayer?.name}</Text>

              <View
                style={[
                  styles.resultBadge,
                  imposterCaught ? styles.resultBadgeSuccess : styles.resultBadgeFailure,
                ]}
              >
                <Text
                  style={[
                    styles.resultBadgeText,
                    imposterCaught ? styles.resultBadgeTextSuccess : styles.resultBadgeTextFailure,
                  ]}
                >
                  {imposterCaught ? 'Correctly Eliminated!' : 'Not Eliminated!'}
                </Text>
              </View>

              {!imposterCaught && eliminatedPlayer && (
                <Text style={styles.eliminatedText}>
                  You eliminated {eliminatedPlayer.name} instead
                </Text>
              )}
            </Card>

            {/* Prompts Card */}
            {room.promptPair && (
              <Card style={styles.promptsCard}>
                <Text style={styles.sectionTitle}>The Prompts</Text>

                <View style={styles.promptItem}>
                  <View style={styles.promptHeader}>
                    <Ionicons name="people" size={18} color={colors.text.tertiary} />
                    <Text style={styles.promptLabel}>MAJORITY PROMPT</Text>
                  </View>
                  <Text style={styles.promptText}>{room.promptPair.majority}</Text>
                </View>

                <View style={[styles.promptItem, styles.promptItemImposter]}>
                  <View style={styles.promptHeader}>
                    <Ionicons name="skull" size={18} color={colors.accent.primary} />
                    <Text style={[styles.promptLabel, styles.promptLabelImposter]}>
                      IMPOSTER PROMPT
                    </Text>
                  </View>
                  <Text style={styles.promptText}>{room.promptPair.imposter}</Text>
                </View>
              </Card>
            )}
          </Animated.View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {isHost() ? (
            <Button
              title="Play Again"
              onPress={handlePlayAgain}
              size="large"
              icon={<Ionicons name="refresh" size={24} color={colors.text.primary} />}
            />
          ) : (
            <View style={styles.waitingForHost}>
              <Ionicons name="time-outline" size={20} color={colors.text.tertiary} />
              <Text style={styles.waitingForHostText}>
                Waiting for host to start new round...
              </Text>
            </View>
          )}
          <Button
            title="Leave Game"
            onPress={handleNewGame}
            variant="ghost"
            size="medium"
            icon={<Ionicons name="exit-outline" size={20} color={colors.accent.primary} />}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  tallyCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  voteList: {
    gap: spacing.sm,
  },
  voteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  voteItemEliminated: {
    backgroundColor: colors.semantic.errorMuted,
    borderColor: colors.semantic.error,
  },
  voteItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  voteItemName: {
    ...typography.bodyLarge,
    color: colors.text.primary,
  },
  voteItemNameEliminated: {
    color: colors.semantic.error,
    fontWeight: '600',
  },
  voteBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  voteCount: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  voteCountEliminated: {
    color: colors.semantic.error,
  },
  voteLabel: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  revealSection: {
    gap: spacing.lg,
  },
  resultCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  resultCardSuccess: {
    borderColor: colors.semantic.success,
    borderWidth: 2,
  },
  resultCardFailure: {
    borderColor: colors.semantic.error,
    borderWidth: 2,
  },
  resultIcon: {
    marginBottom: spacing.lg,
  },
  resultLabel: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
  },
  imposterName: {
    ...typography.displaySmall,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  resultBadge: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  resultBadgeSuccess: {
    backgroundColor: colors.semantic.successMuted,
  },
  resultBadgeFailure: {
    backgroundColor: colors.semantic.errorMuted,
  },
  resultBadgeText: {
    ...typography.labelLarge,
  },
  resultBadgeTextSuccess: {
    color: colors.semantic.success,
  },
  resultBadgeTextFailure: {
    color: colors.semantic.error,
  },
  eliminatedText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },
  promptsCard: {
    gap: spacing.md,
  },
  promptItem: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.md,
  },
  promptItemImposter: {
    backgroundColor: colors.accent.muted,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  promptLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
  promptLabelImposter: {
    color: colors.accent.primary,
  },
  promptText: {
    ...typography.bodyLarge,
    color: colors.text.primary,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  waitingForHost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.lg,
  },
  waitingForHostText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
  },
});
