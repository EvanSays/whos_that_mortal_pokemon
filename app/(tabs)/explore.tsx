import { StyleSheet, View, FlatList, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { SparkleField } from '@/components/sparkle';
import { useGuessHistory, GuessRecord } from '@/context/guess-history';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { history, stats, clearHistory } = useGuessHistory();

  const renderItem = ({ item, index }: { item: GuessRecord; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <View style={[styles.historyItem, item.wasCorrect ? styles.correctItem : styles.wrongItem]}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.pokemonImage}
          contentFit="contain"
        />
        <View style={styles.itemInfo}>
          <ThemedText style={styles.pokemonName}>
            {item.pokemonName.charAt(0).toUpperCase() + item.pokemonName.slice(1)}
          </ThemedText>
          <ThemedText style={styles.pokemonId}>#{item.pokemonId.toString().padStart(3, '0')}</ThemedText>
        </View>
        <View style={[styles.resultBadge, item.wasCorrect ? styles.correctBadge : styles.wrongBadge]}>
          <ThemedText style={styles.resultText}>
            {item.wasCorrect ? '✓' : '✗'}
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );

  const ListHeader = () => (
    <View style={styles.header}>
      <ThemedText style={styles.title}>📊 Guess History 📊</ThemedText>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <SparkleField count={6} width={SCREEN_WIDTH - 60} height={100} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{stats.total}</ThemedText>
            <ThemedText style={styles.statLabel}>Total</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNumber, styles.correctText]}>{stats.correct}</ThemedText>
            <ThemedText style={styles.statLabel}>Correct</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statNumber, styles.wrongText]}>{stats.wrong}</ThemedText>
            <ThemedText style={styles.statLabel}>Wrong</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{stats.percentage}%</ThemedText>
            <ThemedText style={styles.statLabel}>Accuracy</ThemedText>
          </View>
        </View>
      </View>

      {history.length > 0 && (
        <Pressable onPress={clearHistory} style={styles.clearButton}>
          <ThemedText style={styles.clearButtonText}>Clear History</ThemedText>
        </Pressable>
      )}
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyEmoji}>🎮</ThemedText>
      <ThemedText style={styles.emptyText}>No guesses yet!</ThemedText>
      <ThemedText style={styles.emptySubtext}>
        Play the game to see your history here
      </ThemedText>
    </View>
  );

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
      <SparkleField count={12} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} />

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
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
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 15,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  correctText: {
    color: '#90EE90',
  },
  wrongText: {
    color: '#FF6B6B',
  },
  clearButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
  },
  correctItem: {
    borderColor: 'rgba(144, 238, 144, 0.6)',
  },
  wrongItem: {
    borderColor: 'rgba(255, 107, 107, 0.6)',
  },
  pokemonImage: {
    width: 60,
    height: 60,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  pokemonName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pokemonId: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  resultBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctBadge: {
    backgroundColor: 'rgba(144, 238, 144, 0.8)',
  },
  wrongBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  emptySubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    textAlign: 'center',
  },
});
