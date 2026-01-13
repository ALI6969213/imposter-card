import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import { ScreenContainer, Button, Card } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useGameStore } from '../store/gameStore';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { haptics } from '../utils/haptics';
import { AppTheme } from '../types';

interface HomeScreenProps {
  onMultiplayer?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onMultiplayer }) => {
  const { goToLobby, theme, setTheme } = useGameStore();
  const { goToJoin } = useMultiplayerStore();
  const [showSettings, setShowSettings] = useState(false);

  // Animated glow effect
  const glowOpacity = useSharedValue(0.5);
  
  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.5, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleLocalPlay = () => {
    haptics.medium();
    goToLobby();
  };

  const handleMultiplayer = () => {
    haptics.medium();
    if (onMultiplayer) {
      onMultiplayer();
    } else {
      goToJoin();
    }
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    haptics.selection();
    setTheme(newTheme);
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Logo and Title */}
        <View style={styles.heroSection}>
          <Animated.View
            entering={FadeIn.delay(200).duration(800)}
            style={styles.logoContainer}
          >
            <Animated.View style={[styles.logoGlow, glowStyle]} />
            
            <View style={styles.logoInner}>
              <Ionicons name="skull-outline" size={64} color={colors.accent.primary} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(600)}>
            <Text style={styles.title}>IMPOSTER</Text>
            <Text style={styles.subtitle}>CARDS</Text>
          </Animated.View>

          <Animated.Text
            entering={FadeInUp.delay(600).duration(600)}
            style={styles.tagline}
          >
            Find the imposter among your friends
          </Animated.Text>
        </View>

        {/* Action Buttons */}
        <Animated.View
          entering={FadeInUp.delay(800).duration(600)}
          style={styles.actionSection}
        >
          {/* Multiplayer Button */}
          <Button
            title="Multiplayer"
            onPress={handleMultiplayer}
            size="large"
            icon={<Ionicons name="people" size={24} color={colors.text.primary} />}
          />

          {/* Local Play Button */}
          <Button
            title="Pass & Play"
            onPress={handleLocalPlay}
            variant="secondary"
            size="large"
            icon={<Ionicons name="phone-portrait-outline" size={24} color={colors.text.primary} />}
          />

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              haptics.light();
              setShowSettings(true);
            }}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* How to Play hint */}
        <Animated.View
          entering={FadeIn.delay(1000).duration(600)}
          style={styles.hintSection}
        >
          <View style={styles.hintCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text.tertiary} />
            <Text style={styles.hintText}>
              3-12 players • Each gets a prompt • Find who has a different one
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity
              onPress={() => setShowSettings(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <Card style={styles.settingsCard}>
            <Text style={styles.settingLabel}>Theme</Text>
            <View style={styles.themeButtons}>
              {(['system', 'light', 'dark'] as AppTheme[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.themeButton,
                    theme === t && styles.themeButtonActive,
                  ]}
                  onPress={() => handleThemeChange(t)}
                >
                  <Ionicons
                    name={
                      t === 'system'
                        ? 'phone-portrait-outline'
                        : t === 'light'
                        ? 'sunny-outline'
                        : 'moon-outline'
                    }
                    size={20}
                    color={theme === t ? colors.text.primary : colors.text.secondary}
                  />
                  <Text
                    style={[
                      styles.themeButtonText,
                      theme === t && styles.themeButtonTextActive,
                    ]}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <Card style={styles.settingsCard}>
            <Text style={styles.settingLabel}>Game Modes</Text>
            <View style={styles.modeInfo}>
              <View style={styles.modeItem}>
                <Ionicons name="people" size={20} color={colors.accent.primary} />
                <View style={styles.modeTextContainer}>
                  <Text style={styles.modeTitle}>Multiplayer</Text>
                  <Text style={styles.modeDescription}>
                    Everyone plays on their own device with a room code
                  </Text>
                </View>
              </View>
              <View style={styles.modeItem}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.accent.primary} />
                <View style={styles.modeTextContainer}>
                  <Text style={styles.modeTitle}>Pass & Play</Text>
                  <Text style={styles.modeDescription}>
                    Share one device, passing it around to view cards
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          <Card style={styles.settingsCard}>
            <Text style={styles.settingLabel}>About</Text>
            <Text style={styles.aboutText}>
              Imposter Cards is a social deduction party game where one player receives
              a different prompt than everyone else. Discuss and vote to find the imposter!
            </Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </Card>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.accent.primary,
    opacity: 0.3,
  },
  logoInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  title: {
    ...typography.displayLarge,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 8,
  },
  subtitle: {
    ...typography.displayMedium,
    color: colors.accent.primary,
    textAlign: 'center',
    letterSpacing: 12,
    marginTop: -spacing.sm,
  },
  tagline: {
    ...typography.bodyLarge,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  actionSection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  settingsButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginTop: spacing.sm,
  },
  hintSection: {
    paddingBottom: spacing.xl,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.lg,
  },
  hintText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.headlineMedium,
    color: colors.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface.glassLight,
  },
  settingsCard: {
    marginBottom: spacing.md,
  },
  settingLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeButtonActive: {
    backgroundColor: colors.accent.muted,
    borderColor: colors.accent.primary,
  },
  themeButtonText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },
  themeButtonTextActive: {
    color: colors.text.primary,
  },
  modeInfo: {
    gap: spacing.md,
  },
  modeItem: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
  modeDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  aboutText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  versionText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
});
