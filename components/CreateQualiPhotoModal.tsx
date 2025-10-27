import { ICONS } from '@/constants/Icons';
import { useAuth } from '@/contexts/AuthContext';
import qualiphotoService, { QualiPhotoItem, QualiProject, QualiZone } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (created: Partial<QualiPhotoItem>) => void;
  initialProjectId?: string;
  initialZoneId?: string;
};

export default function CreateQualiPhotoModal({ visible, onClose, onSuccess, initialProjectId, initialZoneId }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<QualiProject[]>([]);
  const [zones, setZones] = useState<QualiZone[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [dateTaken, setDateTaken] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [voiceNote, setVoiceNote] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranscribed, setIsTranscribed] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const durationIntervalRef = useRef<number | null>(null);

  const projectTitle = useMemo(() => {
    if (!selectedProject) return 'Sélectionner un projet';
    return projects.find(p => p.id === selectedProject)?.title || 'Projet';
  }, [projects, selectedProject]);

  const zoneTitle = useMemo(() => {
    if (!selectedZone) return selectedProject ? 'Sélectionner une zone' : 'Sélectionner un projet d\'abord';
    return zones.find(z => z.id === selectedZone)?.title || 'Zone';
  }, [zones, selectedZone, selectedProject]);

  function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function formatDate(date: Date) {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }

  useEffect(() => {
    if (!visible) return;

    // Pre-fill from props
    setSelectedProject(initialProjectId || null);
    setSelectedZone(initialZoneId || null);

    if (token) {
        setLoadingProjects(true);
        qualiphotoService.getProjects(token)
          .then(setProjects)
          .catch(() => setProjects([]))
          .finally(() => setLoadingProjects(false));
    }
    
    setProjectOpen(false);
    setZoneOpen(false);
    setDateTaken(formatDate(new Date()));

    const fetchLocation = async () => {
      setLocationStatus('fetching');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied.');
          setLocationStatus('error');
          return;
        }
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLatitude(location.coords.latitude);
        setLongitude(location.coords.longitude);
        setLocationStatus('success');
      } catch (error) {
        console.warn('Could not fetch location automatically.', error);
        setLocationStatus('error');
      }
    };
    fetchLocation();
    
  }, [visible, token, initialProjectId, initialZoneId]);

  useEffect(() => {
    if (!token || !selectedProject) { setZones([]); if (!initialZoneId) setSelectedZone(null); return; }
    setLoadingZones(true);
    qualiphotoService.getZonesByProject(selectedProject, token)
      .then(setZones)
      .catch(() => setZones([]))
      .finally(() => setLoadingZones(false));
  }, [token, selectedProject, initialZoneId]);

  const canSave = useMemo(() => !!selectedProject && !!selectedZone && title.trim().length > 0 && !submitting, [selectedProject, selectedZone, title, submitting]);

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);
    if (!selectedProject) { setError('Veuillez choisir un projet.'); return; }
    if (!selectedZone) { setError('Veuillez choisir une zone.'); return; }
    if (!title || title.trim().length === 0) { setError('Veuillez saisir un titre.'); return; }
    setSubmitting(true);
    try {
      const created = await qualiphotoService.create({
        id_project: selectedProject || undefined,
        id_zone: selectedZone,
        title: title || undefined,
        commentaire: comment || undefined,
        date_taken: dateTaken || undefined,
        voice_note: voiceNote || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
      }, token);
      onSuccess && onSuccess(created);
      // reset
      setSelectedProject(null);
      setSelectedZone(null);
      setTitle('');
      setDateTaken('');
      setComment('');
      setVoiceNote(null);
      setLatitude(null);
      setLongitude(null);
      setLocationStatus('idle');
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Échec de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedProject(null);
    setSelectedZone(null);
    setTitle('');
    setDateTaken('');
    setComment('');
    setVoiceNote(null);
    setLatitude(null);
    setLongitude(null);
    setLocationStatus('idle');
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setError(null);
    setProjectOpen(false);
    setZoneOpen(false);
    onClose();
  };

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Microphone access is required to record audio.');
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
      setIsTranscribed(false); 
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
    setIsTranscribed(false);
  };

  const handleTranscribe = async () => {
    if (!voiceNote || !token) {
      Alert.alert('Erreur', 'Aucune note vocale à transcrire.');
      return;
    }
    setIsTranscribing(true);
    setError(null);
    try {
      const result = await qualiphotoService.transcribeVoiceNote(voiceNote, token);
      setComment(prev => prev ? `${prev}\n${result.transcription}` : result.transcription);
      setIsTranscribed(true);
    } catch (e: any) {
      setError(e?.message || 'Échec de la transcription');
      Alert.alert('Erreur de Transcription', e?.message || 'Une erreur est survenue lors de la transcription.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!comment || !token) {
      Alert.alert('Erreur', 'Aucune description à améliorer.');
      return;
    }
    setIsEnhancing(true);
    setError(null);
    try {
      const result = await qualiphotoService.enhanceDescription(comment, token);
      setComment(result.enhancedDescription);
    } catch (e: any) {
      setError(e?.message || 'Échec de l\'amélioration');
      Alert.alert('Erreur d\'amélioration', e?.message || 'Une erreur est survenue lors de l\'amélioration de la description.');
    } finally {
      setIsEnhancing(false);
    }
  };

  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Nouveau dossier</Text>
              <Image source={ICONS.folder} style={{ width: 24, height: 24 }} />
            </View>
            <View style={styles.placeholder} />
          </View>

          {error && (
            <View style={styles.alertBanner}>
              <Ionicons name="warning" size={16} color="#b45309" />
              <Text style={styles.alertBannerText}>{error}</Text>
              <TouchableOpacity onPress={() => setError(null)}>
                <Ionicons name="close" size={16} color="#b45309" />
              </TouchableOpacity>
            </View>
          )}

          <ScrollView ref={scrollViewRef} style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Unified Card: Project/Zone + Other Inputs */}
            <View style={styles.card}>
              {initialProjectId && initialZoneId ? (
                <View style={[styles.contextDisplay, { marginBottom: 16 }]}>
                  <View style={styles.contextItem}>
                    <Ionicons name="briefcase-outline" size={16} color="#4b5563" />
                    <Text style={styles.contextText} numberOfLines={1}>
                      {loadingProjects ? 'Chargement...' : projectTitle}
                    </Text>
                  </View>
                  <View style={styles.separator} />
                  <View style={styles.contextItem}>
                    <Ionicons name="location-outline" size={16} color="#4b5563" />
                    <Text style={styles.contextText} numberOfLines={1}>
                      {loadingZones ? 'Chargement...' : zoneTitle}
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  {/* Project */}
                  <View style={{ marginBottom: 12 }}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardIconWrap}><Ionicons name="briefcase" size={18} color="#11224e" /></View>
                      <View style={styles.cardHeaderText}><Text style={styles.cardTitle}>Projet</Text><Text style={styles.cardHint}>Choisir le projet</Text></View>
                      {selectedProject && <View style={styles.pill}><Ionicons name="checkmark" size={14} color="#16a34a" /><Text style={styles.pillText}>Choisi</Text></View>}
                    </View>
                    <Pressable style={[styles.dropdownButton, !!initialProjectId && styles.dropdownButtonDisabled]} disabled={!!initialProjectId} onPress={() => { setProjectOpen(v => !v); setZoneOpen(false); }}>
                      <View style={styles.dropdownButtonContent}>
                        <Text style={[styles.dropdownButtonText, !selectedProject && styles.placeholderText]}>
                          {projectTitle}
                        </Text>
                      </View>
                    </Pressable>
                    {projectOpen && (
                      <View style={styles.dropdown}>
                        <ScrollView showsVerticalScrollIndicator={true}>
                          {(loadingProjects ? [] : projects).map(p => (
                            <Pressable key={p.id} style={styles.dropdownItem} onPress={() => { setSelectedProject(p.id); setProjectOpen(false); setZoneOpen(false); }}>
                              <View style={styles.dropdownRow}>
                                <View style={styles.dropdownIconWrap}><Ionicons name="briefcase" size={18} color="#11224e" /></View>
                                <View style={styles.dropdownItemContent}><Text style={styles.dropdownItemTitle} numberOfLines={1}>{p.title}</Text></View>
                                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                              </View>
                            </Pressable>
                          ))}
                          {loadingProjects && <View style={styles.dropdownItem}><Text style={styles.dropdownItemTitle}>Chargement...</Text></View>}
                          {!loadingProjects && projects.length === 0 && <View style={styles.dropdownItem}><Text style={styles.dropdownItemTitle}>Aucun projet</Text></View>}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Zone */}
                  <View style={[{ marginBottom: 12 }, !selectedProject && styles.cardDisabled]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardIconWrap}><Ionicons name="location" size={18} color="#11224e" /></View>
                      <View style={styles.cardHeaderText}><Text style={styles.cardTitle}>Zone</Text><Text style={styles.cardHint}>Choisir la zone</Text></View>
                      {selectedZone && <View style={styles.pill}><Ionicons name="checkmark" size={14} color="#16a34a" /><Text style={styles.pillText}>Choisie</Text></View>}
                    </View>
                    <Pressable style={[styles.dropdownButton, (!selectedProject || !!initialProjectId) && styles.dropdownButtonDisabled]} disabled={!selectedProject || !!initialProjectId} onPress={() => { if (!selectedProject) return; setZoneOpen(v => !v); setProjectOpen(false); }}>
                      <View style={styles.dropdownButtonContent}>
                        <Text style={[styles.dropdownButtonText, !selectedZone && styles.placeholderText]}>
                          {zoneTitle}
                        </Text>
                      </View>
                    </Pressable>
                    {selectedProject && zoneOpen && (
                      <View style={styles.dropdown}>
                        <ScrollView showsVerticalScrollIndicator={true}>
                          {(loadingZones ? [] : zones).map(z => (
                            <Pressable key={z.id} style={styles.dropdownItem} onPress={() => { setSelectedZone(z.id); setZoneOpen(false); }}>
                              <View style={styles.dropdownRow}>
                                <View style={styles.dropdownIconWrap}><Ionicons name="location" size={18} color="#11224e" /></View>
                                <View style={styles.dropdownItemContent}><Text style={styles.dropdownItemTitle} numberOfLines={1}>{z.title}</Text></View>
                                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                              </View>
                            </Pressable>
                          ))}
                          {loadingZones && <View style={styles.dropdownItem}><Text style={styles.dropdownItemTitle}>Chargement...</Text></View>}
                          {!loadingZones && zones.length === 0 && <View style={styles.dropdownItem}><Text style={styles.dropdownItemTitle}>Aucune zone</Text></View>}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </>
              )}
              <View style={[styles.inputWrap, { marginBottom: 16 }]}>
                <Ionicons name="text-outline" size={16} color="#6b7280" />
                <TextInput
                  placeholder="Titre"
                  placeholderTextColor="#9ca3af"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                />
              </View>
              {/* Voice Note Area */}
              <View style={styles.voiceNoteContainer}>
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
                        <TouchableOpacity style={[styles.deleteButton, isTranscribed && styles.buttonDisabled]} onPress={resetVoiceNote} disabled={isTranscribed}>
                          <Ionicons name="trash-outline" size={20} color={isTranscribed ? '#9ca3af' : '#dc2626'} />
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
                      style={[
                        styles.voiceRecordButton,
                        styles.transcribeButton,
                        (!voiceNote || isTranscribing) && styles.buttonDisabled,
                      ]}
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
                <View style={{ marginTop: 16 }}>
                  <View style={[styles.inputWrap, { alignItems: 'flex-start' }]}>
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#6b7280" style={{ marginTop: 4 }} />
                    <TextInput
                      placeholder="Introduction"
                      placeholderTextColor="#9ca3af"
                      value={comment}
                      onChangeText={setComment}
                      style={[styles.input, { height: 350, paddingRight: 40 }]}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      onFocus={() => {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 300);
                      }}
                    />
                    <TouchableOpacity
                        style={styles.enhanceButton}
                        onPress={handleEnhanceDescription}
                        disabled={isEnhancing || !comment}
                    >
                        {isEnhancing ? (
                            <ActivityIndicator size="small" color="#f87b1b" />
                        ) : (
                            <Ionicons name="sparkles-outline" size={20} color={!comment ? '#d1d5db' : '#f87b1b'} />
                        )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="datetime"
            date={new Date()}
            onConfirm={(date) => { setDateTaken(formatDate(date)); setDatePickerVisible(false); }}
            onCancel={() => setDatePickerVisible(false)}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.submitButton, !canSave && styles.submitButtonDisabled]} disabled={!canSave} onPress={handleSubmit}>
              {submitting ? (<><Ionicons name="hourglass" size={16} color="#FFFFFF" /><Text style={styles.submitButtonText}>Enregistrement...</Text></>) : (<><Ionicons name="save" size={16} color="#FFFFFF" /><Text style={styles.submitButtonText}>Enregistrer</Text></>)}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  closeButton: { padding: 8 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#11224e' },
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 16 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderColor: '#f59e0b', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 16, marginTop: 8, borderRadius: 10 },
  alertBannerText: { color: '#b45309', flex: 1, fontSize: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 16, marginHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#e5e7eb' },
  cardDisabled: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#11224e' },
  cardHint: { fontSize: 12, color: '#64748b', marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 12, color: '#065f46', fontWeight: '600' },
  buttonDisabled: { opacity: 0.5, backgroundColor: '#e5e7eb' },
  buttonContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  contextDisplay: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  contextText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  
  separator: {
    width: 1,
    height: '60%',
    backgroundColor: '#d1d5db',
  },
  dropdownButton: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db' },
  dropdownButtonDisabled: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  dropdownButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  dropdownButtonText: { fontSize: 16, color: '#11224e', flex: 1 },
  placeholderText: { color: '#9ca3af' },
  dropdown: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#d1d5db', marginTop: 4, maxHeight: 220, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', minHeight: 56 },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropdownIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  dropdownLogo: { width: 28, height: 28, borderRadius: 14 },
  dropdownItemContent: { flex: 1, justifyContent: 'center' },
  dropdownItemTitle: { fontSize: 16, fontWeight: '500', color: '#11224e', lineHeight: 22 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 20,
  },
  locationIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  voiceNoteContainer: {
    marginTop: 12,
  },
  voiceActionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceRecordButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f87b1b'
  },
  transcribeButton: {},
  voiceRecordButtonText: {
    color: '#11224e',
    fontWeight: '600',
  },
  submitButton: { backgroundColor: '#f87b1b', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, height: 48, alignSelf: 'center', width: '92%' },
  submitButtonDisabled: { backgroundColor: '#d1d5db' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  secondaryButton: { backgroundColor: '#f3f4f6', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  secondaryButtonText: { color: '#111827', fontWeight: '600' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f87b1b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, position: 'relative' },
  input: { flex: 1, color: '#111827' },
  recordingWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, borderRadius: 10 },
  recordingText: { color: '#dc2626', fontWeight: '600' },
  stopButton: { padding: 4 },
  audioPlayerWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f1f5f9', paddingHorizontal: 12, height: 50, borderRadius: 10, flex: 1, borderWidth: 1, borderColor: '#f87b1b' },
  playButton: {},
  deleteButton: {},
  coordText: { fontSize: 14, color: '#4b5563', textAlign: 'center', marginBottom: 8 },
  enhanceButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#fff'
  },
});


