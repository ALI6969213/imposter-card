import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import { ScreenContainer, Button, Card, Header } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useGameStore } from '../store/gameStore';
import { haptics } from '../utils/haptics';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;

export const LobbyScreen: React.FC = () => {
  const { configurePlayers, startRound, getCategories, goToHome } = useGameStore();
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '']);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<number, string>>({});

  const categories = getCategories();

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories]);

  const validPlayerCount = playerNames.filter(name => name.trim().length > 0).length;
  const uniqueNames = new Set(playerNames.filter(name => name.trim().length > 0).map(n => n.trim().toLowerCase()));

  const canStartGame =
    validPlayerCount >= MIN_PLAYERS &&
    uniqueNames.size === validPlayerCount &&
    selectedCategory.length > 0 &&
    Object.keys(validationErrors).length === 0;

  const validatePlayer = (index: number, name: string) => {
    const trimmed = name.trim();
    const newErrors = { ...validationErrors };

    if (trimmed.length === 0) {
      delete newErrors[index];
    } else {
      // Check for duplicates
      const otherNames = playerNames
        .map((n, i) => (i !== index ? n.trim().toLowerCase() : ''))
        .filter(n => n.length > 0);

      if (otherNames.includes(trimmed.toLowerCase())) {
        newErrors[index] = 'Duplicate name';
      } else {
        delete newErrors[index];
      }
    }

    setValidationErrors(newErrors);
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
    validatePlayer(index, name);
  };

  const addPlayer = () => {
    if (playerNames.length < MAX_PLAYERS) {
      haptics.light();
      setPlayerNames([...playerNames, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > MIN_PLAYERS) {
      haptics.light();
      const newNames = playerNames.filter((_, i) => i !== index);
      setPlayerNames(newNames);

      // Re-index validation errors
      const newErrors: Record<number, string> = {};
      Object.entries(validationErrors).forEach(([key, value]) => {
        const oldIndex = parseInt(key);
        if (oldIndex < index) {
          newErrors[oldIndex] = value;
        } else if (oldIndex > index) {
          newErrors[oldIndex - 1] = value;
        }
      });
      setValidationErrors(newErrors);

      // Re-validate all names
      newNames.forEach((name, i) => {
        validatePlayer(i, name);
      });
    }
  };

  const handleStartGame = () => {
    haptics.medium();
    const trimmedNames = playerNames.map(n => n.trim()).filter(n => n.length > 0);
    configurePlayers(trimmedNames);

    if (startRound(selectedCategory)) {
      // Navigation is handled by the store changing phase to 'deal'
    }
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

  return (
    <ScreenContainer>
      <Header title="Lobby" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Players Section */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Players</Text>
              <Text style={styles.playerCount}>
                {validPlayerCount}/{MAX_PLAYERS}
              </Text>
            </View>

            <View style={styles.playersList}>
              {playerNames.map((name, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                  layout={Layout.springify()}
                  style={styles.playerRow}
                >
                  <View style={styles.playerInputContainer}>
                    <TextInput
                      style={[
                        styles.playerInput,
                        validationErrors[index] && styles.playerInputError,
                      ]}
                      placeholder={`Player ${index + 1}`}
                      placeholderTextColor={colors.text.tertiary}
                      value={name}
                      onChangeText={(text) => handleNameChange(index, text)}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                    {playerNames.length > MIN_PLAYERS && (
                      <TouchableOpacity
                        onPress={() => removePlayer(index)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="remove-circle" size={24} color={colors.semantic.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {validationErrors[index] && (
                    <Text style={styles.errorText}>{validationErrors[index]}</Text>
                  )}
                </Animated.View>
              ))}
            </View>

            {playerNames.length < MAX_PLAYERS && (
              <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
                <Ionicons name="add-circle" size={20} color={colors.accent.primary} />
                <Text style={styles.addButtonText}>Add Player</Text>
              </TouchableOpacity>
            )}
          </Card>

          {/* Category Section */}
          <Card style={styles.section}>
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
                    size={24}
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
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Deal Cards"
            onPress={handleStartGame}
            disabled={!canStartGame}
            size="large"
            icon={<Ionicons name="card" size={24} color={colors.text.primary} />}
          />
          <Button
            title="Back to Home"
            onPress={() => {
              haptics.light();
              goToHome();
            }}
            variant="ghost"
            size="medium"
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  playerRow: {
    gap: spacing.xs,
  },
  playerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playerInput: {
    flex: 1,
    ...typography.bodyLarge,
    color: colors.text.primary,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  playerInputError: {
    borderColor: colors.semantic.error,
    backgroundColor: colors.semantic.errorMuted,
  },
  removeButton: {
    padding: spacing.xs,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.semantic.error,
    paddingLeft: spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    borderStyle: 'dashed',
  },
  addButtonText: {
    ...typography.labelLarge,
    color: colors.accent.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
});
