import API_CONFIG from '@/app/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { createUserProject } from '@/services/projectService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
};

export default function CreateProjectModal({ visible, onClose, onCreated }: Props) {
  const { token, user } = useAuth();

  const [title, setTitle] = useState('');
  const [dd, setDd] = useState('');
  const [df, setDf] = useState('');
  // code is generated server-side; no local state
  const [isActive, setIsActive] = useState(true);
  const [owner, setOwner] = useState('');
  const [control, setControl] = useState('');
  const [technicien, setTechnicien] = useState('');
  const [projectTypeId, setProjectTypeId] = useState('');
  const [projectTypes, setProjectTypes] = useState<{ id: string; title: string }[]>([]);
  const [projectTypeOpen, setProjectTypeOpen] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<{ id: string; firstname?: string; lastname?: string; email?: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [controlOpen, setControlOpen] = useState(false);
  const [technicienOpen, setTechnicienOpen] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDdPickerVisible, setDdPickerVisible] = useState(false);
  const [isDfPickerVisible, setDfPickerVisible] = useState(false);

  const isDisabled = useMemo(() => !title || !dd || !df || !control || !technicien || !token, [title, dd, df, control, technicien, token]);

  function validate(): string | null {
    if (!title) return 'Le titre est requis';
    if (!dd) return 'La date de début est requise';
    if (!df) return 'La date de fin est requise';
    if (!control) return 'Le contrôleur est requis';
    if (!technicien) return 'Le technicien est requis';
    const start = new Date(dd);
    const end = new Date(df);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Dates invalides';
    if (start >= end) return 'La date de fin doit être postérieure à la date de début';
    return null;
  }

  useEffect(() => {
    async function loadUsers() {
      if (!token || !user?.company_id) { setCompanyUsers([]); return; }
      setLoadingUsers(true);
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/users/company/${user.company_id}`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setCompanyUsers(data);
        } else {
          setCompanyUsers([]);
        }
      } catch {
        setCompanyUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }
    // If we can infer company id from user in storage, backend already filters by token; we call the company route without relying on company_id param, but route expects param. Fallback: if not available, fetch all users and filter client-side (not ideal). Leaving minimal since backend protects access.
    loadUsers();
  }, [token, user?.company_id]);

  useEffect(() => {
    async function loadProjectTypes() {
      setLoadingTypes(true);
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/project-types`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setProjectTypes(data.map((t: any) => ({ id: String(t.id), title: t.title })));
        } else {
          setProjectTypes([]);
        }
      } catch {
        setProjectTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    }
    loadProjectTypes();
  }, []);

  async function onSubmit() {
    if (!token) return;
    const error = validate();
    if (error) { setError(error); return; }
    try {
      setIsSubmitting(true);
      await createUserProject(token, {
        title,
        dd,
        df,
        status: isActive ? 1 : 0,
        owner: owner || undefined,
        control,
        technicien,
        id_project_type: projectTypeId || undefined,
      });
      setTitle(''); setDd(''); setDf(''); setIsActive(true); setOwner(''); setControl(''); setTechnicien(''); setProjectTypeId(''); setError(null);
      if (onCreated) await onCreated();
      onClose();
      Alert.alert('Succès', 'Projet créé avec succès');
    } catch (e: any) {
      setError(e?.message || 'Création échouée');
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(date: Date) {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    return `${y}-${m}-${d}`;
  }

  return (
    <>
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={stylesFS.container}>
          {/* Header */}
          <View style={stylesFS.header}>
            <TouchableOpacity onPress={onClose} style={stylesFS.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <View style={stylesFS.headerCenter}>
              <Text style={stylesFS.headerTitle}>Créer un projet</Text>
            </View>
            <View style={stylesFS.placeholder} />
          </View>

          {/* Error Banner */}
          {error && (
            <View style={stylesFS.alertBanner}>
              <Ionicons name="warning" size={16} color="#b45309" />
              <Text style={stylesFS.alertBannerText}>{error}</Text>
              <TouchableOpacity onPress={() => setError(null)}>
                <Ionicons name="close" size={16} color="#b45309" />
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          <ScrollView style={stylesFS.content} showsVerticalScrollIndicator={false}>
            <View style={stylesFS.card}>
              <View style={[stylesFS.inputWrap, { marginBottom: 16 }]}>
                <Ionicons name="text-outline" size={16} color="#6b7280" />
                <TextInput placeholder="Titre" placeholderTextColor="#9ca3af" value={title} onChangeText={setTitle} style={stylesFS.input} />
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <TouchableOpacity style={[stylesFS.inputWrap, { flex: 1 }]} onPress={() => setDdPickerVisible(true)}>
                  <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  <Text style={[stylesFS.input, { color: dd ? '#111827' : '#9ca3af' }]}>{dd || 'Début (YYYY-MM-DD)'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[stylesFS.inputWrap, { flex: 1 }]} onPress={() => setDfPickerVisible(true)}>
                  <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                  <Text style={[stylesFS.input, { color: df ? '#111827' : '#9ca3af' }]}>{df || 'Fin (YYYY-MM-DD)'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="flag-outline" size={16} color="#6b7280" />
                  <Text style={{ color: '#111827' }}>Status</Text>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    thumbColor={isActive ? '#f87b1b' : '#f4f3f4'}
                    trackColor={{ false: '#d1d5db', true: '#fde7d4' }}
                  />
                </View>
              </View>
              {/* Project Type Select */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 2 }}>Type de projet</Text>
                <TouchableOpacity style={[stylesFS.inputWrap, { justifyContent: 'space-between' }]} onPress={() => setProjectTypeOpen(v => !v)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons name="albums-outline" size={16} color="#6b7280" />
                    <Text style={[stylesFS.input, { color: projectTypeId ? '#111827' : '#9ca3af' }]} numberOfLines={1}>
                      {projectTypeId ? (projectTypes.find(pt => String(pt.id) === String(projectTypeId))?.title || projectTypeId) : 'Choisir un type'}
                    </Text>
                  </View>
                  <Ionicons name={projectTypeOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
                </TouchableOpacity>
                {projectTypeOpen && (
                  <View style={{ maxHeight: 200, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {loadingTypes ? (
                        <View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>Chargement...</Text></View>
                      ) : projectTypes.length === 0 ? (
                        <View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>Aucun type</Text></View>
                      ) : (
                        projectTypes.map(pt => (
                          <TouchableOpacity key={pt.id} onPress={() => { setProjectTypeId(String(pt.id)); setProjectTypeOpen(false); }} style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: String(projectTypeId) === String(pt.id) ? '#f1f5f9' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                            <Text style={{ color: '#11224e' }}>{pt.title}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 2 }}>Admin</Text>
                <TouchableOpacity style={[stylesFS.inputWrap, { justifyContent: 'space-between' }]} onPress={() => setOwnerOpen(v => !v)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons name="person-circle-outline" size={16} color="#6b7280" />
                    <Text style={[stylesFS.input, { color: owner ? '#111827' : '#9ca3af' }]} numberOfLines={1}>
                      {owner ? (companyUsers.find(u => String(u.id) === String(owner))?.firstname ? `${companyUsers.find(u => String(u.id) === String(owner))?.firstname} ${companyUsers.find(u => String(u.id) === String(owner))?.lastname || ''}` : owner) : 'Choisir un admin'}
                    </Text>
                  </View>
                  <Ionicons name={ownerOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
                </TouchableOpacity>
                {ownerOpen && (
                  <View style={{ maxHeight: 200, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {loadingUsers ? (
                        <View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>Chargement...</Text></View>
                      ) : companyUsers.length === 0 ? (
                        <View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>Aucun utilisateur</Text></View>
                      ) : (
                        companyUsers.map(u => (
                          <TouchableOpacity key={u.id} onPress={() => { setOwner(String(u.id)); setOwnerOpen(false); }} style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: String(owner) === String(u.id) ? '#f1f5f9' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                            <Text style={{ color: '#11224e' }}>{u.firstname || ''} {u.lastname || ''}</Text>
                            {u.email ? <Text style={{ color: '#6b7280', fontSize: 12 }}>{u.email}</Text> : null}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              {/* Control User Select */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 2 }}>Contrôleur</Text>
                <TouchableOpacity style={[stylesFS.inputWrap, { justifyContent: 'space-between' }]} onPress={() => setControlOpen(v => !v)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#6b7280" />
                    <Text style={[stylesFS.input, { color: control ? '#111827' : '#9ca3af' }]} numberOfLines={1}>
                      {control ? (companyUsers.find(u => String(u.id) === String(control))?.firstname ? `${companyUsers.find(u => String(u.id) === String(control))?.firstname} ${companyUsers.find(u => String(u.id) === String(control))?.lastname || ''}` : control) : 'Choisir un contrôleur'}
                    </Text>
                  </View>
                  <Ionicons name={controlOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
                </TouchableOpacity>
                {controlOpen && (
                  <View style={{ maxHeight: 200, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {loadingUsers ? (
                        <View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>Chargement...</Text></View>
                      ) : companyUsers.length === 0 ? (
                        <View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>Aucun utilisateur</Text></View>
                      ) : (
                        companyUsers.map(u => (
                          <TouchableOpacity key={u.id} onPress={() => { setControl(String(u.id)); setControlOpen(false); }} style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: String(control) === String(u.id) ? '#f1f5f9' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                            <Text style={{ color: '#11224e' }}>{u.firstname || ''} {u.lastname || ''}</Text>
                            {u.email ? <Text style={{ color: '#6b7280', fontSize: 12 }}>{u.email}</Text> : null}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              {/* Technicien User Select */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 2 }}>Technicien</Text>
                <TouchableOpacity style={[stylesFS.inputWrap, { justifyContent: 'space-between' }]} onPress={() => setTechnicienOpen(v => !v)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Ionicons name="construct-outline" size={16} color="#6b7280" />
                    <Text style={[stylesFS.input, { color: technicien ? '#111827' : '#9ca3af' }]} numberOfLines={1}>
                      {technicien ? (companyUsers.find(u => String(u.id) === String(technicien))?.firstname ? `${companyUsers.find(u => String(u.id) === String(technicien))?.firstname} ${companyUsers.find(u => String(u.id) === String(technicien))?.lastname || ''}` : technicien) : 'Choisir un technicien'}
                    </Text>
                  </View>
                  <Ionicons name={technicienOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
                </TouchableOpacity>
                {technicienOpen && (
                  <View style={{ maxHeight: 200, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {loadingUsers ? (
                        <View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>Chargement...</Text></View>
                      ) : companyUsers.length === 0 ? (
                        <View style={{ padding: 12 }}><Text style={{ color: '#6b7280' }}>Aucun utilisateur</Text></View>
                      ) : (
                        companyUsers.map(u => (
                          <TouchableOpacity key={u.id} onPress={() => { setTechnicien(String(u.id)); setTechnicienOpen(false); }} style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: String(technicien) === String(u.id) ? '#f1f5f9' : '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                            <Text style={{ color: '#11224e' }}>{u.firstname || ''} {u.lastname || ''}</Text>
                            {u.email ? <Text style={{ color: '#6b7280', fontSize: 12 }}>{u.email}</Text> : null}
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={stylesFS.footer}>
            <TouchableOpacity style={[stylesFS.submitButton, (!token || isSubmitting || isDisabled) && stylesFS.submitButtonDisabled]} disabled={!token || isSubmitting || isDisabled} onPress={onSubmit}>
              {isSubmitting ? (
                <>
                  <Ionicons name="hourglass" size={16} color="#FFFFFF" />
                  <Text style={stylesFS.submitButtonText}>Enregistrement...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="save" size={16} color="#FFFFFF" />
                  <Text style={stylesFS.submitButtonText}>Créer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Date Pickers */}
          <DateTimePickerModal
            key="dd-picker"
            isVisible={isDdPickerVisible}
            mode="date"
            onConfirm={(date) => { setDd(formatDate(date)); setDdPickerVisible(false); }}
            onCancel={() => setDdPickerVisible(false)}
          />
          <DateTimePickerModal
            key="df-picker"
            isVisible={isDfPickerVisible}
            mode="date"
            onConfirm={(date) => { setDf(formatDate(date)); setDfPickerVisible(false); }}
            onCancel={() => setDfPickerVisible(false)}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
    </>
  );
}

const stylesFS = StyleSheet.create({
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


