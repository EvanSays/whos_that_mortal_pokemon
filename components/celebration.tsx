import { useEffect } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============== FIREWORKS ==============
interface FireworkParticle {
  id: number;
  emoji: string;
  angle: number;
  distance: number;
  delay: number;
  size: number;
}

interface FireworksProps {
  onComplete?: () => void;
}

export function Fireworks({ onComplete }: FireworksProps) {
  const emojis = ['✨', '⭐', '💫', '🌟', '🎆', '🎇', '💖', '💜', '💙', '💛'];

  // Create particles exploding from center
  const particles: FireworkParticle[] = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    emoji: emojis[i % emojis.length],
    angle: (i * 12) + Math.random() * 10, // Spread around 360 degrees
    distance: 100 + Math.random() * 150,
    delay: Math.random() * 300,
    size: 20 + Math.random() * 16,
  }));

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(onComplete, 2500);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  return (
    <View style={styles.fireworksContainer} pointerEvents="none">
      {particles.map((particle) => (
        <FireworkParticle key={particle.id} {...particle} />
      ))}
    </View>
  );
}

function FireworkParticle({ emoji, angle, distance, delay, size }: FireworkParticle) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );
    opacity.value = withDelay(
      delay + 800,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const radians = (angle * Math.PI) / 180;
    const x = Math.cos(radians) * distance * progress.value;
    const y = Math.sin(radians) * distance * progress.value;

    return {
      opacity: opacity.value,
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: 1 - progress.value * 0.3 },
        { rotate: `${progress.value * 360}deg` },
      ],
    };
  });

  return (
    <Animated.Text
      style={[
        styles.fireworkParticle,
        { fontSize: size },
        animatedStyle,
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

// ============== UNICORN CELEBRATION ==============
interface UnicornCelebrationProps {
  onComplete?: () => void;
}

export function UnicornCelebration({ onComplete }: UnicornCelebrationProps) {
  const translateX = useSharedValue(-100);
  const translateY = useSharedValue(SCREEN_HEIGHT / 2 - 100);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const rainbowWidth = useSharedValue(0);

  useEffect(() => {
    // Unicorn entrance
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSpring(1.5, { damping: 8 });

    // Unicorn flies across screen
    translateX.value = withTiming(SCREEN_WIDTH + 100, {
      duration: 2500,
      easing: Easing.inOut(Easing.cubic)
    });

    // Slight bounce in Y
    translateY.value = withSequence(
      withTiming(SCREEN_HEIGHT / 2 - 150, { duration: 1000 }),
      withTiming(SCREEN_HEIGHT / 2 - 80, { duration: 1500 })
    );

    // Rainbow trail follows
    rainbowWidth.value = withDelay(200, withTiming(SCREEN_WIDTH + 200, { duration: 2300 }));

    if (onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  const unicornStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const rainbowStyle = useAnimatedStyle(() => ({
    width: rainbowWidth.value,
    opacity: opacity.value * 0.8,
  }));

  return (
    <View style={styles.unicornContainer} pointerEvents="none">
      {/* Rainbow Trail */}
      <Animated.View style={[styles.rainbowTrail, rainbowStyle]}>
        <LinearGradient
          colors={['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rainbowGradient}
        />
      </Animated.View>

      {/* Unicorn */}
      <Animated.Text style={[styles.unicorn, unicornStyle]}>
        🦄
      </Animated.Text>

      {/* Sparkle trail behind unicorn */}
      <UnicornSparkles translateX={translateX} />
    </View>
  );
}

function UnicornSparkles({ translateX }: { translateX: SharedValue<number> }) {
  const sparkles = ['✨', '💖', '⭐', '💜', '🌟'];

  return (
    <>
      {sparkles.map((emoji, i) => (
        <UnicornSparkle
          key={i}
          emoji={emoji}
          delay={i * 150}
          offsetY={(i - 2) * 25}
          parentX={translateX}
        />
      ))}
    </>
  );
}

function UnicornSparkle({
  emoji,
  delay,
  offsetY,
  parentX
}: {
  emoji: string;
  delay: number;
  offsetY: number;
  parentX: SharedValue<number>;
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay + 500,
      withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1500, withTiming(0, { duration: 500 }))
      )
    );
    scale.value = withDelay(
      delay + 500,
      withSequence(
        withSpring(1.2, { damping: 5 }),
        withDelay(1500, withTiming(0, { duration: 500 }))
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: parentX.value - 80 - delay * 0.5 },
      { translateY: SCREEN_HEIGHT / 2 - 100 + offsetY },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.Text style={[styles.unicornSparkle, style]}>
      {emoji}
    </Animated.Text>
  );
}

// ============== CONFETTI RAIN ==============
export function ConfettiRain() {
  const emojis = ['✨', '⭐', '💫', '🌟', '💖', '💜', '💙', '💛', '🎊', '🎉'];

  const confetti = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    emoji: emojis[i % emojis.length],
    startX: Math.random() * SCREEN_WIDTH,
    delay: Math.random() * 1000,
    duration: 2000 + Math.random() * 1000,
    size: 16 + Math.random() * 12,
  }));

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {confetti.map((c) => (
        <ConfettiPiece key={c.id} {...c} />
      ))}
    </View>
  );
}

function ConfettiPiece({
  emoji,
  startX,
  delay,
  duration,
  size
}: {
  emoji: string;
  startX: number;
  delay: number;
  duration: number;
  size: number;
}) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 50, { duration, easing: Easing.linear })
    );
    translateX.value = withDelay(
      delay,
      withTiming(startX + (Math.random() - 0.5) * 100, { duration })
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * 3, { duration, easing: Easing.linear })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.Text style={[styles.confetti, { fontSize: size }, style]}>
      {emoji}
    </Animated.Text>
  );
}

