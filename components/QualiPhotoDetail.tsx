import { QualiPhotoItem } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  item?: QualiPhotoItem | null;
};

 export default function QualiPhotoDetail({ visible, onClose, item }: Props) {
  const insets = useSafeAreaInsets();
  const subtitle = useMemo(() => {
    if (!item) return '';
    const project = item.project_title || '—';
    const zone = item.zone_title || '—';
    return `${project} • ${zone}`;
  }, [item]);

   return (
     <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView edges={['bottom']} style={styles.container}>
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
            </View>
          )}
        </ScrollView>
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
});


