import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

type Props = {
  children: React.ReactNode;
};

export function LisaFrankBackground({ children }: Props) {
  return (
    <View style={styles.container}>
      {/* Base gradient - hot pink to electric purple to cyan */}
      <LinearGradient
        colors={['#FF1493', '#FF69B4', '#DA70D6', '#9B30FF', '#00CED1', '#00FFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Overlay gradient for that extra Lisa Frank magic */}
      <LinearGradient
        colors={['transparent', 'rgba(255, 105, 180, 0.3)', 'rgba(255, 255, 0, 0.2)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Another layer for depth - adds that iridescent feel */}
      <LinearGradient
        colors={['rgba(0, 255, 255, 0.2)', 'transparent', 'rgba(255, 0, 255, 0.2)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