// ============== TOASTY! (Mortal Kombat Easter Egg) ==============
export function ToastyCelebration() {
  const translateX = useSharedValue(150);
  const translateY = useSharedValue(100);

  useEffect(() => {
    // Pop in from bottom-right corner immediately
    translateX.value = withSpring(0, { damping: 12, stiffness: 100 });
    translateY.value = withSpring(0, { damping: 12, stiffness: 100 });

    // Pop back out after showing
    const timer = setTimeout(() => {
      translateX.value = withTiming(150, { duration: 300, easing: Easing.in(Easing.cubic) });
      translateY.value = withTiming(100, { duration: 300, easing: Easing.in(Easing.cubic) });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View style={[styles.toastyContainer, animatedStyle]}>
      <Animated.Text style={styles.toastyFace}>😏</Animated.Text>
      <Animated.Text style={styles.toastyText}>TOASTY!</Animated.Text>
    </Animated.View>
  );
}

// ============== BLOOD DRIPS (dripping down to pool at bottom) ==============
export function BloodRain() {
  // Blood drips falling down the screen
  const drips = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: (SCREEN_WIDTH / 12) * i + Math.random() * 20,
    delay: i * 100,
    speed: 2000 + Math.random() * 1000,
  }));

  return (
    <View style={styles.bloodRainContainer} pointerEvents="none">
      {/* Subtle dark overlay */}
      <View style={styles.subtleOverlay} />

      {/* Blood drips falling all the way down */}
      {drips.map((drip) => (
        <RealisticDrip key={drip.id} x={drip.x} delay={drip.delay} speed={drip.speed} />
      ))}

      {/* Blood pooling at the bottom */}
      <BloodPoolBottom />
    </View>
  );
}

// Blood pool that forms at the bottom
function BloodPoolBottom() {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Start forming after drips start arriving
    opacity.value = withDelay(1500, withTiming(1, { duration: 300 }));
    height.value = withDelay(
      1500,
      withTiming(120, { duration: 2000, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.bloodPoolBottom, style]}>
      <LinearGradient
        colors={['transparent', 'rgba(139, 0, 0, 0.6)', 'rgba(100, 0, 0, 0.9)', 'rgba(60, 0, 0, 1)']}
        style={StyleSheet.absoluteFill}
      />
      {/* Surface ripples */}
      <View style={[styles.poolRipple, { left: '20%', bottom: 60 }]} />
      <View style={[styles.poolRipple, { left: '50%', bottom: 70 }]} />
      <View style={[styles.poolRipple, { left: '75%', bottom: 50 }]} />
      {/* Shiny reflection */}
      <View style={styles.poolReflection} />
    </Animated.View>
  );
}

