import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type ConclusionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (conclusion: string) => void;
  isGenerating: boolean;
  generatedConclusion: string | null;
  initialConclusion: string | null;
};

export default function ConclusionModal({
  visible,
  onClose,
  onSave,
  isGenerating,
  generatedConclusion,
  initialConclusion,
}: ConclusionModalProps) {
  const [conclusionText, setConclusionText] = useState('');

  useEffect(() => {
    if (visible) {
      setConclusionText(generatedConclusion || initialConclusion || '');
    }
  }, [visible, generatedConclusion, initialConclusion]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Conclusion</Text>
          {isGenerating ? (
            <ActivityIndicator size="large" color="#f87b1b" style={{ marginVertical: 40 }} />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Conclusion..."
              value={conclusionText}
              onChangeText={setConclusionText}
              multiline
            />
          )}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSaveButton]}
              onPress={() => onSave(conclusionText)}
              disabled={isGenerating}
            >
              <Text style={[styles.modalButtonText, { color: '#fff' }]}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 150,
    borderColor: '#f87b1b',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalSaveButton: {
    backgroundColor: '#f87b1b',
  },
  modalButtonText: {
    fontSize: 16,
  },
});
