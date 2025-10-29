import { ICONS } from '@/constants/Icons';
import { useAuth } from '@/contexts/AuthContext';
import qualiphotoService, { QualiPhotoItem } from '@/services/qualiphotoService';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  item: QualiPhotoItem | null;
  onSuccess?: (updated: Partial<QualiPhotoItem>) => void;
};

export default function QualiPhotoEditModal({ visible, onClose, item, onSuccess }: Props) {
  const { token } = useAuth();
  const [introduction, setIntroduction] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnhancingIntro, setIsEnhancingIntro] = useState(false);
  const [isEnhancingConclusion, setIsEnhancingConclusion] = useState(false);

  useEffect(() => {
    if (item) {
      setIntroduction(item.commentaire || '');
      setConclusion(item.conclusion || '');
    }
  }, [item]);

  const handleClose = () => {
    setError(null);
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!token || !item) return;
    if (!introduction.trim() && !conclusion.trim()) {
      setError('Veuillez remplir au moins un champ.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await qualiphotoService.updateQualiPhoto(
        item.id,
        {
          commentaire: introduction,
          conclusion: conclusion,
        },
        token
      );
      onSuccess?.({ ...item, commentaire: introduction, conclusion: conclusion });
      handleClose();
    } catch (e: any) {
      setError(e?.message || "Échec de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEnhance = async (
    text: string, 
    setText: (text: string) => void, 
    setEnhancing: (isEnhancing: boolean) => void
  ) => {
    if (!text || !token) {
      Alert.alert('Erreur', 'Aucun texte à améliorer.');
      return;
    }
    setEnhancing(true);
    setError(null);
    try {
      const result = await qualiphotoService.enhanceDescription(text, token);
      setText(result.enhancedDescription);
    } catch (e: any) {
      setError(e?.message || "Échec de l'amélioration");
      Alert.alert("Erreur d'amélioration", e?.message || "Une erreur est survenue.");
    } finally {
      setEnhancing(false);
    }
  };


  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Modifier le dossier</Text>
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

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <View style={styles.contextDisplay}>
                <View style={styles.contextItem}>
                  <Ionicons name="briefcase-outline" size={16} color="#4b5563" />
                  <Text style={styles.contextText} numberOfLines={1}>
                    {item?.project_title || 'Projet'}
                  </Text>
                </View>
                <View style={styles.separator} />
                <View style={styles.contextItem}>
                  <Ionicons name="location-outline" size={16} color="#4b5563" />
                  <Text style={styles.contextText} numberOfLines={1}>
                    {item?.zone_title || 'Zone'}
                  </Text>
                </View>
              </View>
              <View style={[styles.inputWrap, { marginTop: 16 }]}>
                <Ionicons name="text-outline" size={16} color="#6b7280" />
                <TextInput
                  placeholder="Titre"
                  value={item?.title || ''}
                  style={[styles.input, styles.readOnlyInput]}
                  editable={false}
                />
              </View>

              {/* Introduction */}
              <View style={{ marginTop: 16 }}>
                 <View style={styles.fieldLabelContainer}>
                   <Ionicons name="chatbubble-ellipses-outline" size={18} color="#11224e" />
                   <Text style={styles.fieldLabel}>Introduction</Text>
                 </View>
                 <View style={[styles.inputWrap, { alignItems: 'flex-start', marginTop: 8 }]}>
                   <Ionicons name="chatbubble-ellipses-outline" size={16} color="#6b7280" style={{ marginTop: 4 }} />
                   <TextInput
                     placeholder="Saisir l'introduction..."
                     value={introduction}
                     onChangeText={setIntroduction}
                     style={[styles.input, { height: 250, paddingRight: 40 }]}
                     multiline
                     textAlignVertical="top"
                   />
                    <TouchableOpacity
                        style={styles.enhanceButton}
                        onPress={() => handleEnhance(introduction, setIntroduction, setIsEnhancingIntro)}
                        disabled={isEnhancingIntro || !introduction}
                    >
                        {isEnhancingIntro ? (
                            <ActivityIndicator size="small" color="#f87b1b" />
                        ) : (
                            <Ionicons name="sparkles-outline" size={20} color={!introduction ? '#d1d5db' : '#f87b1b'} />
                        )}
                    </TouchableOpacity>
                 </View>
               </View>

              {/* Conclusion */}
              <View style={{ marginTop: 16 }}>
                 <View style={styles.fieldLabelContainer}>
                   <Ionicons name="checkmark-circle-outline" size={18} color="#11224e" />
                   <Text style={styles.fieldLabel}>Conclusion</Text>
                 </View>
                 <View style={[styles.inputWrap, { alignItems: 'flex-start', marginTop: 8 }]}>
                   <Ionicons name="chatbubble-ellipses-outline" size={16} color="#6b7280" style={{ marginTop: 4 }} />
                   <TextInput
                     placeholder="Saisir la conclusion..."
                     value={conclusion}
                     onChangeText={setConclusion}
                     style={[styles.input, { height: 250, paddingRight: 40 }]}
                     multiline
                     textAlignVertical="top"
                   />
                   <TouchableOpacity
                        style={styles.enhanceButton}
                        onPress={() => handleEnhance(conclusion, setConclusion, setIsEnhancingConclusion)}
                        disabled={isEnhancingConclusion || !conclusion}
                    >
                        {isEnhancingConclusion ? (
                            <ActivityIndicator size="small" color="#f87b1b" />
                        ) : (
                            <Ionicons name="sparkles-outline" size={20} color={!conclusion ? '#d1d5db' : '#f87b1b'} />
                        )}
                    </TouchableOpacity>
                 </View>
               </View>

            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} disabled={submitting} onPress={handleSubmit}>
              {submitting ? (
                <><ActivityIndicator size="small" color="#FFFFFF" /><Text style={styles.submitButtonText}>Enregistrement...</Text></>
              ) : (
                <><Ionicons name="save" size={16} color="#FFFFFF" /><Text style={styles.submitButtonText}>Enregistrer</Text></>
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
  headerCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#11224e' },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 16 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderColor: '#f59e0b', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 16, marginTop: 8, borderRadius: 10 },
  alertBannerText: { color: '#b45309', flex: 1, fontSize: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 16, marginHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#e5e7eb' },
  contextDisplay: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  contextItem: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  contextText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  separator: { width: 1, height: '60%', backgroundColor: '#d1d5db' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f87b1b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, position: 'relative' },
  input: { flex: 1, color: '#111827', fontSize: 16 },
  readOnlyInput: { backgroundColor: '#f9fafb', color: '#6b7280' },
  fieldLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  fieldLabel: { fontSize: 16, fontWeight: '700', color: '#11224e' },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  submitButton: { backgroundColor: '#f87b1b', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, height: 48, alignSelf: 'center', width: '92%' },
  submitButtonDisabled: { backgroundColor: '#d1d5db' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  enhanceButton: { position: 'absolute', top: 10, right: 10, padding: 4, borderRadius: 8, backgroundColor: '#fff' },
});
