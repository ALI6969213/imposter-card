import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  ZoomIn,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';
import { ScreenContainer, Button, Card, Header } from '../../components';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { haptics } from '../../utils/haptics';

export const MultiplayerVotingScreen: React.FC = () => {
  const { room, getMyPlayerIndex, castVote } = useMultiplayerStore();
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myIndex = getMyPlayerIndex();
  const votablePlayers = room?.players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => index !== myIndex) || [];

  // Check if already voted
  useEffect(() => {
    if (room && room.votes[myIndex] !== undefined) {
      setHasVoted(true);
    }
  }, [room?.votes, myIndex]);

  const handleSelectPlayer = (index: number) => {
    if (hasVoted) return;
    haptics.selection();
    setSelectedPlayerIndex(index);
  };

  const handleSubmitVote = async () => {
    if (selectedPlayerIndex === null || hasVoted) return;

    setIsSubmitting(true);
    haptics.medium();

    const success = await castVote(myIndex, selectedPlayerIndex);
    if (success) {
      haptics.success();
      setHasVoted(true);
    }
    setIsSubmitting(false);
  };

  if (!room) return null;

  // Already voted - waiting for others
  if (hasVoted) {
    const votedCount = Object.keys(room.votes).length;
    const totalPlayers = room.players.length;

    return (
      <ScreenContainer>
        <Header title="Voting" />
        <View style={styles.container}>
          <View style={styles.waitingContainer}>
            <Animated.View entering={ZoomIn.duration(400)} style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={colors.semantic.success} />
            </Animated.View>

            <Text style={styles.waitingTitle}>Vote Submitted!</Text>
            <Text style={styles.waitingSubtitle}>
              Waiting for other players to vote...
            </Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { width: `${(votedCount / totalPlayers) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {votedCount} of {totalPlayers} voted
              </Text>
            </View>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Header title="Voting" />

      <View style={styles.container}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${(Object.keys(room.votes).length / room.players.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Object.keys(room.votes).length} of {room.players.length} voted
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.questionContainer}>
            <Ionicons name="search" size={28} color={colors.accent.primary} />
            <Text style={styles.questionText}>Who is the imposter?</Text>
          </View>

          <ScrollView
            style={styles.playersList}
            contentContainerStyle={styles.playersListContent}
            showsVerticalScrollIndicator={false}
          >
            {votablePlayers.map(({ player, index }, i) => (
              <Animated.View
                key={player.id}
                entering={SlideInRight.delay(i * 50).duration(300)}
                layout={Layout.springify()}
              >
                <TouchableOpacity
                  style={[
                    styles.playerButton,
                    selectedPlayerIndex === index && styles.playerButtonSelected,
                  ]}
                  onPress={() => handleSelectPlayer(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.playerButtonText,
                      selectedPlayerIndex === index && styles.playerButtonTextSelected,
                    ]}
                  >
                    {player.name}
                  </Text>
                  {selectedPlayerIndex === index && (
                    <Animated.View entering={ZoomIn.duration(200)}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.accent.primary} />
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <Button
              title="Submit Vote"
              onPress={handleSubmitVote}
              disabled={selectedPlayerIndex === null || isSubmitting}
              loading={isSubmitting}
              size="large"
              icon={<Ionicons name="checkmark" size={24} color={colors.text.primary} />}
            />
          </View>
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
    gap: spacing.lg,
  },
  waitingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  successIconContainer: {
    marginBottom: spacing.md,
  },
  waitingTitle: {
    ...typography.headlineMedium,
    color: colors.text.primary,
  },
  waitingSubtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  questionText: {
    ...typography.titleLarge,
    color: colors.text.primary,
  },
  playersList: {
    flex: 1,
  },
  playersListContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  playerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface.glass,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerButtonSelected: {
    backgroundColor: colors.accent.muted,
    borderColor: colors.accent.primary,
  },
  playerButtonText: {
    ...typography.titleSmall,
    color: colors.text.primary,
  },
  playerButtonTextSelected: {
    color: colors.accent.primary,
  },
  buttonContainer: {
    width: '100%',
    marginTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