// Realistic blood drip that runs all the way down the screen
function RealisticDrip({ x, delay, speed }: { x: number; delay: number; speed: number }) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);
  const wobble = useSharedValue(0);

  const width = 6 + Math.random() * 14;

  useEffect(() => {
    // Fade in
    opacity.value = withDelay(delay, withTiming(0.95, { duration: 150 }));

    // Drip grows all the way to the bottom - accelerates like gravity
    height.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT, {
        duration: speed,
        easing: Easing.in(Easing.quad), // Accelerates like real gravity
      })
    );

    // Subtle wobble for liquid feel
    wobble.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.5, { duration: 150 }),
          withTiming(-1.5, { duration: 150 })
        ),
        -1,
        true
      )
    );
  }, []);

  const dripStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    height: height.value,
    transform: [{ translateX: wobble.value }],
  }));

  return (
    <Animated.View style={[styles.realisticDrip, { left: x, width }, dripStyle]}>
      {/* Shiny highlight for wet look */}
      <View style={[styles.dripHighlight, { width: width * 0.25 }]} />
      {/* Drip bulge at bottom */}
      <View style={[styles.dripBulge, { width: width * 1.4, height: width * 1.6, marginLeft: -(width * 0.2) }]} />
    </Animated.View>
  );
}

// Pulsing blood overlay for that heartbeat effect
function BloodPulseOverlay() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 300 }),
        withTiming(0.3, { duration: 300 })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.bloodOverlay, style]} />;
}

// Blood splat on screen - like it hit the camera
function ScreenBloodSplat({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.9, { duration: 50 }));
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.3, { damping: 3, stiffness: 300 }),
        withTiming(1, { duration: 200 })
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.screenSplat, { left: x - size/2, top: y - size/2, width: size, height: size }, style]}>
      {/* Splatter tendrils */}
      <View style={[styles.splatTendril, { transform: [{ rotate: '0deg' }], top: -20 }]} />
      <View style={[styles.splatTendril, { transform: [{ rotate: '45deg' }], right: -15, top: 10 }]} />
      <View style={[styles.splatTendril, { transform: [{ rotate: '90deg' }], right: -20 }]} />
      <View style={[styles.splatTendril, { transform: [{ rotate: '135deg' }], right: -15, bottom: 10 }]} />
      <View style={[styles.splatTendril, { transform: [{ rotate: '180deg' }], bottom: -20 }]} />
      <View style={[styles.splatTendril, { transform: [{ rotate: '225deg' }], left: -15, bottom: 10 }]} />
      <View style={[styles.splatTendril, { transform: [{ rotate: '270deg' }], left: -20 }]} />
      <View style={[styles.splatTendril, { transform: [{ rotate: '315deg' }], left: -15, top: 10 }]} />
      {/* Gross center with highlights for wet look */}
      <View style={styles.splatCenter}>
        <View style={styles.splatHighlight} />
      </View>
    </Animated.View>
  );
}

// Thick blood dripping from top
function ThickBloodDrip({ x, delay }: { x: number; delay: number }) {
  const height = useSharedValue(0);
  const dripY = useSharedValue(0);
  const dripOpacity = useSharedValue(0);

  useEffect(() => {
    // Blood oozes down from top
    height.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT * 0.4 + Math.random() * SCREEN_HEIGHT * 0.4, {
        duration: 2500,
        easing: Easing.inOut(Easing.quad)
      })
    );
    // Drip falls off the end
    dripOpacity.value = withDelay(delay + 1500, withTiming(1, { duration: 100 }));
    dripY.value = withDelay(
      delay + 1500,
      withTiming(SCREEN_HEIGHT, { duration: 1000, easing: Easing.in(Easing.quad) })
    );
  }, []);

  const streamStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  const dripStyle = useAnimatedStyle(() => ({
    opacity: dripOpacity.value,
    transform: [{ translateY: dripY.value }],
  }));

  return (
    <View style={[styles.bloodDripContainer, { left: x }]}>
      <Animated.View style={[styles.thickBloodStream, streamStyle]}>
        {/* Highlight for wet/shiny look */}
        <View style={styles.bloodStreamHighlight} />
      </Animated.View>
      <Animated.View style={[styles.fallingDrip, dripStyle]} />
    </View>
  );
}

// Pooling blood at bottom of screen
function BloodPool() {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(500, withTiming(1, { duration: 300 }));
    height.value = withDelay(500, withTiming(150, { duration: 2000, easing: Easing.out(Easing.quad) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.bloodPool, style]}>
      <LinearGradient
        colors={['transparent', 'rgba(139, 0, 0, 0.7)', 'rgba(80, 0, 0, 0.95)']}
        style={StyleSheet.absoluteFill}
      />
      {/* Bubbling effect */}
      <View style={[styles.bloodBubble, { left: '20%', bottom: 40 }]} />
      <View style={[styles.bloodBubble, { left: '50%', bottom: 60 }]} />
      <View style={[styles.bloodBubble, { left: '75%', bottom: 30 }]} />
    </Animated.View>
  );
}

