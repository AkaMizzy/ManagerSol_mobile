import { useAuth } from '@/contexts/AuthContext';
import { createUserProject } from '@/services/projectService';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
};

export default function CreateProjectModal({ visible, onClose, onCreated }: Props) {
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [dd, setDd] = useState('');
  const [df, setDf] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [owner, setOwner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDdPickerVisible, setDdPickerVisible] = useState(false);
  const [isDfPickerVisible, setDfPickerVisible] = useState(false);

  const isDisabled = useMemo(() => !title || !dd || !df || !token, [title, dd, df, token]);

  function validate(): string | null {
    if (!title) return 'Le titre est requis';
    if (!dd) return 'La date de début est requise';
    if (!df) return 'La date de fin est requise';
    const start = new Date(dd);
    const end = new Date(df);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Dates invalides';
    if (start >= end) return 'La date de fin doit être postérieure à la date de début';
    return null;
  }

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
        code: code || undefined,
        status: status || undefined,
        owner: owner || undefined,
      });
      setTitle(''); setDd(''); setDf(''); setCode(''); setStatus(''); setOwner(''); setError(null);
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
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={[stylesFS.inputWrap, { flex: 1 }]}>
                  <Ionicons name="pricetag-outline" size={16} color="#6b7280" />
                  <TextInput placeholder="Code (optionnel)" placeholderTextColor="#9ca3af" value={code} onChangeText={setCode} style={stylesFS.input} />
                </View>
                <View style={[stylesFS.inputWrap, { flex: 1 }]}>
                  <Ionicons name="flag-outline" size={16} color="#6b7280" />
                  <TextInput placeholder="Statut (optionnel)" placeholderTextColor="#9ca3af" value={status} onChangeText={setStatus} style={stylesFS.input} />
                </View>
              </View>
              <View style={[stylesFS.inputWrap, { marginBottom: 4 }]}>
                <Ionicons name="person-outline" size={16} color="#6b7280" />
                <TextInput placeholder="Propriétaire (owner)" placeholderTextColor="#9ca3af" value={owner} onChangeText={setOwner} style={stylesFS.input} />
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


