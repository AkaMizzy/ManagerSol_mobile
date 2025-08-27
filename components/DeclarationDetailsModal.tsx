import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import API_CONFIG from '../app/config/api';
import { Declaration } from '../types/declaration';

interface Props {
  visible: boolean;
  onClose: () => void;
  declaration: Declaration | null;
}

export default function DeclarationDetailsModal({ visible, onClose, declaration }: Props) {
  const renderPhoto = (photoPath?: string) => {
    if (!photoPath) return null;
    const uri = `${API_CONFIG.BASE_URL}${photoPath}`;
    return <Image source={{ uri }} style={styles.photo} contentFit="cover" />;
  };

  const renderPhotos = () => {
    if (!declaration?.photos || declaration.photos.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos :</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {declaration.photos.map((p) => (
            <View key={p.id} style={styles.photoItem}>{renderPhoto(p.photo)}</View>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (!declaration) return null;

  const declarantName = [declaration.declarent_firstname, declaration.declarent_lastname].filter(Boolean).join(' ');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Declaration Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>{declaration.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}><Ionicons name="calendar-outline" size={14} color="#8E8E93" /><Text style={styles.metaText}>{declaration.date_declaration}</Text></View>
              <View style={styles.metaItem}><Ionicons name="pricetag-outline" size={14} color="#8E8E93" /><Text style={styles.metaText}>#{declaration.code_declaration}</Text></View>
            </View>
            <View style={styles.badgeRow}>
              <Text style={[styles.badge, severityBadgeColor(declaration.severite)]}>Severity {declaration.severite}/10</Text>
            </View>
            <View style={styles.kvList}>
              <KV label="Type" value={declaration.declaration_type_title} />
              <KV label="Zone" value={declaration.zone_title} />
              <KV label="Project" value={declaration.project_title || '—'} />
              <KV label="Declarant" value={declarantName || '—'} />
              <KV label="Location" value={(declaration.latitude && declaration.longitude) ? `${declaration.latitude}, ${declaration.longitude}` : '—'} />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{declaration.description}</Text>
            </View>
            {renderPhotos()}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function severityBadgeColor(sev: number) {
  if (sev >= 7) return { backgroundColor: '#FF3B30' };
  if (sev >= 5) return { backgroundColor: '#FF9500' };
  return { backgroundColor: '#34C759' };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  closeButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  content: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  title: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#8E8E93' },
  badgeRow: { flexDirection: 'row', marginBottom: 12 },
  badge: { color: '#FFFFFF', fontWeight: '700', fontSize: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  kvList: { marginBottom: 12 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  kvLabel: { color: '#8E8E93', fontSize: 13 },
  kvValue: { color: '#1C1C1E', fontSize: 13, fontWeight: '500' },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { color: '#1C1C1E', lineHeight: 20, marginTop: 6 },
  photoItem: { width: 120, height: 80, borderRadius: 8, overflow: 'hidden', marginRight: 8 },
  photo: { width: '100%', height: '100%' },
});


