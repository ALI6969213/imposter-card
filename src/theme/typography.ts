import { Platform, TextStyle } from 'react-native';

// Using SF Pro for iOS, system font for Android - with distinctive weights
const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const typography = {
  // Display styles - for big hero moments
  displayLarge: {
    fontFamily,
    fontSize: 56,
    fontWeight: '800' as const,
    letterSpacing: -1.5,
    lineHeight: 64,
  } as TextStyle,
  
  displayMedium: {
    fontFamily,
    fontSize: 44,
    fontWeight: '700' as const,
    letterSpacing: -1,
    lineHeight: 52,
  } as TextStyle,
  
  displaySmall: {
    fontFamily,
    fontSize: 36,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 44,
  } as TextStyle,
  
  // Headlines
  headlineLarge: {
    fontFamily,
    fontSize: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
    lineHeight: 40,
  } as TextStyle,
  
  headlineMedium: {
    fontFamily,
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 36,
  } as TextStyle,
  
  headlineSmall: {
    fontFamily,
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 32,
  } as TextStyle,
  
  // Titles
  titleLarge: {
    fontFamily,
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 28,
  } as TextStyle,
  
  titleMedium: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
    lineHeight: 24,
  } as TextStyle,
  
  titleSmall: {
    fontFamily,
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 22,
  } as TextStyle,
  
  // Body
  bodyLarge: {
    fontFamily,
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  } as TextStyle,
  
  bodyMedium: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 22,
  } as TextStyle,
  
  bodySmall: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 18,
  } as TextStyle,
  
  // Labels
  labelLarge: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 20,
  } as TextStyle,
  
  labelMedium: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 18,
  } as TextStyle,
  
  labelSmall: {
    fontFamily,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
    textTransform: 'uppercase' as const,
  } as TextStyle,
  
  // Monospace for timer
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 48,
    fontWeight: '700' as const,
    letterSpacing: 2,
    lineHeight: 56,
  } as TextStyle,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};
