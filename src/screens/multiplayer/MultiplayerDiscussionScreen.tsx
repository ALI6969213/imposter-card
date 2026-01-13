import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ScreenContainer, Button, Card, Header } from '../../components';
import { colors } from '../../theme/colors';
import { typography, spacing, borderRadius } from '../../theme/typography';
import { useMultiplayerStore } from '../../store/multiplayerStore';
import { haptics } from '../../utils/haptics';

export const MultiplayerDiscussionScreen: React.FC = () => {
  const { room, isHost, startVoting } = useMultiplayerStore();
  const [timerDuration, setTimerDuration] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerStarted, setIsTimerStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const progress = useSharedValue(1);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isTimerStarted) {
      progress.value = withTiming(timeRemaining / (timerDuration * 60), { duration: 1000 });
    }
  }, [timeRemaining, timerDuration, isTimerStarted]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeUp = timeRemaining <= 0 && isTimerStarted;

  const startTimer = () => {
    haptics.medium();
    const totalSeconds = timerDuration * 60;
    setTimeRemaining(totalSeconds);
    setIsTimerStarted(true);
    setIsTimerRunning(true);
    progress.value = 1;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTimerRunning(false);
          haptics.warning();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    haptics.light();
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resumeTimer = () => {
    haptics.light();
    setIsTimerRunning(true);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsTimerRunning(false);
          haptics.warning();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetTimer = () => {
    haptics.light();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsTimerStarted(false);
    setIsTimerRunning(false);
    setTimeRemaining(timerDuration * 60);
    progress.value = 1;
  };

  const handleGoToVoting = async () => {
    haptics.medium();
    await startVoting();
  };

  if (!room) return null;

  return (
    <ScreenContainer>
      <Header title="Discussion" />

      <View style={styles.container}>
        {/* Round Info */}
        <Animated.View entering={FadeIn.delay(100).duration(400)}>
          <Card style={styles.infoCard}>
            <Text style={styles.roundText}>Discussion Time</Text>
            {room.category && (
              <Text style={styles.categoryText}>
                Category: {room.category.charAt(0).toUpperCase() + room.category.slice(1)}
              </Text>
            )}
          </Card>
        </Animated.View>

        <View style={styles.timerSection}>
          {!isTimerStarted ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.setupContainer}>
              <Text style={styles.setupLabel}>Set Timer Duration</Text>

              <View style={styles.durationPicker}>
                <TouchableOpacity
                  style={[styles.durationButton, timerDuration <= 1 && styles.durationButtonDisabled]}
                  onPress={() => {
                    if (timerDuration > 1) {
                      haptics.selection();
                      setTimerDuration(prev => prev - 1);
                    }
                  }}
                  disabled={timerDuration <= 1}
                >
                  <Ionicons
                    name="remove"
                    size={28}
                    color={timerDuration <= 1 ? colors.text.tertiary : colors.accent.primary}
                  />
                </TouchableOpacity>

                <View style={styles.durationDisplay}>
                  <Text style={styles.durationNumber}>{timerDuration}</Text>
                  <Text style={styles.durationUnit}>minutes</Text>
                </View>

                <TouchableOpacity
                  style={[styles.durationButton, timerDuration >= 10 && styles.durationButtonDisabled]}
                  onPress={() => {
                    if (timerDuration < 10) {
                      haptics.selection();
                      setTimerDuration(prev => prev + 1);
                    }
                  }}
                  disabled={timerDuration >= 10}
                >
                  <Ionicons
                    name="add"
                    size={28}
                    color={timerDuration >= 10 ? colors.text.tertiary : colors.accent.primary}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(400)} style={styles.timerContainer}>
              <View style={styles.timerProgressBar}>
                <Animated.View
                  style={[
                    styles.timerProgressFill,
                    progressStyle,
                    isTimeUp && styles.timerProgressFillDanger,
                  ]}
                />
              </View>

              <Text style={[styles.timerText, isTimeUp && styles.timerTextDanger]}>
                {formatTime(timeRemaining)}
              </Text>

              {isTimeUp && (
                <View style={styles.timeUpBadge}>
                  <Ionicons name="alert-circle" size={20} color={colors.semantic.error} />
                  <Text style={styles.timeUpText}>Time's up!</Text>
                </View>
              )}
            </Animated.View>
          )}
        </View>

        <View style={styles.instructions}>
          <View style={styles.instructionItem}>
            <Ionicons name="chatbubbles-outline" size={24} color={colors.text.tertiary} />
            <Text style={styles.instructionText}>
              Everyone answers their prompt one by one
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="search-outline" size={24} color={colors.text.tertiary} />
            <Text style={styles.instructionText}>
              Listen carefully to find who has a different prompt
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {!isTimerStarted ? (
            <Button
              title="Start Timer"
              onPress={startTimer}
              size="large"
              icon={<Ionicons name="play" size={24} color={colors.text.primary} />}
            />
          ) : (
            <>
              <View style={styles.timerControls}>
                <Button
                  title={isTimerRunning ? 'Pause' : 'Resume'}
                  onPress={isTimerRunning ? pauseTimer : resumeTimer}
                  variant="secondary"
                  size="medium"
                  icon={
                    <Ionicons
                      name={isTimerRunning ? 'pause' : 'play'}
                      size={20}
                      color={colors.text.primary}
                    />
                  }
                />
                <Button
                  title="Reset"
                  onPress={resetTimer}
                  variant="secondary"
                  size="medium"
                  icon={<Ionicons name="refresh" size={20} color={colors.text.primary} />}
                />
              </View>

              {isTimeUp && isHost() && (
                <Button
                  title="Start Voting"
                  onPress={handleGoToVoting}
                  size="large"
                  icon={<Ionicons name="thumbs-up" size={24} color={colors.text.primary} />}
                />
              )}

              {isTimeUp && !isHost() && (
                <View style={styles.waitingForHost}>
                  <Ionicons name="time-outline" size={20} color={colors.text.tertiary} />
                  <Text style={styles.waitingForHostText}>
                    Waiting for host to start voting...
                  </Text>
                </View>
              )}
            </>
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
  infoCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  roundText: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  categoryText: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  timerSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  setupContainer: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  setupLabel: {
    ...typography.titleSmall,
    color: colors.text.secondary,
  },
  durationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  durationButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  durationButtonDisabled: {
    opacity: 0.5,
  },
  durationDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  durationNumber: {
    ...typography.displayLarge,
    color: colors.text.primary,
  },
  durationUnit: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  timerContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  timerProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surface.glassLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 4,
  },
  timerProgressFillDanger: {
    backgroundColor: colors.semantic.error,
  },
  timerText: {
    ...typography.mono,
    color: colors.text.primary,
  },
  timerTextDanger: {
    color: colors.semantic.error,
  },
  timeUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.semantic.errorMuted,
    borderRadius: borderRadius.full,
  },
  timeUpText: {
    ...typography.labelLarge,
    color: colors.semantic.error,
  },
  instructions: {
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.lg,
  },
  instructionText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    flex: 1,
  },
  controls: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  timerControls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  waitingForHost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.lg,
  },
  waitingForHostText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
  },
});