// Blood splatter and drip images from the web
const BLOOD_SPLATTER_IMAGES = [
  'https://www.freeiconspng.com/uploads/blood-png-1.png',
  'https://www.freeiconspng.com/uploads/blood-splatter-png-4.png',
  'https://www.freeiconspng.com/uploads/blood-splatter-png-13.png',
  'https://www.freeiconspng.com/uploads/blood-splatter-png-15.png',
];

// Dripping blood overlays
const BLOOD_DRIP_IMAGES = [
  'https://www.freeiconspng.com/uploads/blood-png-1.png',
  'https://www.freeiconspng.com/uploads/blood-png-12.png',
];

// Guts that splat on screen and slide down - NOW WITH REAL IMAGES
function GutsSplatter({ x, delay }: { x: number; delay: number }) {
  const translateY = useSharedValue(-200);
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0);
  const slideY = useSharedValue(0);
  const rotate = useSharedValue(Math.random() * 30 - 15);

  // Pick a random splatter image
  const imageUrl = BLOOD_SPLATTER_IMAGES[Math.floor(Math.random() * BLOOD_SPLATTER_IMAGES.length)];

  useEffect(() => {
    // Guts fly in and HIT the screen - BOOM!
    opacity.value = withDelay(delay, withTiming(1, { duration: 50 }));
    translateY.value = withDelay(
      delay,
      withSequence(
        // Fly in FAST and hard
        withTiming(SCREEN_HEIGHT * 0.25, { duration: 150, easing: Easing.out(Easing.quad) }),
      )
    );
    // SPLAT effect - gets bigger on impact like it's hitting glass
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(0.8, { duration: 100 }),
        withSpring(1.5, { damping: 3, stiffness: 200 }),
        withTiming(1.3, { duration: 300 }),
      )
    );
    // Then slowly slide down the screen - gross dripping effect
    slideY.value = withDelay(
      delay + 300,
      withTiming(SCREEN_HEIGHT * 0.7, { duration: 3000, easing: Easing.in(Easing.cubic) })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x },
      { translateY: translateY.value + slideY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.gutsSplatter, style]}>
      {/* Real blood splatter image */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.gutsImage}
        contentFit="contain"
      />
      {/* Extra dripping pieces for grossness */}
      <View style={[styles.gutsDrip, { left: 30, top: 80 }]} />
      <View style={[styles.gutsDrip, { left: 70, top: 90 }]} />
      <View style={[styles.gutsDrip, { left: 110, top: 75 }]} />
      <View style={[styles.gutsChunk, { left: 20, top: 50 }]} />
      <View style={[styles.gutsChunk, { left: 90, top: 60 }]} />
    </Animated.View>
  );
}

// Big blood splatter image that hits the screen
function BigBloodSplat({ delay }: { delay: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideY = useSharedValue(0);

  const imageUrl = BLOOD_SPLATTER_IMAGES[Math.floor(Math.random() * BLOOD_SPLATTER_IMAGES.length)];

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.95, { duration: 50 }));
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.8, { damping: 4, stiffness: 150 }),
        withTiming(1.5, { duration: 500 })
      )
    );
    slideY.value = withDelay(delay + 500, withTiming(100, { duration: 2500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: slideY.value }],
  }));

  return (
    <Animated.View style={[styles.bigSplatContainer, style]}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.bigSplatImage}
        contentFit="contain"
      />
    </Animated.View>
  );
}

