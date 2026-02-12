import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Keyboard,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  FadeIn,
  FadeInDown,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { ThemedText } from '@/components/themed-text';
import { SparkleField } from '@/components/sparkle';
import { useBattle } from '@/context/battle-context';
import { Fireworks, ConfettiRain } from '@/components/celebration';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BattleScreen() {
  const insets = useSafeAreaInsets();
  const {
    roomCode,
    room,
    playerRole,
    battleState,
    error,
    hasGuessed,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    submitGuess,
    nextRound,
    playAgain,
  } = useBattle();

  const [joinCode, setJoinCode] = useState('');
  const [guess, setGuess] = useState('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [roundEndCountdown, setRoundEndCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Animation values
  const shakeX = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Pulse animation for waiting
  useEffect(() => {
    if (battleState === 'waiting') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [battleState]);

  // Countdown effect - synced to server timestamp
  useEffect(() => {
    if (battleState === 'countdown' && room?.countdownStartAt) {
      const startTime = room.countdownStartAt.toDate().getTime();

      const updateCountdown = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = 3 - elapsed;

        if (remaining <= 0) {
          setCountdown(null);
          // Host transitions to playing state
          if (playerRole === 'host') {
            import('firebase/firestore').then(({ updateDoc, doc }) => {
              import('@/config/firebase').then(({ db }) => {
                if (roomCode) {
                  updateDoc(doc(db, 'rooms', roomCode), { status: 'playing' });
                }
              });
            });
          }
        } else {
          setCountdown(remaining);
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 100);
      return () => clearInterval(interval);
    }
  }, [battleState, room?.countdownStartAt, playerRole, roomCode]);

  // Clear guess when new round starts
  useEffect(() => {
    if (battleState === 'playing') {
      setGuess('');
    }
  }, [battleState, room?.currentRound]);

  // Round end countdown - auto advance to next round
  useEffect(() => {
    if (battleState === 'round_end') {
      setRoundEndCountdown(5);
      const interval = setInterval(() => {
        setRoundEndCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            // Host triggers next round when countdown ends
            if (playerRole === 'host') {
              nextRound();
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setRoundEndCountdown(null);
    }
  }, [battleState, playerRole]);

  const handleCopyCode = async () => {
    if (roomCode) {
      await Clipboard.setStringAsync(roomCode);
      setCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareCode = async () => {
    if (roomCode) {
      await Share.share({
        message: `Join my Pokemon Battle! Room code: ${roomCode}`,
      });
    }
  };

  const handleGuess = async () => {
    if (!guess.trim()) return;

    const isCorrect = await submitGuess(guess);

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Shake on wrong guess
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setGuess('');
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const isWinner = room?.gameWinner === playerRole;
  const wonRound = room?.roundWinner === playerRole;
  const bothWrong = room?.roundWinner === 'none';

  // Render different states
  const renderContent = () => {
    // Menu state - create or join room
    if (battleState === 'idle' || battleState === 'creating' || battleState === 'joining') {
      return (
        <Animated.View entering={FadeInDown.duration(500)} style={styles.menuContainer}>
          <ThemedText style={styles.title}>⚔️ Battle Mode ⚔️</ThemedText>
          <ThemedText style={styles.subtitle}>Race to guess the Pokemon!</ThemedText>

          {error && (
            <View style={styles.errorBox}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          )}

          {/* Create Room Button */}
          <Pressable
            onPress={createRoom}
            disabled={battleState === 'creating'}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#FF1493', '#FF69B4', '#DA70D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}
            >
              {battleState === 'creating' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.buttonText}>🎮 Create Room</ThemedText>
              )}
            </LinearGradient>
          </Pressable>

          <ThemedText style={styles.orText}>— or —</ThemedText>

          {/* Join Room Section */}
          <View style={styles.joinSection}>
            <LinearGradient
              colors={['#00CED1', '#00FFFF', '#7FFFD4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inputGradientBorder}
            >
              <View style={styles.inputInner}>
                <TextInput
                  style={styles.codeInput}
                  value={joinCode}
                  onChangeText={(text) => setJoinCode(text.toUpperCase())}
                  placeholder="ENTER CODE"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>
            </LinearGradient>

            <Pressable
              onPress={() => joinRoom(joinCode)}
              disabled={joinCode.length !== 6 || battleState === 'joining'}
            >
              <LinearGradient
                colors={['#00CED1', '#00FFFF', '#7FFFD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.joinButton, joinCode.length !== 6 && styles.buttonDisabled]}
              >
                {battleState === 'joining' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.buttonText}>Join</ThemedText>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      );
    }

    // Waiting for opponent
    if (battleState === 'waiting') {
      return (
        <Animated.View entering={FadeIn.duration(500)} style={styles.waitingContainer}>
          <ThemedText style={styles.title}>🎮 Room Created!</ThemedText>

          <Animated.View style={[styles.codeCard, pulseStyle]}>
            <ThemedText style={styles.codeLabel}>Share this code:</ThemedText>
            <ThemedText style={styles.roomCode}>{roomCode}</ThemedText>

            <View style={styles.codeActions}>
              <Pressable onPress={handleCopyCode} style={styles.codeActionButton}>
                <ThemedText style={styles.codeActionText}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </ThemedText>
              </Pressable>
              <Pressable onPress={handleShareCode} style={styles.codeActionButton}>
                <ThemedText style={styles.codeActionText}>📤 Share</ThemedText>
              </Pressable>
            </View>
          </Animated.View>

          <View style={styles.waitingStatus}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <ThemedText style={styles.waitingText}>Waiting for opponent...</ThemedText>
          </View>

          <Pressable onPress={leaveRoom} style={styles.leaveButton}>
            <ThemedText style={styles.leaveButtonText}>Cancel</ThemedText>
          </Pressable>
        </Animated.View>
      );
    }

    // Ready to start (both players joined)
    if (battleState === 'ready') {
      return (
        <Animated.View entering={ZoomIn.duration(500)} style={styles.readyContainer}>
          <ThemedText style={styles.title}>🎯 Ready to Battle!</ThemedText>

          <View style={styles.playersCard}>
            <View style={styles.playerRow}>
              <ThemedText style={styles.playerEmoji}>👤</ThemedText>
              <ThemedText style={styles.playerLabel}>
                You ({playerRole === 'host' ? 'Host' : 'Guest'})
              </ThemedText>
              <ThemedText style={styles.readyBadge}>✓</ThemedText>
            </View>
            <View style={styles.vsRow}>
              <ThemedText style={styles.vsText}>VS</ThemedText>
            </View>
            <View style={styles.playerRow}>
              <ThemedText style={styles.playerEmoji}>👤</ThemedText>
              <ThemedText style={styles.playerLabel}>Opponent</ThemedText>
              <ThemedText style={styles.readyBadge}>✓</ThemedText>
            </View>
          </View>

          {playerRole === 'host' ? (
            <Pressable onPress={startGame} style={styles.buttonWrapper}>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startButton}
              >
                <ThemedText style={styles.startButtonText}>⚡ START BATTLE! ⚡</ThemedText>
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={styles.waitingForHost}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <ThemedText style={styles.waitingText}>Waiting for host to start...</ThemedText>
            </View>
          )}

          <Pressable onPress={leaveRoom} style={styles.leaveButton}>
            <ThemedText style={styles.leaveButtonText}>Leave Room</ThemedText>
          </Pressable>
        </Animated.View>
      );
    }

    // Countdown
    if (battleState === 'countdown' && countdown !== null) {
      return (
        <View style={styles.countdownContainer}>
          <Animated.Text
            entering={ZoomIn.duration(300)}
            key={countdown}
            style={styles.countdownText}
          >
            {countdown === 0 ? 'GO!' : countdown}
          </Animated.Text>
        </View>
      );
    }

    // Playing - show Pokemon and guess input
    if (battleState === 'playing' || battleState === 'countdown') {
      return (
        <View style={styles.battleContainer}>
          {/* Scoreboard */}
          <View style={styles.scoreboard}>
            <View style={styles.scoreItem}>
              <ThemedText style={styles.scoreLabel}>You</ThemedText>
              <ThemedText style={styles.scoreValue}>
                {playerRole === 'host' ? room?.scores.host : room?.scores.guest}
              </ThemedText>
            </View>
            <View style={styles.roundIndicator}>
              <ThemedText style={styles.roundText}>Round {room?.currentRound}/5</ThemedText>
            </View>
            <View style={styles.scoreItem}>
              <ThemedText style={styles.scoreLabel}>Opponent</ThemedText>
              <ThemedText style={styles.scoreValue}>
                {playerRole === 'host' ? room?.scores.guest : room?.scores.host}
              </ThemedText>
            </View>
          </View>

          {/* Pokemon Card */}
          <View style={styles.pokemonCard}>
            <SparkleField count={6} width={280} height={280} />
            {room?.currentPokemon && (
              <Image
                source={{ uri: room.currentPokemon.imageUrl }}
                style={styles.pokemonImage}
                contentFit="contain"
                tintColor="#000000"
              />
            )}
            <ThemedText style={styles.questionMark}>❓</ThemedText>
          </View>

          {/* Guess Input */}
          {hasGuessed ? (
            <View style={styles.waitingForOpponent}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <ThemedText style={styles.waitingText}>
                Waiting for opponent to guess...
              </ThemedText>
            </View>
          ) : (
            <Animated.View style={[styles.inputSection, shakeStyle]}>
              <LinearGradient
                colors={['#FF69B4', '#9B30FF', '#00CED1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.guessInputBorder}
              >
                <View style={styles.inputInner}>
                  <TextInput
                    style={styles.guessInput}
                    value={guess}
                    onChangeText={setGuess}
                    placeholder="Type your guess..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={handleGuess}
                    returnKeyType="go"
                  />
                </View>
              </LinearGradient>

              <Pressable onPress={handleGuess} disabled={!guess.trim()}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.guessButton, !guess.trim() && styles.buttonDisabled]}
                >
                  <ThemedText style={styles.buttonText}>GUESS!</ThemedText>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}
        </View>
      );
    }

    // Round end
    if (battleState === 'round_end') {
      return (
        <Animated.View entering={ZoomIn.duration(500)} style={styles.roundEndContainer}>
          {wonRound && <ConfettiRain />}

          <ThemedText style={styles.roundResultTitle}>
            {bothWrong
              ? '😵 BOTH WRONG! 😵'
              : wonRound
              ? '🎉 YOU WIN THIS ROUND! 🎉'
              : '😢 Too Slow! 😢'}
          </ThemedText>

          {room?.currentPokemon && (
            <View style={styles.revealCard}>
              <Image
                source={{ uri: room.currentPokemon.imageUrl }}
                style={styles.revealImage}
                contentFit="contain"
              />
              <ThemedText style={styles.pokemonName}>
                {room.currentPokemon.name.toUpperCase()}
              </ThemedText>
            </View>
          )}

          <View style={styles.currentScores}>
            <ThemedText style={styles.scoreDisplay}>
              You: {playerRole === 'host' ? room?.scores.host : room?.scores.guest} |
              Opponent: {playerRole === 'host' ? room?.scores.guest : room?.scores.host}
            </ThemedText>
          </View>

          <View style={styles.nextRoundCountdown}>
            <ThemedText style={styles.nextRoundCountdownText}>
              Next round in {roundEndCountdown}...
            </ThemedText>
          </View>
        </Animated.View>
      );
    }

    // Game finished
    if (battleState === 'finished') {
      return (
        <Animated.View entering={ZoomIn.duration(500)} style={styles.finishedContainer}>
          {isWinner && (
            <>
              <Fireworks />
              <ConfettiRain />
            </>
          )}

          <ThemedText style={styles.gameOverTitle}>
            {isWinner ? '🏆 VICTORY! 🏆' : '💀 DEFEAT 💀'}
          </ThemedText>

          <ThemedText style={styles.gameOverSubtitle}>
            {isWinner ? 'You are the Pokemon Master!' : 'Better luck next time!'}
          </ThemedText>

          <View style={styles.finalScores}>
            <ThemedText style={styles.finalScoreText}>
              Final Score: {playerRole === 'host' ? room?.scores.host : room?.scores.guest} - {playerRole === 'host' ? room?.scores.guest : room?.scores.host}
            </ThemedText>
          </View>

          <View style={styles.gameOverButtons}>
            {playerRole === 'host' && (
              <Pressable onPress={playAgain} style={styles.buttonWrapper}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#FF8C00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.playAgainButton}
                >
                  <ThemedText style={styles.buttonText}>🔄 Play Again</ThemedText>
                </LinearGradient>
              </Pressable>
            )}

            <Pressable onPress={leaveRoom} style={styles.buttonWrapper}>
              <LinearGradient
                colors={['#FF6B6B', '#EE5A5A', '#DD4949']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.exitButton}
              >
                <ThemedText style={styles.buttonText}>Exit</ThemedText>
              </LinearGradient>
            </Pressable>
          </View>

          {playerRole === 'guest' && (
            <View style={styles.waitingForHost}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <ThemedText style={styles.waitingText}>Waiting for host...</ThemedText>
            </View>
          )}
        </Animated.View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Lisa Frank Background */}
      <LinearGradient
        colors={['#9B30FF', '#DA70D6', '#FF69B4', '#FF1493', '#FF69B4', '#DA70D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(255, 215, 0, 0.2)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Background Sparkles */}
      <SparkleField count={12} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} />

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Menu styles
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 10,
    lineHeight: 42,
    paddingTop: 5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 40,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.5)',
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 300,
  },
  primaryButton: {
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  orText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginVertical: 25,
  },
  joinSection: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 300,
  },
  inputGradientBorder: {
    flex: 1,
    borderRadius: 15,
    padding: 3,
  },
  inputInner: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    minHeight: 50,
  },
  codeInput: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 3,
  },
  joinButton: {
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Waiting styles
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginVertical: 30,
  },
  codeLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  roomCode: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    lineHeight: 60,
    paddingTop: 5,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  codeActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  codeActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  waitingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waitingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  leaveButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  leaveButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  // Ready styles
  readyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playersCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 300,
    marginVertical: 30,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  playerEmoji: {
    fontSize: 30,
  },
  playerLabel: {
    flex: 1,
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  readyBadge: {
    fontSize: 20,
    color: '#90EE90',
  },
  vsRow: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  startButton: {
    borderRadius: 25,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  startButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  waitingForHost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  // Countdown styles
  countdownContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 10,
  },
  // Battle styles
  battleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 12,
    marginBottom: 15,
  },
  scoreItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 34,
  },
  roundIndicator: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  roundText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  pokemonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    width: 280,
    height: 280,
    marginBottom: 20,
    position: 'relative',
  },
  questionMark: {
    fontSize: 24,
    position: 'absolute',
    top: 20,
    right: 15,
    zIndex: 10,
  },
  pokemonImage: {
    width: 220,
    height: 220,
  },
  inputSection: {
    width: '100%',
    gap: 15,
    paddingHorizontal: 10,
  },
  guessInputBorder: {
    width: '100%',
    borderRadius: 15,
    padding: 3,
  },
  guessInput: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    minHeight: 50,
  },
  guessButton: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  waitingForOpponent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 10,
  },
  // Round end styles
  roundEndContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundResultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  revealCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  revealImage: {
    width: 150,
    height: 150,
  },
  pokemonName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 10,
  },
  currentScores: {
    marginBottom: 30,
  },
  scoreDisplay: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  nextRoundButton: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  nextRoundCountdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  nextRoundCountdownText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Finished styles
  finishedContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    marginBottom: 10,
    lineHeight: 48,
    paddingTop: 5,
  },
  gameOverSubtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 30,
  },
  finalScores: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  finalScoreText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gameOverButtons: {
    gap: 15,
    width: '100%',
    maxWidth: 250,
  },
  playAgainButton: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  exitButton: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
