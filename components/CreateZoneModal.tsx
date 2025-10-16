import API_CONFIG from '@/app/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  projectId: string;
  onCreated?: () => Promise<void> | void;
};

export default function CreateZoneModal({ visible, onClose, projectId, onCreated }: Props) {
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [zoneTypeId, setZoneTypeId] = useState('');
  const [zoneTypes, setZoneTypes] = useState<{ id: string; intitule: string }[]>([]);
  const [zoneTypeOpen, setZoneTypeOpen] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [parentZoneId, setParentZoneId] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [pickedImage, setPickedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = useMemo(() => !title || !zoneTypeId || !token || !projectId, [title, zoneTypeId, token, projectId]);

  function validate(): string | null {
    if (!title) return 'Le titre est requis';
    if (!zoneTypeId) return 'Le type de zone est requis';
    return null;
  }

  async function onSubmit() {
    if (!token) return;
    const v = validate();
    if (v) { setError(v); return; }
    try {
      setIsSubmitting(true);
      const form = new FormData();
      form.append('title', title);
      form.append('id_project', String(projectId));
      form.append('zone_type_id', String(zoneTypeId));
      if (parentZoneId) form.append('id_zone', String(parentZoneId));
      if (latitude) form.append('latitude', String(Number(latitude)));
      if (longitude) form.append('longitude', String(Number(longitude)));
      if (pickedImage?.uri) {
        const uri = pickedImage.uri;
        const name = (uri.split('/').pop() || `zone-${Date.now()}.jpg`).replace(/\?.*$/, '');
        const type = pickedImage.mimeType || 'image/jpeg';
        form.append('logo', { uri, name, type } as any);
      }

      const res = await fetch(`${API_CONFIG.BASE_URL}/user/zones`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Création de zone échouée');
      }
      setTitle(''); setZoneTypeId(''); setParentZoneId(''); setLatitude(''); setLongitude(''); setPickedImage(null); setError(null);
      if (onCreated) await onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Création de zone échouée');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      setError("Permission d'accès aux photos refusée");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) {
      setPickedImage(result.assets[0]);
    }
  }

  function clearImage() {
    setPickedImage(null);
  }

  useEffect(() => {
    async function loadZoneTypes() {
      setLoadingTypes(true);
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/zone-types`, { headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) setZoneTypes(data.map((t: any) => ({ id: String(t.id), intitule: t.intitule })));
        else setZoneTypes([]);
      } catch {
        setZoneTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    }
    loadZoneTypes();
  }, []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Ajouter une zone</Text>
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Error Banner (only on failure per requirement) */}
          {error && (
            <View style={styles.alertBanner}>
              <Ionicons name="warning" size={16} color="#b45309" />
              <Text style={styles.alertBannerText}>{error}</Text>
              <TouchableOpacity onPress={() => setError(null)}>
                <Ionicons name="close" size={16} color="#b45309" />
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <View style={[styles.inputWrap, { marginBottom: 12 }]}>
                <Ionicons name="text-outline" size={16} color="#6b7280" />
                <TextInput placeholder="Titre" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} style={styles.input} />
              </View>
               {/* Code is auto-generated server-side: zone-{number}-{dd/MM} */}
              <View style={{ gap: 8, marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 2 }}>Type de zone</Text>
                <TouchableOpacity style={[styles.inputWrap, { justifyContent: 'space-between' }]} onPress={() => setZoneTypeOpen(v => !v)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons name="albums-outline" size={16} color="#6b7280" />
                    <Text style={[styles.input, { color: zoneTypeId ? '#111827' : '#9ca3af' }]} numberOfLines={1}>
                      {zoneTypeId ? (zoneTypes.find(zt => String(zt.id) === String(zoneTypeId))?.intitule || zoneTypeId) : 'Choisir un type'}
                    </Text>
                  </View>
                  <Ionicons name={zoneTypeOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
                </TouchableOpacity>
                {zoneTypeOpen && (
                  <View style={{ maxHeight: 220, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {loadingTypes ? (
                        <View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>Chargement...</Text></View>
                      ) : zoneTypes.length === 0 ? (
                        <View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>Aucun type</Text></View>
                      ) : (
                        zoneTypes.map(zt => (
                          <TouchableOpacity key={zt.id} onPress={() => { setZoneTypeId(String(zt.id)); setZoneTypeOpen(false); }} style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: String(zoneTypeId) === String(zt.id) ? '#f1f5f9' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                            <Text style={{ color: '#11224e' }}>{zt.intitule}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View style={[styles.inputWrap, { marginBottom: 12 }]}>
                <Ionicons name="git-branch-outline" size={16} color="#6b7280" />
                <TextInput placeholder="Zone parente (ID) - optionnel" placeholderTextColor="#9ca3af" value={parentZoneId} onChangeText={setParentZoneId} style={styles.input} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Ionicons name="navigate-outline" size={16} color="#6b7280" />
                  <TextInput placeholder="Latitude" placeholderTextColor="#9ca3af" keyboardType="numeric" value={latitude} onChangeText={setLatitude} style={styles.input} />
                </View>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Ionicons name="navigate-outline" size={16} color="#6b7280" />
                  <TextInput placeholder="Longitude" placeholderTextColor="#9ca3af" keyboardType="numeric" value={longitude} onChangeText={setLongitude} style={styles.input} />
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={pickImage} style={[styles.inputWrap, { flex: 1, justifyContent: 'center' }]}>
                    <Ionicons name="image-outline" size={16} color="#6b7280" />
                    <Text style={[styles.input, { color: '#111827' }]}>Sélectionner une image</Text>
                  </TouchableOpacity>
                </View>
                {pickedImage?.uri ? (
                  <View style={{ marginTop: 8, alignItems: 'center' }}>
                    <View style={{ position: 'relative' }}>
                      <Image source={{ uri: pickedImage.uri }} style={{ width: 200, height: 140, borderRadius: 12 }} />
                      <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={clearImage} style={{ backgroundColor: '#FFFFFF', borderColor: '#e5e7eb', borderWidth: 1, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="trash" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.submitButton, (!token || isSubmitting || isDisabled) && styles.submitButtonDisabled]} disabled={!token || isSubmitting || isDisabled} onPress={onSubmit}>
              {isSubmitting ? (
                <>
                  <Ionicons name="hourglass" size={16} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Enregistrement...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="save" size={16} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Créer</Text>
                </>
              )}
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
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#11224e' },
  placeholder: { width: 40 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderColor: '#f59e0b', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 16, marginTop: 8, borderRadius: 10 },
  alertBannerText: { color: '#b45309', flex: 1, fontSize: 12 },
  content: { flex: 1, paddingHorizontal: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginTop: 20, marginHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f87b1b', gap: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f87b1b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, color: '#111827' },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  submitButton: { backgroundColor: '#f87b1b', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, height: 48, alignSelf: 'center', width: '92%' },
  submitButtonDisabled: { backgroundColor: '#d1d5db' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});


