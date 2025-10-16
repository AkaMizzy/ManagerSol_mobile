import { useAuth } from '@/contexts/AuthContext';
import { createUserProject } from '@/services/projectService';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated?: () => Promise<void> | void;
};

export default function CreateProjectModal({ visible, onClose, onCreated }: Props) {
  const { token, user } = useAuth();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [dd, setDd] = useState('');
  const [df, setDf] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (error) { Alert.alert('Validation', error); return; }
    try {
      setIsSubmitting(true);
      await createUserProject(token, {
        title,
        dd,
        df,
        code: code || undefined,
        status: status || undefined,
        owner: user?.id,
      });
      setTitle(''); setCode(''); setDd(''); setDf(''); setStatus('');
      if (onCreated) await onCreated();
      onClose();
      Alert.alert('Succès', 'Projet créé avec succès');
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Création échouée');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <Text style={styles.title}>Créer un projet</Text>
          <View style={{ gap: 10, marginTop: 8 }}>
            <TextInput placeholder="Titre" value={title} onChangeText={setTitle} style={styles.input} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <TextInput placeholder="Début (YYYY-MM-DD)" value={dd} onChangeText={setDd} style={styles.input} />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput placeholder="Fin (YYYY-MM-DD)" value={df} onChangeText={setDf} style={styles.input} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <TextInput placeholder="Code (optionnel)" value={code} onChangeText={setCode} style={styles.input} />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput placeholder="Statut (optionnel)" value={status} onChangeText={setStatus} style={styles.input} />
              </View>
            </View>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={[styles.button, styles.secondaryButton]}>
              <Text style={[styles.buttonText, styles.secondaryText]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={isDisabled || isSubmitting} onPress={onSubmit} style={[styles.button, (isDisabled || isSubmitting) && styles.buttonDisabled]}>
              <Text style={styles.buttonText}>{isSubmitting ? '...' : 'Créer'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#11224e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  button: {
    backgroundColor: '#11224e',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryText: {
    color: '#11224e',
  },
} as const;


