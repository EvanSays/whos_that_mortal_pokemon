import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Keyboard,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { SparkleField } from '@/components/sparkle';
import { Fireworks, UnicornCelebration, ConfettiRain, BloodRain, ToastyCelebration } from '@/components/celebration';
import { useGuessHistory } from '@/context/guess-history';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Types
interface Pokemon {
  id: number;
  name: string;
  sprites: {
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}

// API function
async function fetchRandomPokemon(): Promise<Pokemon> {
  const randomId = Math.floor(Math.random() * 151) + 1;
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
  if (!response.ok) throw new Error('Failed to fetch Pokemon');
  return response.json();
}

// Normalize string for comparison
function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

// Configure audio mode (call once)
async function configureAudio() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.log('Audio mode config error:', error);
  }
}

// Play a sound from URL
async function playSoundFromUrl(url: string) {
  try {
    await configureAudio();
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, volume: 1.0 }
    );

    // Unload after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log('Sound playback error:', error);
  }
}

// Play victory sound - Pokemon healing/success jingle
async function playVictorySound() {
  // Pokemon Center healing complete sound
  await playSoundFromUrl('https://play.pokemonshowdown.com/audio/cries/pikachu.mp3');
}

// Play wrong guess sound - Pokemon faint/miss sound
async function playWrongSound() {
  // Sad Pokemon sound (Psyduck)
  await playSoundFromUrl('https://play.pokemonshowdown.com/audio/cries/psyduck.mp3');
}

// Play Mortal Kombat FATALITY sound - LOUD
async function playBloodDrippingSound() {
  try {
    await configureAudio();
    const url = 'https://www.myinstants.com/media/sounds/16_2.mp3';

    // Play twice with slight delay for louder, more impactful effect
    const { sound: sound1 } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true, volume: 1.0 }
    );

    // Second sound slightly delayed for echo/chorus effect
    setTimeout(async () => {
      const { sound: sound2 } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, volume: 1.0 }
      );
      sound2.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound2.unloadAsync();
        }
      });
    }, 50);

    sound1.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound1.unloadAsync();
      }
    });
  } catch (error) {
    console.log('Fatality sound error:', error);
  }
}

