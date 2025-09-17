import { useAuth } from '@/contexts/AuthContext';
import qualiphotoService, { QualiPhotoItem, QualiProject, QualiZone } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (created: Partial<QualiPhotoItem>) => void;
};

export default function CreateQualiPhotoModal({ visible, onClose, onSuccess }: Props) {
  const { token } = useAuth();
  const [projects, setProjects] = useState<QualiProject[]>([]);
  const [zones, setZones] = useState<QualiZone[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [dateTaken, setDateTaken] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [photo, setPhoto] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

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
    if (!token) return;
    setLoadingProjects(true);
    qualiphotoService.getProjects(token)
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
    setProjectOpen(false);
    setZoneOpen(false);
    setDateTaken(formatDate(new Date()));
  }, [visible, token]);

  useEffect(() => {
    if (!token || !selectedProject) { setZones([]); setSelectedZone(null); return; }
    setLoadingZones(true);
    qualiphotoService.getZonesByProject(selectedProject, token)
      .then(setZones)
      .catch(() => setZones([]))
      .finally(() => setLoadingZones(false));
  }, [token, selectedProject]);

  const canSave = useMemo(() => !!selectedProject && !!selectedZone && !!photo && !submitting, [selectedProject, selectedZone, photo, submitting]);

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Camera permission is required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4,3], quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhoto({ uri: asset.uri, name: `qualiphoto_${Date.now()}.jpg`, type: 'image/jpeg' });
      }
    } catch {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    setError(null);
    if (!selectedProject) { setError('Veuillez choisir un projet.'); return; }
    if (!selectedZone) { setError('Veuillez choisir une zone.'); return; }
    if (!photo) { setError('Veuillez capturer ou choisir une photo.'); return; }
    setSubmitting(true);
    try {
      const created = await qualiphotoService.create({
        id_project: selectedProject || undefined,
        id_zone: selectedZone,
        commentaire: comment || undefined,
        date_taken: dateTaken || undefined,
        photo,
      }, token);
      onSuccess && onSuccess(created);
      // reset
      setSelectedProject(null);
      setSelectedZone(null);
      setDateTaken('');
      setComment('');
      setPhoto(null);
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
    setDateTaken('');
    setComment('');
    setPhoto(null);
    setError(null);
    setProjectOpen(false);
    setZoneOpen(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Ajouter une photo Qualité</Text>
            <Text style={styles.headerSubtitle}>Sélectionnez le projet, la zone et ajoutez une photo</Text>
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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Project */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}><Ionicons name="briefcase" size={18} color="#11224e" /></View>
              <View style={styles.cardHeaderText}><Text style={styles.cardTitle}>Projet</Text><Text style={styles.cardHint}>Choisir le projet</Text></View>
              {selectedProject && <View style={styles.pill}><Ionicons name="checkmark" size={14} color="#16a34a" /><Text style={styles.pillText}>Choisi</Text></View>}
            </View>
            <Pressable style={styles.dropdownButton} onPress={() => { setProjectOpen(v => !v); setZoneOpen(false); }}>
              <View style={styles.dropdownButtonContent}>
                <Text style={[styles.dropdownButtonText, !selectedProject && styles.placeholderText]}>
                  {selectedProject ? (projects.find(p => p.id === selectedProject)?.title || 'Projet') : 'Sélectionner un projet'}
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
          <View style={[styles.card, !selectedProject && styles.cardDisabled]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}><Ionicons name="location" size={18} color="#11224e" /></View>
              <View style={styles.cardHeaderText}><Text style={styles.cardTitle}>Zone</Text><Text style={styles.cardHint}>Choisir la zone</Text></View>
              {selectedZone && <View style={styles.pill}><Ionicons name="checkmark" size={14} color="#16a34a" /><Text style={styles.pillText}>Choisie</Text></View>}
            </View>
            <Pressable style={[styles.dropdownButton, !selectedProject && styles.dropdownButtonDisabled]} disabled={!selectedProject} onPress={() => { if (!selectedProject) return; setZoneOpen(v => !v); setProjectOpen(false); }}>
              <View style={styles.dropdownButtonContent}>
                <Text style={[styles.dropdownButtonText, !selectedZone && styles.placeholderText]}>
                  {selectedZone ? (zones.find(z => z.id === selectedZone)?.title || 'Zone') : (selectedProject ? 'Sélectionner une zone' : 'Sélectionner un projet d\'abord')}
                </Text>
              </View>
            </Pressable>
            {selectedProject && zoneOpen && (
              <View style={styles.dropdown}>
                <ScrollView showsVerticalScrollIndicator={true}>
                  {(loadingZones ? [] : zones).map(z => (
                    <Pressable key={z.id} style={styles.dropdownItem} onPress={() => { setSelectedZone(z.id); setZoneOpen(false); }}>
                      <View style={styles.dropdownRow}>
                        <View style={styles.dropdownIconWrap}>{z.logo ? <Image source={{ uri: z.logo }} style={styles.dropdownLogo} /> : <Ionicons name="location" size={18} color="#11224e" />}</View>
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

          {/* Photo */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}><Ionicons name="camera" size={18} color="#11224e" /></View>
              <View style={styles.cardHeaderText}><Text style={styles.cardTitle}>Photo</Text><Text style={styles.cardHint}>Prendre une photo ou choisir depuis la galerie</Text></View>
            </View>
            {photo ? (
              <View style={{ gap: 8 }}>
                <Image source={{ uri: photo.uri }} style={{ width: '100%', aspectRatio: 4/3, borderRadius: 12 }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable style={styles.secondaryButton} onPress={() => setPhoto(null)}><Text style={styles.secondaryButtonText}>Supprimer</Text></Pressable>
                  <Pressable style={styles.secondaryButton} onPress={handlePickPhoto}><Text style={styles.secondaryButtonText}>Reprendre</Text></Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.captureButton} onPress={handlePickPhoto}>
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={styles.captureButtonText}>Prendre une photo</Text>
              </Pressable>
            )}
          </View>

          {/* Optional Details */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}><Ionicons name="calendar" size={18} color="#11224e" /></View>
              <View style={styles.cardHeaderText}><Text style={styles.cardTitle}>Détails</Text><Text style={styles.cardHint}>Date (optionnelle) et commentaire</Text></View>
            </View>
            <View style={{ gap: 10 }}>
              <Pressable style={styles.inputWrap} onPress={() => setDatePickerVisible(true)}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={styles.input}>{dateTaken || 'Sélectionner la date'}</Text>
              </Pressable>
              <View style={[styles.inputWrap, { alignItems: 'flex-start' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#6b7280" style={{ marginTop: 4 }} />
                <TextInput placeholder="Commentaire (optionnel)" placeholderTextColor="#9ca3af" value={comment} onChangeText={setComment} style={[styles.input, { height: 100 }]} multiline />
              </View>
            </View>
          </View>

          <View style={{ height: 24 }} />
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
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 16 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderColor: '#f59e0b', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 16, marginTop: 8, borderRadius: 10 },
  alertBannerText: { color: '#b45309', flex: 1, fontSize: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 16, marginHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  cardDisabled: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#11224e' },
  cardHint: { fontSize: 12, color: '#64748b', marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 12, color: '#065f46', fontWeight: '600' },
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
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  submitButton: { backgroundColor: '#f87b1b', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, height: 48, alignSelf: 'center', width: '92%' },
  submitButtonDisabled: { backgroundColor: '#d1d5db' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  captureButton: { backgroundColor: '#11224e', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  captureButtonText: { color: '#FFFFFF', fontWeight: '600' },
  secondaryButton: { backgroundColor: '#f3f4f6', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  secondaryButtonText: { color: '#111827', fontWeight: '600' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  input: { flex: 1, color: '#111827' },
});


