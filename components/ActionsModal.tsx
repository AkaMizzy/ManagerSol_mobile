import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import API_CONFIG from '../app/config/api';
import { CreateActionData, DeclarationAction } from '../types/declaration';

interface ActionsModalProps {
  visible: boolean;
  actions: DeclarationAction[] | null;
  onClose: () => void;
  onCreateAction?: (data: CreateActionData) => Promise<void>;
}

export default function ActionsModal({ visible, actions, onClose, onCreateAction }: ActionsModalProps) {
  const [form, setForm] = useState<CreateActionData>({ status: 1 });
  const [showForm, setShowForm] = useState(false);
  const [photo, setPhoto] = useState<CreateActionData['photo']>();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets && result.assets[0]) {
      setPhoto({ uri: result.assets[0].uri, type: 'image/jpeg', name: `action_${Date.now()}.jpg` });
    }
  };

  const resetForm = () => {
    setForm({ status: 1 });
    setPhoto(undefined);
  };

  const handleCreate = async () => {
    if (!onCreateAction) return;
    try {
      await onCreateAction({ ...form, photo });
      resetForm();
      setShowForm(false);
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Failed to create action');
    }
  };
  const renderPhoto = (photo?: string | null) => {
    if (!photo) return null;
    const uri = `${API_CONFIG.BASE_URL}${photo}`;
    return (
      <Image source={{ uri }} style={styles.actionImage} contentFit="cover" />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Declaration Actions</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Create bar */}
          <View style={styles.createBar}>
            <TouchableOpacity style={styles.createButton} onPress={() => setShowForm((s) => !s)}>
              <Ionicons name={showForm ? 'remove' : 'add'} size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>{showForm ? 'Close' : 'Add Action'}</Text>
            </TouchableOpacity>
          </View>

          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>New Action</Text>
              <TextInput
                style={styles.input}
                placeholder="Title (optional)"
                placeholderTextColor="#8E8E93"
                value={form.title}
                onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                placeholderTextColor="#8E8E93"
                value={form.description}
                onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
                multiline
              />
              <View style={styles.rowGap}>
                <TextInput
                  style={styles.input}
                  placeholder="Planned date (YYYY-MM-DD)"
                  placeholderTextColor="#8E8E93"
                  value={form.date_planification}
                  onChangeText={(t) => setForm((p) => ({ ...p, date_planification: t }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Execution date (YYYY-MM-DD)"
                  placeholderTextColor="#8E8E93"
                  value={form.date_execution}
                  onChangeText={(t) => setForm((p) => ({ ...p, date_execution: t }))}
                />
              </View>
              <View style={styles.row}>
                <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                  <Ionicons name="camera-outline" size={18} color="#8E8E93" />
                  <Text style={styles.photoBtnText}>{photo ? 'Change Photo' : 'Add Photo'}</Text>
                </TouchableOpacity>
                {photo ? <Text style={styles.photoName}>1 photo selected</Text> : null}
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
                <Text style={styles.submitBtnText}>Create Action</Text>
              </TouchableOpacity>
            </View>
          )}

          {!actions || actions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No actions have been added for this declaration yet.</Text>
            </View>
          ) : (
            actions.map((action) => (
              <View key={action.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{action.title || 'Untitled action'}</Text>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{String(action.status ?? 'pending')}</Text>
                  </View>
                </View>
                {action.description ? (
                  <Text style={styles.cardDesc}>{action.description}</Text>
                ) : null}
                {renderPhoto(action.photo)}
                <View style={styles.metaRow}>
                  {action.creator_firstname || action.creator_lastname ? (
                    <Text style={styles.metaText}>{[action.creator_firstname, action.creator_lastname].filter(Boolean).join(' ')}</Text>
                  ) : null}
                  {action.date_execution ? (
                    <Text style={styles.metaText}>Executed: {new Date(action.date_execution).toLocaleDateString()}</Text>
                  ) : action.date_planification ? (
                    <Text style={styles.metaText}>Planned: {new Date(action.date_planification).toLocaleDateString()}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  placeholder: { width: 24 },
  content: { padding: 16 },
  createBar: { marginBottom: 12 },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#007AFF', paddingVertical: 10, borderRadius: 10, gap: 6 },
  createButtonText: { color: '#FFFFFF', fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { marginTop: 12, fontSize: 16, color: '#8E8E93', textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  statusPill: { backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  cardDesc: { fontSize: 14, color: '#1C1C1E', marginBottom: 8 },
  actionImage: { width: '100%', height: 160, borderRadius: 8, marginTop: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metaText: { fontSize: 12, color: '#8E8E93' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  formTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#1C1C1E' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#1C1C1E', marginBottom: 10 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  rowGap: { gap: 10, marginBottom: 10 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F2F2F7', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  photoBtnText: { color: '#8E8E93' },
  photoName: { color: '#8E8E93', fontSize: 12 },
  submitBtn: { backgroundColor: '#34C759', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700' },
});


