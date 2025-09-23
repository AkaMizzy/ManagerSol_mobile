import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_CONFIG from '../app/config/api';
import { useAuth } from '../contexts/AuthContext';
import manifolderService from '../services/manifolderService';
import { Project, Zone } from '../types/declaration';
import { ManifolderType } from '../types/manifolder';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (result: {
    manifolderId: string;
    code_formatted: string;
    date: string;
    heur_d?: string;
    heur_f?: string;
  }) => void;
  projects: Project[];
  zones: Zone[];
  types: ManifolderType[];
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function CreateManifolderModal({
  visible,
  onClose,
  onSuccess,
  projects,
  zones,
  types,
}: Props) {
  const { token } = useAuth();
  const [projectId, setProjectId] = useState<string>('');
  const [zoneId, setZoneId] = useState<string>('');
  const [typeId, setTypeId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [heurD, setHeurD] = useState<Date | null>(null);
  const [heurF, setHeurF] = useState<Date | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeD, setShowTimeD] = useState(false);
  const [showTimeF, setShowTimeF] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  const resetForm = () => {
    setProjectId('');
    setZoneId('');
    setTypeId('');
    setDate(new Date());
    setHeurD(null);
    setHeurF(null);
    setTitle('');
    setDescription('');
  };

  const filteredZones = useMemo(() => {
    if (!projectId) return [];
    return zones.filter(z => (z as any).id_project ? (z as any).id_project === projectId : true);
  }, [zones, projectId]);

  async function handleSubmit() {
    if (!projectId || !zoneId || !typeId || !title.trim()) {
      Alert.alert('Validation', 'Veuillez sélectionner le projet, la zone, le type et saisir un titre.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await manifolderService.createManifolder({
        id_project: projectId,
        id_zone: zoneId,
        id_type: typeId,
        date: formatDate(date),
        heur_d: heurD ? formatTime(heurD) : undefined,
        heur_f: heurF ? formatTime(heurF) : undefined,
        title: title.trim(),
        description: description.trim() || undefined,
      }, token!);

      if (!result?.manifolderId) {
        throw new Error('La création du manifold a échoué, aucun ID retourné.');
      }

      resetForm();
      onSuccess({
        manifolderId: result.manifolderId,
        code_formatted: result.code_formatted,
        date: formatDate(date),
        heur_d: heurD ? formatTime(heurD) : undefined,
        heur_f: heurF ? formatTime(heurF) : undefined,
      });
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'La création du manifolde a échoué');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Créer un Manifold</Text>
              <Text style={styles.headerSubtitle}>Remplissez les détails ci-dessous</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Context Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>                
              </View>
              <TouchableOpacity style={styles.inputContainer} onPress={() => setShowProjectDropdown(!showProjectDropdown)}>
                <Text style={[styles.inputText, !projectId && styles.placeholderText]}>
                  {projectId ? (projects.find(p => p.id === projectId)?.title || 'Projet') : 'Sélectionner le projet *'}
                </Text>
                <Ionicons name={showProjectDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#9ca3af" />
              </TouchableOpacity>
              {showProjectDropdown && (
                <View style={styles.dropdownList}>
                  {projects.map(p => (
                    <TouchableOpacity key={p.id} style={styles.dropdownItem} onPress={() => { setProjectId(p.id); setZoneId(''); setShowProjectDropdown(false); }}>
                      <Text style={styles.dropdownItemText}>{p.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={[styles.inputContainer, { marginTop: 12 }, !projectId && styles.disabled]} disabled={!projectId} onPress={() => setShowZoneDropdown(!showZoneDropdown)}>
                <Text style={[styles.inputText, !zoneId && styles.placeholderText]}>
                  {zoneId ? (zones.find(z => z.id === zoneId)?.title || 'Zone') : 'Sélectionner la zone *'}
                </Text>
                <Ionicons name={showZoneDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#9ca3af" />
              </TouchableOpacity>
              {showZoneDropdown && (
                <View style={styles.dropdownList}>
                  {filteredZones.map(z => (
                    <TouchableOpacity key={z.id} style={styles.dropdownItem} onPress={() => { setZoneId(z.id); setShowZoneDropdown(false); }}>
                       {z.logo && <Image source={{ uri: `${API_CONFIG.BASE_URL}${z.logo}` }} style={styles.zoneLogo} />}
                       <Text style={styles.dropdownItemText}>{z.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            {/* Main Info Card */}
            <View style={styles.card}>
             
               <TouchableOpacity style={[styles.inputContainer, { marginTop: 12 }]} onPress={() => setShowTypeDropdown(!showTypeDropdown)}>
                 <Text style={[styles.inputText, !typeId && styles.placeholderText]}>
                   {typeId ? (types.find(t => t.id === typeId)?.title || 'Type') : 'Sélectionner le type *'}
                 </Text>
                 <Ionicons name={showTypeDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#9ca3af" />
               </TouchableOpacity>
               {showTypeDropdown && (
                 <View style={styles.dropdownList}>
                   {types.map(t => (
                     <TouchableOpacity key={t.id} style={styles.dropdownItem} onPress={() => { setTypeId(t.id); setShowTypeDropdown(false); }}>
                       <Text style={styles.dropdownItemText}>{t.title}</Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               )}
               <View style={styles.cardHeader}></View>
                <TextInput
                style={[styles.inputContainer, styles.textInput]}
                placeholder="Titre *"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            

            {/* Details Card */}
            <View style={styles.card}>

              <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                <Text style={styles.inputText}>{formatDate(date)}</Text>
              </TouchableOpacity>

              <View style={styles.timeRow}>
                <TouchableOpacity style={styles.timeInput} onPress={() => setShowTimeD(true)}>
                  <Ionicons name="time-outline" size={18} color="#6b7280" />
                  <Text style={[styles.inputText, !heurD && styles.placeholderText]}>{heurD ? formatTime(heurD) : 'Heure Début'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.timeInput} onPress={() => setShowTimeF(true)}>
                   <Ionicons name="time-outline" size={18} color="#6b7280" />
                  <Text style={[styles.inputText, !heurF && styles.placeholderText]}>{heurF ? formatTime(heurF) : 'Heure Fin'}</Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={[styles.inputContainer, styles.textArea, { marginTop: 12 }]}
                placeholder="Description (optionnel)"
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.disabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>{submitting ? 'Création en cours...' : 'Créer le Manifold'}</Text>
            </TouchableOpacity>
          </View>

          <DateTimePickerModal isVisible={showDatePicker} mode="date" date={date} onConfirm={d => { setShowDatePicker(false); if (d) setDate(d); }} onCancel={() => setShowDatePicker(false)} />
          <DateTimePickerModal isVisible={showTimeD} mode="time" date={heurD || new Date()} is24Hour onConfirm={d => { setShowTimeD(false); if (d) setHeurD(d); }} onCancel={() => setShowTimeD(false)} />
          <DateTimePickerModal isVisible={showTimeF} mode="time" date={heurF || new Date()} is24Hour onConfirm={d => { setShowTimeF(false); if (d) setHeurF(d); }} onCancel={() => setShowTimeF(false)} />
        </SafeAreaView>
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
  headerSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  placeholder: { width: 40 },
  form: { flex: 1, paddingHorizontal: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#11224e' },
  cardHint: { fontSize: 12, color: '#64748b', marginTop: 2 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  textInput: { paddingVertical: 14 },
  inputText: { fontSize: 16, color: '#11224e', flex: 1 },
  placeholderText: { color: '#9ca3af' },
  disabled: { backgroundColor: '#f3f4f6', opacity: 0.7 },
  dropdownList: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, marginTop: 4, maxHeight: 200 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 10 },
  dropdownItemText: { fontSize: 16, color: '#11224e' },
  zoneLogo: { width: 24, height: 24, borderRadius: 4 },
  textArea: { minHeight: 100, alignItems: 'flex-start' },
  timeRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  timeInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  actions: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  submitButton: { backgroundColor: '#f87b1b', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
