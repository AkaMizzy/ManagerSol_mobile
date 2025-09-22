import { useAuth } from '@/contexts/AuthContext';
import qualiphotoService, { QualiPhotoItem } from '@/services/qualiphotoService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function RecentQualiphotos() {
  const { token } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<QualiPhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchRecentPhotos = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await qualiphotoService.list({ limit: 3, page: 1 }, token);
        setPhotos(response.items);
      } catch (e) {
        setError('Échec du chargement des photos récentes.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentPhotos();
  }, [token]);

  const navigateToQualiphoto = () => {
    router.push('/(tabs)/qualiphoto');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#11224e" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (photos.length === 0) {
    return null; // Don't render anything if there are no photos
  }

  // Create a placeholder array to ensure a 3-slot grid
  const displayItems = Array.from({ length: 3 }, (_, i) => photos[i] || null);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Qualiphotos Récentes</Text>
        <Pressable onPress={navigateToQualiphoto}>
          <Text style={styles.seeAll}>Voir tout</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {displayItems.map((item, index) =>
          item ? (
            <Pressable key={item.id} style={styles.card} onPress={navigateToQualiphoto}>
              <Image source={{ uri: item.photo }} style={styles.image} />
              <View style={styles.overlay} />
              <View style={styles.meta}>
                <Text style={styles.metaText} numberOfLines={1}>
                  {item.project_title}
                </Text>
                <Text style={styles.metaSubText} numberOfLines={1}>
                  {item.zone_title}
                </Text>
              </View>
            </Pressable>
          ) : (
            <View key={`placeholder-${index}`} style={[styles.card, { backgroundColor: 'transparent' }]} />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11224e',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f87b1b',
  },
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FF3B30',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    justifyContent: 'flex-end',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  meta: {
    padding: 8,
  },
  metaText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  metaSubText: {
    color: '#E5E5EA',
    fontSize: 11,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
