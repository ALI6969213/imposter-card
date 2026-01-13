import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography, spacing } from '../theme/typography';
import { haptics } from '../utils/haptics';

interface HeaderProps {
  title: string;
  onSettingsPress?: () => void;
  showSettings?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onSettingsPress,
  showSettings = false,
}) => {
  const handleSettingsPress = () => {
    haptics.light();
    onSettingsPress?.();
  };

  return (
    <View style={styles.header}>
      <View style={styles.spacer} />
      <Text style={styles.title}>{title}</Text>
      {showSettings ? (
        <TouchableOpacity onPress={handleSettingsPress} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  spacer: {
    width: 40,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface.glassLight,
  },
});
