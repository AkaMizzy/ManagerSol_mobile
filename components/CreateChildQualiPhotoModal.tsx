import { useAuth } from '@/contexts/AuthContext';
import qualiphotoService, { QualiPhotoItem } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [voiceNote, setVoiceNote] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

  const canSave = useMemo(() => !!photo && !submitting, [photo, submitting]);

  function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'L\'autorisation d\'accéder à la caméra est requise.');
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
        voice_note: voiceNote || undefined,
      }, token);
      onSuccess(created);
      onClose(); // Use onClose directly now
    } catch (e: any) {
      setError(e?.message || 'Échec de l\'enregistrement de la photo "après".');
    } finally {
      setSubmitting(false);
    }
  };

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès au microphone est requis pour enregistrer l\'audio.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRecording(false);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (uri) {
      setVoiceNote({ uri, name: `voicenote-${Date.now()}.m4a`, type: 'audio/m4a' });
    }
    setRecordingDuration(0);
    setRecording(null);
  }

  async function playSound() {
    if (!voiceNote) return;
    if (isPlaying && sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
      return;
    }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri: voiceNote.uri });
    setSound(newSound);
    setIsPlaying(true);
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
        newSound.setPositionAsync(0);
      }
    });
    await newSound.playAsync();
  }

  const resetVoiceNote = () => {
    if (sound) sound.unloadAsync();
    setVoiceNote(null);
    setSound(null);
    setIsPlaying(false);
  };

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ width: 44 }} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Ajouter une photo Suivi</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={28} color="#d1d5db" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
          {error && (
            <View style={styles.alertBanner}><Text style={styles.alertBannerText}>{error}</Text></View>
          )}

          {/* Context Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.metaText} numberOfLines={1}>
                {parentItem.project_title} • {parentItem.zone_title}
                {parentItem.date_taken ? ` • ${formatDate(parentItem.date_taken)}` : ''}
              </Text>
            </View>
            <View style={styles.contextCard}>
              <Image source={{ uri: parentItem.photo }} style={styles.contextImage} />
            </View>
          </View>

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nouvelle photo Suivi</Text>
            {photo ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                <View style={styles.photoActions}>
                  <TouchableOpacity style={styles.retakeButton} onPress={handlePickPhoto}>
                    <Ionicons name="camera-reverse-outline" size={20} color="#374151" />
                    <Text style={styles.retakeButtonText}>Reprendre</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeButton} onPress={() => setPhoto(null)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text style={[styles.retakeButtonText, { color: '#ef4444' }]}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.captureButton} onPress={handlePickPhoto}>
                <View style={styles.captureButtonIcon}>
                  <Ionicons name="camera" size={24} color="#11224e" />
                </View>
                <Text style={styles.captureButtonText}>Appuyez pour prendre une photo</Text>
                <Text style={styles.captureButtonSubtext}>Une nouvelle photo est requise</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Voice Note Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note Vocale (Optionnel)</Text>
            {isRecording ? (
              <View style={styles.recordingWrap}>
                <Text style={styles.recordingText}>Enregistrement... {formatDuration(recordingDuration)}</Text>
                <Pressable style={styles.stopButton} onPress={stopRecording}>
                  <Ionicons name="stop-circle" size={32} color="#dc2626" />
                </Pressable>
              </View>
            ) : voiceNote ? (
              <View style={styles.audioPlayerWrap}>
                <Pressable style={styles.playButton} onPress={playSound}>
                  <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={40} color="#11224e" />
                </Pressable>
                <Text style={styles.audioMeta}>Note vocale enregistrée.</Text>
                <Pressable style={styles.deleteButton} onPress={resetVoiceNote}>
                  <Ionicons name="trash-outline" size={24} color="#dc2626" />
                </Pressable>
              </View>
            ) : (
              <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                <Ionicons name="mic-outline" size={22} color="#374151" />
                <Text style={styles.recordButtonText}>Enregistrer une note</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Comment Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Commentaire</Text>
            <TextInput
              placeholder="Ajoutez un commentaire (facultatif)..."
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
                <Text style={styles.submitButtonText}>Enregistrer la photo Suivi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatDate(dateStr: string) {
  const replaced = dateStr.replace(' ', 'T');
  const date = new Date(replaced);
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
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
  contextCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  contextImage: {
    width: '100%',
    aspectRatio: 2.2,
    backgroundColor: '#f3f4f6'
  },
  photoPreviewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  photoPreview: { 
    width: '100%',
    aspectRatio: 2.2,
    backgroundColor: '#f3f4f6'
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
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
  },
  recordButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151'
  },
  recordingWrap: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fef2f2', 
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10 
  },
  recordingText: { 
    color: '#dc2626', 
    fontWeight: '600' 
  },
  stopButton: { 
    padding: 4 
  },
  audioPlayerWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10 
  },
  playButton: {},
  audioMeta: { 
    flex: 1, 
    color: '#1e293b',
    fontWeight: '500'
  },
  deleteButton: {},
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
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
});
