import { useAuth } from '@/contexts/AuthContext';
import qualiphotoService, { QualiPhotoItem } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FormProps = {
  onClose: () => void;
  onSuccess: (created: Partial<QualiPhotoItem>) => void;
  parentItem: QualiPhotoItem;
};

// Extracted the form content into its own component
export function CreateChildQualiPhotoForm({ onClose, onSuccess, parentItem }: FormProps) {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <View style={{ height: insets.top, backgroundColor: '#ffffff' }} />
        <View style={styles.header}>
          <View style={{ width: 44 }} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Add &apos;After&apos; Photo</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={28} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          {error && (
            <View style={styles.alertBanner}><Text style={styles.alertBannerText}>{error}</Text></View>
          )}

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo</Text>
            {photo ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                <View style={styles.photoActions}>
                  <TouchableOpacity style={styles.retakeButton} onPress={handlePickPhoto}>
                    <Ionicons name="camera-reverse-outline" size={20} color="#374151" />
                    <Text style={styles.retakeButtonText}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeButton} onPress={() => setPhoto(null)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text style={[styles.retakeButtonText, { color: '#ef4444' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.captureButton} onPress={handlePickPhoto}>
                <View style={styles.captureButtonIcon}>
                  <Ionicons name="camera" size={24} color="#11224e" />
                </View>
                <Text style={styles.captureButtonText}>Tap to Take Photo</Text>
                <Text style={styles.captureButtonSubtext}>A new photo is required</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Comment Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comment</Text>
            <TextInput
              placeholder="Add an optional comment..."
              value={comment}
              onChangeText={setComment}
              style={styles.input}
              multiline
              placeholderTextColor="#9ca3af"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.submitButton, !canSave && styles.submitButtonDisabled]} disabled={!canSave} onPress={handleSubmit}>
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Save &apos;After&apos; Photo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb' 
  },
  closeButton: { 
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerCenter: { 
    flex: 1, 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: '600', 
    color: '#1f2937' 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  alertBanner: { 
    backgroundColor: '#fef2f2', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 16
  },
  alertBannerText: { 
    color: '#dc2626', 
    fontWeight: '500'
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  photoPreviewContainer: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  photoPreview: { 
    width: '100%', 
    aspectRatio: 4/3, 
  },
  photoActions: {
    flexDirection: 'row',
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb'
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb'
  },
  retakeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151'
  },
  captureButton: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 24, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed'
  },
  captureButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  captureButtonText: { 
    color: '#11224e', 
    fontSize: 16,
    fontWeight: '600' 
  },
  captureButtonSubtext: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
  },
  input: { 
    minHeight: 100, 
    textAlignVertical: 'top', 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 10, 
    padding: 12, 
    backgroundColor: '#ffffff',
    fontSize: 15,
    lineHeight: 20
  },
  footer: { 
    padding: 16, 
    backgroundColor: '#ffffff', 
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb' 
  },
  submitButton: { 
    backgroundColor: '#f87b1b', 
    borderRadius: 12, 
    paddingVertical: 14, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  submitButtonDisabled: { 
    backgroundColor: '#fed7aa' 
  },
  submitButtonText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#FFFFFF' 
  },
});
