import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';

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

// Play victory sound - Pikachu cry
export async function playVictorySound() {
  await playSoundFromUrl('https://play.pokemonshowdown.com/audio/cries/pikachu.mp3');
}

// Play wrong guess sound - Psyduck cry
export async function playWrongSound() {
  await playSoundFromUrl('https://play.pokemonshowdown.com/audio/cries/psyduck.mp3');
}

// Play Mortal Kombat FATALITY sound - LOUD
export async function playFatalitySound() {
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
export async function playToastySound() {
  await playSoundFromUrl('https://www.myinstants.com/media/sounds/toasty_tfCWsU6.mp3');
}

// Victory vibration pattern - go crazy!
export async function playVictoryVibration() {
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
}

// Defeat vibration
export async function playDefeatVibration() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

