import { useAuth } from '@/contexts/AuthContext';
import qualiphotoService, { QualiPhotoItem } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (created: Partial<QualiPhotoItem>) => void;
  childItem: QualiPhotoItem; 
  parentTitle?: string | null;
};

export default function CreateComplementaireQualiPhotoModal({ visible, onClose, onSuccess, childItem, parentTitle }: Props) {
  const { token } = useAuth();
  const [photo, setPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceNote, setVoiceNote] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [comment, setComment] = useState('');
  const durationIntervalRef = useRef<number | null>(null);

  const canSave = useMemo(() => !!photo && !submitting, [photo, submitting]);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhoto({ uri: asset.uri, name: `qualiphoto_comp_${Date.now()}.jpg`, type: 'image/jpeg' });
    }
  };

  const handleSubmit = async () => {
    if (!token || !photo) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await qualiphotoService.createComplementaire({
        id_qualiphoto_parent: childItem.id,
        photo,
        voice_note: voiceNote || undefined,
        commentaire: comment || undefined,
      }, token);
      onSuccess(created);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Échec de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch {}
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRecording(false);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    if (uri) setVoiceNote({ uri, name: `voicenote-${Date.now()}.m4a`, type: 'audio/m4a' });
    setRecording(null);
  }

  async function playSound() {
    if (!voiceNote) return;
    if (isPlaying && sound) { await sound.pauseAsync(); setIsPlaying(false); return; }
    if (sound) { await sound.playAsync(); setIsPlaying(true); return; }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri: voiceNote.uri });
    setSound(newSound);
    setIsPlaying(true);
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) { setIsPlaying(false); newSound.setPositionAsync(0); }
    });
    await newSound.playAsync();
  }

  function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const handleTranscribe = async () => {
    if (!voiceNote || !token) return;
    setIsTranscribing(true);
    setError(null);
    try {
      const result = await qualiphotoService.transcribeVoiceNote(voiceNote, token);
      setComment(prev => prev ? `${prev}\n${result.transcription}` : result.transcription);
    } catch (e: any) {
      setError(e?.message || 'Échec de la transcription');
    } finally {
      setIsTranscribing(false);
    }
  };

  function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return '';
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'short', day: '2-digit' }).format(d);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {parentTitle || childItem.project_title || String(childItem.id_qualiphoto_parent || childItem.id)}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'interactive'} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {/* Parent info (target child for this complementary) */}
            <View style={styles.parentInfoCard}>
              <Text style={styles.parentInfoTitle} numberOfLines={1}>
                {(childItem.project_title || 'Projet') + ' • ' + (childItem.zone_title || 'Zone') + (childItem.date_taken ? ' • ' + formatDate(childItem.date_taken) : '')}
              </Text>
              <View style={styles.parentPhotoWrap}>
                <Image source={{ uri: childItem.photo }} style={styles.parentPhoto} />
              </View>
            </View>
            {photo ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: photo.uri }} style={styles.imagePreview} />
                <View style={styles.imageActions}>
                  <TouchableOpacity style={[styles.iconButton, styles.iconButtonSecondary]} onPress={handlePickPhoto}>
                    <Ionicons name="camera-reverse-outline" size={20} color="#11224e" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.iconButton, styles.iconButtonSecondary]} onPress={() => setPhoto(null)}>
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoPickerButton} onPress={handlePickPhoto}>
                <Ionicons name="camera-outline" size={24} color="#475569" />
                <Text style={styles.photoPickerText}>Ajouter une Photo</Text>
              </TouchableOpacity>
            )}

            {/* Voice note and transcription */}
            <View style={{ marginTop: 16 }}>
              {isRecording ? (
                <View style={styles.recordingWrap}>
                  <Text style={styles.recordingText}>Enregistrement... {formatDuration(recordingDuration)}</Text>
                  <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                    <Ionicons name="stop-circle" size={24} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.voiceActionsContainer}>
                  {voiceNote ? (
                    <View style={styles.audioPlayerWrap}>
                      <TouchableOpacity style={styles.playButton} onPress={playSound}>
                        <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={28} color="#11224e" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteButton} onPress={() => { setVoiceNote(null); setSound(null); setIsPlaying(false); }}>
                        <Ionicons name="trash-outline" size={20} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.voiceRecordButton} onPress={startRecording}>
                      <View style={styles.buttonContentWrapper}>
                        <Ionicons name="mic-outline" size={24} color="#11224e" />
                      </View>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.voiceRecordButton, styles.transcribeButton, (!voiceNote || isTranscribing) && styles.buttonDisabled]}
                    onPress={handleTranscribe}
                    disabled={!voiceNote || isTranscribing}
                  >
                    {isTranscribing ? (
                      <ActivityIndicator size="small" color="#11224e" />
                    ) : (
                      <View style={styles.buttonContentWrapper}>
                        <Ionicons name="volume-high-outline" size={25} color="#11224e" />
                        <Ionicons name="arrow-forward-circle-outline" size={20} color="#11224e" />
                        <Ionicons name="document-text-outline" size={20} color="#11224e" />
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              <View style={{ marginTop: 12 }}>
                <View style={[styles.inputWrap, { alignItems: 'flex-start' }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#6b7280" style={{ marginTop: 4 }} />
                  <TextInput
                    placeholder="Description"
                    placeholderTextColor="#9ca3af"
                    value={comment}
                    onChangeText={setComment}
                    style={[styles.input, { height: 150 }]}
                    multiline
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={16} color="#b45309" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.submitButton, !canSave && styles.submitButtonDisabled]} disabled={!canSave} onPress={handleSubmit}>
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Enregistrement...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="save" size={16} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Enregistrer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  closeButton: { padding: 8 },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#11224e' },
  parentInfoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#f87b1b' },
  parentInfoTitle: { fontSize: 12, color: '#11224e', fontWeight: '600', marginBottom: 8 },
  parentPhotoWrap: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#f87b1b' },
  parentPhoto: { width: '100%', aspectRatio: 16/10, backgroundColor: '#e5e7eb' },
  photoPickerButton: { borderWidth: 2, borderColor: '#f87b1b', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', gap: 8, marginTop: 16 },
  photoPickerText: { color: '#475569', fontWeight: '600' },
  imagePreviewContainer: { position: 'relative', marginTop: 16 },
  imagePreview: { width: '100%', aspectRatio: 16/10, borderRadius: 12 },
  imageActions: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 8 },
  iconButton: { padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 99 },
  iconButtonSecondary: { backgroundColor: '#f1f5f9', borderRadius: 99, padding: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderColor: '#f59e0b', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginTop: 16, borderRadius: 10 },
  errorText: { color: '#b45309', fontSize: 12, flex: 1 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  submitButton: { backgroundColor: '#f87b1b', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, height: 48, alignSelf: 'center', width: '92%' },
  submitButtonDisabled: { backgroundColor: '#d1d5db' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  voiceActionsContainer: { flexDirection: 'row', gap: 8 },
  voiceRecordButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 50, backgroundColor: '#f1f5f9', borderRadius: 10, borderWidth: 1, borderColor: '#f87b1b' },
  transcribeButton: {},
  buttonDisabled: { opacity: 0.5, backgroundColor: '#e5e7eb' },
  buttonContentWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f87b1b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  input: { flex: 1, color: '#111827' },
  recordingWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, borderRadius: 10 },
  recordingText: { color: '#dc2626', fontWeight: '600' },
  stopButton: { padding: 4 },
  audioPlayerWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f1f5f9', paddingHorizontal: 12, height: 50, borderRadius: 10, flex: 1, borderWidth: 1, borderColor: '#f87b1b' },
  playButton: {},
  deleteButton: {},
});


