import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

interface SparkleProps {
  emoji?: string;
  delay?: number;
  x: number;
  y: number;
  size?: number;
}

export function Sparkle({ emoji = '✨', delay = 0, x, y, size = 20 }: SparkleProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Twinkling opacity animation
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.2, { duration: 600 })
        ),
        -1,
        true
      )
    );

    // Floating up and down animation
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 1200 }),
          withTiming(8, { duration: 1200 })
        ),
        -1,
        true
      )
    );

    // Scale pulsing
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800 }),
          withTiming(0.8, { duration: 800 })
        ),
        -1,
        true
      )
    );

    // Gentle rotation
    rotate.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(15, { duration: 1000 }),
          withTiming(-15, { duration: 1000 })
        ),
        -1,
        true
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        { left: x, top: y, fontSize: size },
        animatedStyle,
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

// Pre-configured sparkle field for backgrounds
interface SparkleFieldProps {
  count?: number;
  width: number;
  height: number;
}

export function SparkleField({ count = 12, width, height }: SparkleFieldProps) {
  const emojis = ['✨', '⭐', '💫', '🌟', '⭐', '✨'];

  const sparkles = Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: emojis[i % emojis.length],
    x: Math.random() * (width - 30),
    y: Math.random() * (height - 30),
    delay: Math.random() * 2000,
    size: 16 + Math.random() * 12,
  }));

  return (
    <>
      {sparkles.map((sparkle) => (
        <Sparkle
          key={sparkle.id}
          emoji={sparkle.emoji}
          x={sparkle.x}
          y={sparkle.y}
          delay={sparkle.delay}
          size={sparkle.size}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  sparkle: {
    position: 'absolute',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
