import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  Layout,
  ZoomIn,
} from 'react-native-reanimated';
import { ScreenContainer, Button, Card, Header } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { haptics } from '../utils/haptics';

export const WaitingRoomScreen: React.FC = () => {
  const {
    room,
    playerId,
    isHost,
    leaveRoom,
    startGame,
    getCategories,
  } = useMultiplayerStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = getCategories();
  const canStart = room && room.players.length >= 3 && selectedCategory && isHost();

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories]);

  const handleShareCode = async () => {
    if (!room) return;
    haptics.light();

    try {
      await Share.share({
        message: `Join my Imposter Cards game! Room code: ${room.code}`,
      });
    } catch (e) {
      // User cancelled
    }
  };

  const handleCopyCode = () => {
    if (!room) return;
    haptics.success();
    // Note: Clipboard requires expo-clipboard, using Share as alternative
    handleShareCode();
  };

  const handleStartGame = async () => {
    if (!canStart) return;

    setIsStarting(true);
    setError(null);
    haptics.medium();

    const result = await startGame(selectedCategory);
    if (!result.success) {
      setError(result.error || 'Failed to start game');
      setIsStarting(false);
    }
  };

  const handleLeave = () => {
    haptics.light();
    leaveRoom();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return 'help-circle-outline';
      case 'deep': return 'heart-outline';
      case 'social': return 'people-outline';
      case 'fun': return 'happy-outline';
      case 'food': return 'restaurant-outline';
      case 'entertainment': return 'film-outline';
      default: return 'grid-outline';
    }
  };

  if (!room) return null;

  return (
    <ScreenContainer>
      <Header title="Waiting Room" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Room Code Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card style={styles.codeCard}>
            <Text style={styles.codeLabel}>ROOM CODE</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.code}>{room.code}</Text>
              <TouchableOpacity style={styles.shareButton} onPress={handleShareCode}>
                <Ionicons name="share-outline" size={24} color={colors.accent.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.codeHint}>Share this code with your friends</Text>
          </Card>
        </Animated.View>

        {/* Players List */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Card style={styles.playersCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Players</Text>
              <Text style={styles.playerCount}>
                {room.players.length}/12 {room.players.length < 3 && '(min 3)'}
              </Text>
            </View>

            <View style={styles.playersList}>
              {room.players.map((player, index) => (
                <Animated.View
                  key={player.id}
                  entering={FadeInUp.delay(300 + index * 50).duration(300)}
                  layout={Layout.springify()}
                  style={[
                    styles.playerItem,
                    player.id === playerId && styles.playerItemSelf,
                  ]}
                >
                  <View style={styles.playerInfo}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {player.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.playerName}>
                      {player.name}
                      {player.id === playerId && ' (You)'}
                    </Text>
                  </View>
                  {player.isHost && (
                    <View style={styles.hostBadge}>
                      <Ionicons name="star" size={14} color={colors.accent.primary} />
                      <Text style={styles.hostBadgeText}>Host</Text>
                    </View>
                  )}
                </Animated.View>
              ))}
            </View>

            {room.players.length < 3 && (
              <View style={styles.waitingMessage}>
                <Ionicons name="hourglass-outline" size={20} color={colors.text.tertiary} />
                <Text style={styles.waitingText}>
                  Waiting for {3 - room.players.length} more player{room.players.length < 2 ? 's' : ''}...
                </Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Category Selection (Host only) */}
        {isHost() && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Card style={styles.categoryCard}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.categoryButtonActive,
                    ]}
                    onPress={() => {
                      haptics.selection();
                      setSelectedCategory(category);
                    }}
                  >
                    <Ionicons
                      name={getCategoryIcon(category) as any}
                      size={20}
                      color={
                        selectedCategory === category
                          ? colors.accent.primary
                          : colors.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category && styles.categoryTextActive,
                      ]}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Not host message */}
        {!isHost() && (
          <Animated.View entering={FadeIn.delay(400).duration(400)}>
            <View style={styles.waitingForHost}>
              <Ionicons name="time-outline" size={24} color={colors.text.tertiary} />
              <Text style={styles.waitingForHostText}>
                Waiting for host to start the game...
              </Text>
            </View>
          </Animated.View>
        )}

        {error && (
          <Animated.View entering={FadeIn} style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={colors.semantic.error} />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        {isHost() && (
          <Button
            title="Start Game"
            onPress={handleStartGame}
            disabled={!canStart || isStarting}
            loading={isStarting}
            size="large"
            icon={<Ionicons name="play" size={24} color={colors.text.primary} />}
          />
        )}
        <Button
          title="Leave Room"
          onPress={handleLeave}
          variant="ghost"
          size="medium"
          icon={<Ionicons name="exit-outline" size={20} color={colors.accent.primary} />}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  codeCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  codeLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  code: {
    ...typography.displayLarge,
    color: colors.accent.primary,
    letterSpacing: 8,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeHint: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },
  playersCard: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  playerCount: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  playersList: {
    gap: spacing.sm,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.md,
  },
  playerItemSelf: {
    backgroundColor: colors.accent.muted,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  playerAvatarText: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  playerName: {
    ...typography.bodyLarge,
    color: colors.text.primary,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.accent.muted,
    borderRadius: borderRadius.full,
  },
  hostBadgeText: {
    ...typography.labelSmall,
    color: colors.accent.primary,
    textTransform: 'none',
  },
  waitingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  waitingText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
  },
  categoryCard: {
    gap: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: colors.accent.muted,
    borderColor: colors.accent.primary,
  },
  categoryText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  categoryTextActive: {
    color: colors.accent.primary,
  },
  waitingForHost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.lg,
  },
  waitingForHostText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.semantic.errorMuted,
    borderRadius: borderRadius.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.semantic.error,
    flex: 1,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
});
