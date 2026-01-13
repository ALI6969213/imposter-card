import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';
import { ScreenContainer, Button, Card, Header } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useGameStore } from '../store/gameStore';
import { haptics } from '../utils/haptics';
import { Player } from '../types';

interface PlayerButtonProps {
  player: Player;
  isSelected: boolean;
  onPress: () => void;
}

const PlayerButton: React.FC<PlayerButtonProps> = ({ player, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.playerButton, isSelected && styles.playerButtonSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.playerButtonText, isSelected && styles.playerButtonTextSelected]}>
      {player.name}
    </Text>
    {isSelected && (
      <Animated.View entering={ZoomIn.duration(200)}>
        <Ionicons name="checkmark-circle" size={24} color={colors.accent.primary} />
      </Animated.View>
    )}
  </TouchableOpacity>
);

export const VotingScreen: React.FC = () => {
  const { players, castVote, advancePhase, goToResults } = useGameStore();
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const [isVotingRevealed, setIsVotingRevealed] = useState(false);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number | null>(null);
  const [isVoteSubmitted, setIsVoteSubmitted] = useState(false);

  const currentVoter = players[currentVoterIndex];
  const votablePlayers = players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => index !== currentVoterIndex);
  const isLastVoter = currentVoterIndex >= players.length - 1;

  const handleRevealVoting = () => {
    haptics.medium();
    setIsVotingRevealed(true);
  };

  const handleSelectPlayer = (index: number) => {
    haptics.selection();
    setSelectedPlayerIndex(index);
  };

  const handleSubmitVote = () => {
    if (selectedPlayerIndex === null) return;

    if (castVote(currentVoterIndex, selectedPlayerIndex)) {
      haptics.success();
      setIsVoteSubmitted(true);
    }
  };

  const handleNext = () => {
    haptics.light();
    setIsVotingRevealed(false);
    setIsVoteSubmitted(false);
    setSelectedPlayerIndex(null);

    setTimeout(() => {
      if (isLastVoter) {
        advancePhase();
        goToResults();
      } else {
        setCurrentVoterIndex(prev => prev + 1);
      }
    }, 300);
  };

  return (
    <ScreenContainer>
      <Header title="Voting" />

      <View style={styles.container}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${((currentVoterIndex + (isVoteSubmitted ? 1 : 0)) / players.length) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Vote {currentVoterIndex + 1} of {players.length}
          </Text>
        </View>

        <View style={styles.content}>
          {!isVotingRevealed ? (
            // Pass to voter screen
            <Animated.View
              key={`pass-${currentVoterIndex}`}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.passContainer}
            >
              <View style={styles.passIconContainer}>
                <Ionicons name="hand-left-outline" size={48} color={colors.accent.primary} />
              </View>

              <Text style={styles.passLabel}>Pass device to</Text>
              <Text style={styles.voterName}>{currentVoter?.name}</Text>

              <View style={styles.warningCard}>
                <Ionicons name="eye-off-outline" size={20} color={colors.text.tertiary} />
                <Text style={styles.warningText}>Private voting - don't show others</Text>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Reveal Voting"
                  onPress={handleRevealVoting}
                  size="large"
                  icon={<Ionicons name="thumbs-up" size={24} color={colors.text.primary} />}
                />
              </View>
            </Animated.View>
          ) : !isVoteSubmitted ? (
            // Voting screen
            <Animated.View
              key={`vote-${currentVoterIndex}`}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.votingContainer}
            >
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
                    <PlayerButton
                      player={player}
                      isSelected={selectedPlayerIndex === index}
                      onPress={() => handleSelectPlayer(index)}
                    />
                  </Animated.View>
                ))}
              </ScrollView>

              <View style={styles.buttonContainer}>
                <Button
                  title="Submit Vote"
                  onPress={handleSubmitVote}
                  disabled={selectedPlayerIndex === null}
                  size="large"
                  icon={<Ionicons name="checkmark" size={24} color={colors.text.primary} />}
                />
              </View>
            </Animated.View>
          ) : (
            // Vote submitted screen
            <Animated.View
              key={`submitted-${currentVoterIndex}`}
              entering={ZoomIn.duration(400)}
              style={styles.submittedContainer}
            >
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={80} color={colors.semantic.success} />
              </View>

              <Text style={styles.submittedTitle}>Vote Submitted</Text>
              <Text style={styles.submittedSubtitle}>
                Your vote has been recorded secretly
              </Text>

              <View style={styles.buttonContainer}>
                <Button
                  title={isLastVoter ? 'View Results' : 'Next Voter'}
                  onPress={handleNext}
                  size="large"
                  icon={
                    <Ionicons
                      name={isLastVoter ? 'trophy' : 'arrow-forward'}
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
  voterName: {
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
  votingContainer: {
    flex: 1,
    gap: spacing.lg,
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
  },
  submittedContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  successIconContainer: {
    marginBottom: spacing.md,
  },
  submittedTitle: {
    ...typography.headlineMedium,
    color: colors.text.primary,
  },
  submittedSubtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
