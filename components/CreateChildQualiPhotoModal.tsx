import { useAuth } from '@/contexts/AuthContext';
import qualiphotoService, { QualiPhotoItem } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FormProps = {
  onClose: () => void;
  onSuccess: (created: Partial<QualiPhotoItem>) => void;
  parentItem: QualiPhotoItem;
};

// Extracted the form content into its own component
export function CreateChildQualiPhotoForm({ onClose, onSuccess, parentItem }: FormProps) {
  const { token } = useAuth();
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => !!photo && !submitting, [photo, submitting]);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Camera permission is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4,3], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({ uri: asset.uri, name: `qualiphoto_child_${Date.now()}.jpg`, type: 'image/jpeg' });
    }
  };

  const handleSubmit = async () => {
    if (!token || !photo) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await qualiphotoService.create({
        id_project: parentItem.id_project,
        id_zone: parentItem.id_zone,
        commentaire: comment,
        photo,
        latitude: parentItem.latitude ?? undefined,
        longitude: parentItem.longitude ?? undefined,
        id_qualiphoto_parent: parentItem.id,
      }, token);
      onSuccess(created);
      onClose(); // Use onClose directly now
    } catch (e: any) {
      setError(e?.message || 'Failed to save child photo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Removed handleClose, as onClose is now sufficient

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Add Child Picture</Text>
            <Text style={styles.headerSubtitle}>Photo for &quot;{parentItem.project_title}&quot;</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {error && (
          <View style={styles.alertBanner}><Text style={styles.alertBannerText}>{error}</Text></View>
        )}

        <ScrollView style={styles.content}>
          {/* Photo */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}><Ionicons name="camera" size={18} color="#11224e" /></View>
              <Text style={styles.cardTitle}>Photo</Text>
            </View>
            {photo ? (
              <View style={{ gap: 8 }}>
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.secondaryButton} onPress={() => setPhoto(null)}><Text style={styles.secondaryButtonText}>Remove</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButton} onPress={handlePickPhoto}><Text style={styles.secondaryButtonText}>Retake</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.captureButton} onPress={handlePickPhoto}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={styles.captureButtonText}>Take Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Comment */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}><Ionicons name="chatbubble-ellipses-outline" size={18} color="#11224e" /></View>
              <Text style={styles.cardTitle}>Comment (Optional)</Text>
            </View>
            <TextInput
              placeholder="Add a comment..."
              value={comment}
              onChangeText={setComment}
              style={styles.input}
              multiline
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.submitButton, !canSave && styles.submitButtonDisabled]} disabled={!canSave} onPress={handleSubmit}>
            {submitting ? <Text style={styles.submitButtonText}>Saving...</Text> : <Text style={styles.submitButtonText}>Save Child Photo</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}


type ModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (created: Partial<QualiPhotoItem>) => void;
  parentItem: QualiPhotoItem;
};

export default function CreateChildQualiPhotoModal({ visible, onClose, onSuccess, parentItem }: ModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <CreateChildQualiPhotoForm 
        onClose={onClose}
        onSuccess={onSuccess}
        parentItem={parentItem}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  closeButton: { padding: 8 },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#11224e' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  content: { flex: 1, padding: 16 },
  alertBanner: { backgroundColor: '#fef2f2', padding: 12, margin: 16, borderRadius: 8 },
  alertBannerText: { color: '#dc2626' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#11224e' },
  photoPreview: { width: '100%', aspectRatio: 4/3, borderRadius: 12, backgroundColor: '#f3f4f6' },
  captureButton: { backgroundColor: '#11224e', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  captureButtonText: { color: '#FFFFFF', fontWeight: '600' },
  secondaryButton: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#111827', fontWeight: '600' },
  input: { height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, backgroundColor: '#fff' },
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  submitButton: { backgroundColor: '#f87b1b', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#fed7aa' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