// Play Mortal Kombat TOASTY! sound
async function playToastySound() {
  await playSoundFromUrl('https://www.myinstants.com/media/sounds/toasty_tfCWsU6.mp3');
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { addGuess } = useGuessHistory();

  // Game state
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [guess, setGuess] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [showBloodRain, setShowBloodRain] = useState(false);
  const [showToasty, setShowToasty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const shakeX = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const inputBorderColor = useSharedValue(0); // 0 = normal, 1 = red (wrong)

  // Load Pokemon on mount
  useEffect(() => {
    loadNewPokemon();
  }, []);

  const loadNewPokemon = async () => {
    setIsLoading(true);
    setIsRevealed(false);
    setWasCorrect(false);
    setShowCelebration(false);
    setShowBloodRain(false);
    setShowToasty(false);
    setGuess('');
    setError(null);
    cardScale.value = 1;

    try {
      const newPokemon = await fetchRandomPokemon();
      setPokemon(newPokemon);
    } catch (err) {
      setError('Failed to load Pokemon. Tap to retry!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuess = async () => {
    if (!pokemon || !guess.trim() || isRevealed) return;

    const normalizedGuess = normalizeString(guess);
    const normalizedPokemonName = normalizeString(pokemon.name);

    if (normalizedGuess === normalizedPokemonName) {
      // CORRECT! You're a Pokemon Master! Celebrate with lots of vibrations!
      playVictorySound();
      setIsRevealed(true);
      setWasCorrect(true);
      setShowCelebration(true);
      cardScale.value = withSpring(1.1, { damping: 8 });
      Keyboard.dismiss();

      // Save to history
      addGuess({
        pokemonName: pokemon.name,
        pokemonId: pokemon.id,
        imageUrl: pokemon.sprites.other['official-artwork'].front_default,
        wasCorrect: true,
      });

      // TOASTY! - trigger after a 1 second delay
      setTimeout(() => {
        setShowToasty(true);
        playToastySound();
      }, 1000);

      // Victory vibration pattern - go crazy!
      const vibratePattern = async () => {
        // First burst - quick celebrations
        for (let i = 0; i < 5; i++) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await new Promise(resolve => setTimeout(resolve, 80));
        }
        // Pause
        await new Promise(resolve => setTimeout(resolve, 200));
        // Second burst - even more!
        for (let i = 0; i < 8; i++) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await new Promise(resolve => setTimeout(resolve, 60));
        }
        // Final big ones
        await new Promise(resolve => setTimeout(resolve, 150));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await new Promise(resolve => setTimeout(resolve, 200));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await new Promise(resolve => setTimeout(resolve, 200));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      };
      vibratePattern();
    } else {
      // WRONG - vibrate, play blood sound, reveal, and load new Pokemon
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      playBloodDrippingSound();

      // Save to history
      addGuess({
        pokemonName: pokemon.name,
        pokemonId: pokemon.id,
        imageUrl: pokemon.sprites.other['official-artwork'].front_default,
        wasCorrect: false,
      });

      // Shake animation
      shakeX.value = withSequence(
        withTiming(-15, { duration: 50 }),
        withTiming(15, { duration: 50 }),
        withTiming(-15, { duration: 50 }),
        withTiming(15, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      // Reveal the Pokemon with BLOOD RAIN
      setIsRevealed(true);
      setShowBloodRain(true);
      Keyboard.dismiss();

      // Load new Pokemon after blood drips and pools for 2 seconds
      setTimeout(() => {
        loadNewPokemon();
      }, 5500);
    }
  };

  // Animated styles
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: inputBorderColor.value === 1 ? '#FF0000' : 'rgba(255, 255, 255, 0.6)',
  }));

  const imageUrl = pokemon?.sprites?.other?.['official-artwork']?.front_default;

  return (
    <View style={styles.container}>
      {/* Lisa Frank Background */}
      <LinearGradient
        colors={['#FF1493', '#FF69B4', '#DA70D6', '#9B30FF', '#00CED1', '#00FFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(255, 105, 180, 0.4)', 'rgba(255, 255, 0, 0.3)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0, 255, 255, 0.3)', 'transparent', 'rgba(255, 0, 255, 0.3)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Background Sparkles */}
      <SparkleField count={15} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} />

      {/* Celebration Animations */}
      {showCelebration && (
        <>
          <Fireworks />
          <UnicornCelebration />
          <ConfettiRain />
        </>
      )}

      {/* TOASTY! */}
      {showToasty && <ToastyCelebration />}

      {/* Main Content */}
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Title */}
        <Animated.View entering={FadeInDown.duration(600)}>
          <ThemedText style={styles.title}>✨ Who's That Pokémon? ✨</ThemedText>
        </Animated.View>

        {/* Pokemon Card */}
        <Animated.View style={[styles.pokemonCard, cardAnimatedStyle]}>
          <SparkleField count={8} width={280} height={300} />

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <ThemedText style={styles.loadingText}>Loading...</ThemedText>
            </View>
          ) : error ? (
            <Pressable onPress={loadNewPokemon} style={styles.errorContainer}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </Pressable>
          ) : (
            <>
              <ThemedText style={styles.questionMark}>❓</ThemedText>
              {imageUrl && (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.pokemonImage}
                  contentFit="contain"
                  tintColor={isRevealed ? undefined : '#000000'}
                  transition={500}
                />
              )}
              {isRevealed && (
                <Animated.View entering={ZoomIn.duration(500).delay(300)}>
                  {wasCorrect && (
                    <ThemedText style={styles.pokemonMasterText}>
                      🏆 POKÉMON MASTER! 🏆
                    </ThemedText>
                  )}
                  <ThemedText style={[styles.pokemonName, !wasCorrect && styles.wrongGuessName]}>
                    {wasCorrect
                      ? `🎉 ${pokemon?.name.toUpperCase()}! 🎉`
                      : `It was ${pokemon?.name.toUpperCase()}!`
                    }
                  </ThemedText>
                  {!wasCorrect && (
                    <ThemedText style={styles.nextPokemonText}>
                      Loading next Pokémon...
                    </ThemedText>
                  )}
                </Animated.View>
              )}
            </>
          )}
        </Animated.View>

        {/* Input Section */}
        {!isRevealed && !isLoading && !error && (
          <Animated.View style={[styles.inputSection, shakeStyle]}>
            {/* Sparkly Input */}
            <View style={styles.inputWrapper}>
              <LinearGradient
                colors={['#FF69B4', '#9B30FF', '#00CED1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inputGradientBorder}
              >
                <Animated.View style={[styles.inputInner, inputAnimatedStyle]}>
                  <TextInput
                    style={styles.textInput}
                    value={guess}
                    onChangeText={setGuess}
                    placeholder="✨ Enter Pokémon name ✨"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={handleGuess}
                    returnKeyType="go"
                  />
                </Animated.View>
              </LinearGradient>
            </View>

            {/* Sparkly Guess Button */}
            <Pressable onPress={handleGuess} disabled={!guess.trim()}>
              <LinearGradient
                colors={['#FF1493', '#FF69B4', '#DA70D6', '#9B30FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.guessButton, !guess.trim() && styles.guessButtonDisabled]}
              >
                <ThemedText style={styles.guessButtonText}>⭐ GUESS! ⭐</ThemedText>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Play Again Button */}
        {isRevealed && wasCorrect && (
          <Animated.View entering={FadeIn.duration(500).delay(2000)}>
            <Pressable onPress={loadNewPokemon}>
              <LinearGradient
                colors={['#00CED1', '#00FFFF', '#7FFFD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.playAgainButton}
              >
                <ThemedText style={styles.playAgainText}>✨ Play Again! ✨</ThemedText>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* FATALITY - Blood drips ON TOP of everything */}
      {showBloodRain && <BloodRain />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  pokemonCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    width: 300,
    minHeight: 320,
    overflow: 'hidden',
  },
  questionMark: {
    fontSize: 40,
    marginBottom: 10,
  },
  pokemonImage: {
    width: 200,
    height: 200,
  },
  pokemonMasterText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(255, 100, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  pokemonName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFF00',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  wrongGuessName: {
    color: '#FFFFFF',
  },
  nextPokemonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  inputSection: {
    width: '100%',
    marginTop: 25,
    gap: 15,
  },
  inputWrapper: {
    width: '100%',
  },
  inputGradientBorder: {
    borderRadius: 25,
    padding: 3,
  },
  inputInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  textInput: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  guessButton: {
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  guessButtonDisabled: {
    opacity: 0.6,
  },
  guessButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  playAgainButton: {
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 40,
    marginTop: 30,
    shadowColor: '#00CED1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  playAgainText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