function BloodDrop({
  startX,
  delay,
  duration,
  size,
  type,
}: {
  startX: number;
  delay: number;
  duration: number;
  size: number;
  type: string;
}) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, { duration, easing: Easing.in(Easing.quad) })
    );
    // Slight horizontal drift
    translateX.value = withDelay(
      delay,
      withTiming(startX + (Math.random() - 0.5) * 50, { duration })
    );
    // Splatter gets bigger as it falls
    if (type === 'splatter') {
      scale.value = withDelay(
        delay,
        withTiming(1.5, { duration })
      );
    }
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        type === 'splatter' ? styles.bloodSplatter : styles.bloodDrop,
        { width: size, height: type === 'splatter' ? size : size * 2 },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  // Toasty styles
  toastyContainer: {
    position: 'absolute',
    bottom: 80,
    right: -20,
    alignItems: 'center',
    zIndex: 1000,
  },
  toastyFace: {
    fontSize: 80,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  toastyText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#FF4500',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginTop: -10,
  },
  fireworksContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireworkParticle: {
    position: 'absolute',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  unicornContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  unicorn: {
    position: 'absolute',
    fontSize: 60,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  rainbowTrail: {
    position: 'absolute',
    height: 30,
    top: SCREEN_HEIGHT / 2 - 85,
    left: 0,
    borderRadius: 15,
    overflow: 'hidden',
  },
  rainbowGradient: {
    flex: 1,
  },
  unicornSparkle: {
    position: 'absolute',
    fontSize: 24,
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  confetti: {
    position: 'absolute',
  },
  bloodRainContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
  bloodOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
  },
  subtleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(80, 0, 0, 0.15)',
  },
  // Realistic dripping blood
  realisticDrip: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#8B0000',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    shadowColor: '#5C0000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    overflow: 'visible',
    zIndex: 100,
  },
  dripHighlight: {
    position: 'absolute',
    left: 2,
    top: 0,
    bottom: 20,
    backgroundColor: 'rgba(255, 100, 100, 0.25)',
    borderRadius: 10,
  },
  dripBulge: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    marginLeft: -10,
    backgroundColor: '#8B0000',
    borderRadius: 100,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  // Blood pool at bottom of screen
  bloodPoolBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  poolRipple: {
    position: 'absolute',
    width: 30,
    height: 8,
    backgroundColor: 'rgba(139, 0, 0, 0.5)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(100, 0, 0, 0.3)',
  },
  poolReflection: {
    position: 'absolute',
    top: 20,
    left: '10%',
    right: '10%',
    height: 15,
    backgroundColor: 'rgba(255, 100, 100, 0.1)',
    borderRadius: 100,
  },
  bloodDrop: {
    position: 'absolute',
    backgroundColor: '#8B0000',
    borderRadius: 5,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  bloodSplatter: {
    position: 'absolute',
    backgroundColor: '#B22222',
    borderRadius: 100,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  gutsSplatter: {
    position: 'absolute',
    width: 180,
    height: 180,
    zIndex: 150,
  },
  gutsImage: {
    width: '100%',
    height: '100%',
  },
  bigSplatContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.1,
    left: SCREEN_WIDTH * 0.1,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.5,
    zIndex: 200,
  },
  bigSplatImage: {
    width: '100%',
    height: '100%',
  },
  gutsDrip: {
    position: 'absolute',
    width: 15,
    height: 40,
    backgroundColor: '#8B0000',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  gutsChunk: {
    position: 'absolute',
    width: 25,
    height: 20,
    backgroundColor: '#641E16',
    borderRadius: 10,
    shadowColor: '#3D0C02',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  // Hyper-realistic blood splat on screen
  screenSplat: {
    position: 'absolute',
    zIndex: 100,
  },
  splatCenter: {
    flex: 1,
    backgroundColor: '#8B0000',
    borderRadius: 1000,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    overflow: 'hidden',
  },
  splatHighlight: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: '30%',
    height: '20%',
    backgroundColor: 'rgba(255, 100, 100, 0.4)',
    borderRadius: 100,
  },
  splatTendril: {
    position: 'absolute',
    width: 8,
    height: 30,
    backgroundColor: '#8B0000',
    borderRadius: 4,
    shadowColor: '#5C0000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
  },
  // Thick dripping blood
  bloodDripContainer: {
    position: 'absolute',
    top: 0,
    width: 20,
    zIndex: 90,
  },
  thickBloodStream: {
    width: 18,
    backgroundColor: '#8B0000',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowColor: '#5C0000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  bloodStreamHighlight: {
    position: 'absolute',
    left: 3,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'rgba(255, 80, 80, 0.3)',
  },
  fallingDrip: {
    position: 'absolute',
    top: 0,
    width: 14,
    height: 22,
    backgroundColor: '#8B0000',
    borderRadius: 7,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  // Blood pool at bottom
  bloodPool: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 80,
  },
  bloodBubble: {
    position: 'absolute',
    width: 15,
    height: 10,
    backgroundColor: 'rgba(139, 0, 0, 0.8)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 0, 0, 0.5)',
  },
});
