import { QualiPhotoItem } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  item?: QualiPhotoItem | null;
};

 export default function QualiPhotoDetail({ visible, onClose, item }: Props) {
  const insets = useSafeAreaInsets();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMapDetailVisible, setMapDetailVisible] = useState(false);

  const subtitle = useMemo(() => {
    if (!item) return '';
    const project = item.project_title || '—';
    const zone = item.zone_title || '—';
    return `${project} • ${zone}`;
  }, [item]);

  async function playSound() {
    if (!item?.voice_note) return;

    if (isPlaying && sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (sound) {
      await sound.replayAsync();
      setIsPlaying(true);
      return;
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: item.voice_note });
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          newSound.setPositionAsync(0);
        }
      });

      await newSound.playAsync();
    } catch (e) {
      console.error("Failed to play sound", e);
    }
  }

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  useEffect(() => {
    if (!visible) {
      sound?.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  }, [visible, sound]);

   const renderMapView = () => (
    <>
        <View style={{ height: insets.top }} />
        <View style={styles.header}>
            <Pressable onPress={() => setMapDetailVisible(false)} style={styles.closeBtn}>
                <Ionicons name="arrow-back" size={24} color="#11224e" />
            </Pressable>
            <View style={styles.headerTitles}>
                <Text style={styles.title}>Localisation de la Photo</Text>
            </View>
            <View style={{ width: 40 }} />
        </View>
        <MapView
            style={{ flex: 1 }}
            initialRegion={{
                latitude: item!.latitude!,
                longitude: item!.longitude!,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }}
        >
            <Marker coordinate={{ latitude: item!.latitude!, longitude: item!.longitude! }} />
        </MapView>
    </>
   );

   const renderDetailView = () => (
    <>
        <View style={{ height: insets.top }} />
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close details"
            onPress={onClose}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color="#11224e" />
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>Photo Details</Text>
            {!!item && <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={{ width: 40 }} />
        </View>

         <ScrollView contentContainerStyle={styles.scrollContent} bounces>
          {!!item && (
            <View style={styles.content}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: item.photo }} resizeMode="contain" style={styles.image} />
              </View>

              {item.voice_note ? (
                <View style={styles.playerCard}>
                  <Pressable style={styles.playButton} onPress={playSound}>
                    <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={48} color="#11224e" />
                  </Pressable>
                  <View style={styles.playerMeta}>
                    <Text style={styles.playerTitle}>Note Vocale</Text>
                    <Text style={styles.playerSubtitle}>{isPlaying ? 'Lecture...' : 'Prêt à jouer'}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.metaCard}>
                <MetaRow label="Project" value={item.project_title || '—'} />
                <MetaRow label="Zone" value={item.zone_title || '—'} />
                {typeof item.commentaire === 'string' && item.commentaire.trim().length > 0 ? (
                  <MetaRow label="Commentaire" value={item.commentaire} multiline />
                ) : null}
                {item.date_taken ? (
                  <MetaRow label="Date taken" value={formatDate(item.date_taken)} />
                ) : null}
              </View>

              {item?.latitude && item?.longitude && (
                <View style={styles.metaCard}>
                  <Text style={styles.mapTitle}>Localisation</Text>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setMapDetailVisible(true)}>
                    <View pointerEvents="none">
                      <MapView
                        style={styles.mapPreview}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        pitchEnabled={false}
                        rotateEnabled={false}
                        initialRegion={{
                          latitude: item.latitude,
                          longitude: item.longitude,
                          latitudeDelta: 0.005,
                          longitudeDelta: 0.005,
                        }}
                      >
                        <Marker coordinate={{ latitude: item.latitude, longitude: item.longitude }} />
                      </MapView>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
    </>
   );

   return (
     <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView edges={['bottom']} style={styles.container}>
        {isMapDetailVisible ? renderMapView() : renderDetailView()}
      </SafeAreaView>
    </Modal>
  );
}

function MetaRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, multiline && styles.metaMultiline]}>{value}</Text>
    </View>
  );
}

function formatDate(dateStr: string) {
  // dateStr expected format: YYYY-MM-DD HH:mm:SS (server normalized)
  const replaced = dateStr.replace(' ', 'T');
  const date = new Date(replaced);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#11224e',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#8E8E93',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  metaRow: {
    marginBottom: 10,
  },
  metaLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '600',
  },
  metaValue: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  metaMultiline: {
    lineHeight: 20,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  playButton: {
    // styles for the play button
  },
  playerMeta: {
    flex: 1,
  },
  playerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  playerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  mapPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  }
});


