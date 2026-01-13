import React from 'react';
import { View, StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { spacing } from '../theme/typography';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showGradient?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  showGradient = true,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {showGradient && (
        <LinearGradient
          colors={[colors.background.primary, colors.background.secondary]}
          style={StyleSheet.absoluteFill}
        />
      )}
      {/* Decorative gradient orbs */}
      <View style={styles.orbContainer}>
        <View style={[styles.orb, styles.orbTop]} />
        <View style={[styles.orb, styles.orbBottom]} />
      </View>
      <SafeAreaView style={[styles.safeArea, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.08,
  },
  orbTop: {
    top: -150,
    right: -100,
    backgroundColor: colors.accent.primary,
  },
  orbBottom: {
    bottom: -200,
    left: -150,
    backgroundColor: colors.accent.secondary,
  },
});
