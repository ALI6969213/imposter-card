import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import { ScreenContainer, Button, Card, Header } from '../components';
import { colors } from '../theme/colors';
import { typography, spacing, borderRadius } from '../theme/typography';
import { useMultiplayerStore } from '../store/multiplayerStore';
import { haptics } from '../utils/haptics';

type Mode = 'select' | 'create' | 'join';

export const JoinScreen: React.FC = () => {
  const {
    connect,
    createRoom,
    joinRoom,
    goToHome,
    isConnecting,
    connectionError,
    isConnected,
  } = useMultiplayerStore();

  const [mode, setMode] = useState<Mode>('select');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect to server when screen loads
    if (!isConnected) {
      connect().catch(() => {
        setError('Unable to connect to server. Please check your connection.');
      });
    }
  }, []);

  const handleCreateRoom = async () => {
    if (playerName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    haptics.medium();

    try {
      if (!isConnected) {
        await connect();
      }
      const result = await createRoom(playerName.trim());
      if (!result.success) {
        setError(result.error || 'Failed to create room');
      }
    } catch (e) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (playerName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (roomCode.length !== 4) {
      setError('Enter a 4-digit room code');
      return;
    }

    setIsLoading(true);
    setError(null);
    haptics.medium();

    try {
      if (!isConnected) {
        await connect();
      }
      const result = await joinRoom(roomCode, playerName.trim());
      if (!result.success) {
        setError(result.error || 'Failed to join room');
      }
    } catch (e) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSelectMode = () => (
    <Animated.View entering={FadeIn.duration(400)} style={styles.selectContainer}>
      <View style={styles.titleContainer}>
        <Ionicons name="people" size={48} color={colors.accent.primary} />
        <Text style={styles.title}>Multiplayer</Text>
        <Text style={styles.subtitle}>Play with friends on their own devices</Text>
      </View>

      <View style={styles.modeButtons}>
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => {
              haptics.selection();
              setMode('create');
            }}
          >
            <View style={styles.modeIconContainer}>
              <Ionicons name="add-circle" size={32} color={colors.accent.primary} />
            </View>
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>Create Room</Text>
              <Text style={styles.modeDescription}>Start a new game and invite friends</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => {
              haptics.selection();
              setMode('join');
            }}
          >
            <View style={styles.modeIconContainer}>
              <Ionicons name="enter" size={32} color={colors.accent.primary} />
            </View>
            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>Join Room</Text>
              <Text style={styles.modeDescription}>Enter a code to join a friend's game</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {(connectionError || !isConnected) && !isConnecting && (
        <Animated.View entering={FadeIn} style={styles.connectionWarning}>
          <Ionicons name="cloud-offline" size={20} color={colors.semantic.warning} />
          <Text style={styles.connectionWarningText}>
            {connectionError || 'Connecting to server...'}
          </Text>
        </Animated.View>
      )}

      {isConnecting && (
        <View style={styles.connectingContainer}>
          <ActivityIndicator color={colors.accent.primary} />
          <Text style={styles.connectingText}>Connecting...</Text>
        </View>
      )}

      <Button
        title="Back"
        onPress={() => {
          haptics.light();
          goToHome();
        }}
        variant="ghost"
        size="medium"
      />
    </Animated.View>
  );

  const renderCreateMode = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.formContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setMode('select');
          setError(null);
        }}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.secondary} />
      </TouchableOpacity>

      <View style={styles.formHeader}>
        <Ionicons name="add-circle" size={40} color={colors.accent.primary} />
        <Text style={styles.formTitle}>Create Room</Text>
      </View>

      <Card style={styles.inputCard}>
        <Text style={styles.inputLabel}>YOUR NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={colors.text.tertiary}
          value={playerName}
          onChangeText={setPlayerName}
          autoCapitalize="words"
          maxLength={20}
        />
      </Card>

      {error && (
        <Animated.View entering={FadeIn} style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color={colors.semantic.error} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      <Button
        title="Create Room"
        onPress={handleCreateRoom}
        disabled={isLoading || playerName.trim().length < 2}
        loading={isLoading}
        size="large"
        icon={<Ionicons name="add" size={24} color={colors.text.primary} />}
      />
    </Animated.View>
  );

  const renderJoinMode = () => (
    <Animated.View entering={FadeIn.duration(300)} style={styles.formContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setMode('select');
          setError(null);
        }}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text.secondary} />
      </TouchableOpacity>

      <View style={styles.formHeader}>
        <Ionicons name="enter" size={40} color={colors.accent.primary} />
        <Text style={styles.formTitle}>Join Room</Text>
      </View>

      <Card style={styles.inputCard}>
        <Text style={styles.inputLabel}>YOUR NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={colors.text.tertiary}
          value={playerName}
          onChangeText={setPlayerName}
          autoCapitalize="words"
          maxLength={20}
        />
      </Card>

      <Card style={styles.inputCard}>
        <Text style={styles.inputLabel}>ROOM CODE</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="0000"
          placeholderTextColor={colors.text.tertiary}
          value={roomCode}
          onChangeText={(text) => setRoomCode(text.replace(/[^0-9]/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
        />
      </Card>

      {error && (
        <Animated.View entering={FadeIn} style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color={colors.semantic.error} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}

      <Button
        title="Join Room"
        onPress={handleJoinRoom}
        disabled={isLoading || playerName.trim().length < 2 || roomCode.length !== 4}
        loading={isLoading}
        size="large"
        icon={<Ionicons name="enter" size={24} color={colors.text.primary} />}
      />
    </Animated.View>
  );

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {mode === 'select' && renderSelectMode()}
        {mode === 'create' && renderCreateMode()}
        {mode === 'join' && renderJoinMode()}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  selectContainer: {
    gap: spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.displaySmall,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  modeButtons: {
    gap: spacing.md,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface.glass,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
    gap: spacing.md,
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    ...typography.titleMedium,
    color: colors.text.primary,
  },
  modeDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  connectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.semantic.warningMuted,
    borderRadius: borderRadius.lg,
  },
  connectionWarningText: {
    ...typography.bodySmall,
    color: colors.semantic.warning,
  },
  connectingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  connectingText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  formContainer: {
    gap: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface.glassLight,
    marginBottom: spacing.md,
  },
  formHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  formTitle: {
    ...typography.headlineMedium,
    color: colors.text.primary,
  },
  inputCard: {
    paddingVertical: spacing.md,
  },
  inputLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    backgroundColor: colors.surface.glassLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  codeInput: {
    ...typography.headlineLarge,
    textAlign: 'center',
    letterSpacing: 8,
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
});
