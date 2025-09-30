import { ManifolderQuestion } from '@/types/manifolder';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AnswersPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  questions: ManifolderQuestion[];
  answers: Record<string, any>;
}

const AnswersPreviewModal: React.FC<AnswersPreviewModalProps> = ({
  visible,
  onClose,
  questions,
  answers,
}) => {
  const renderAnswer = (question: ManifolderQuestion) => {
    const answer = answers[question.id];

    if (answer === undefined || answer === null || answer === '') {
      return <Text style={styles.noAnswerText}>Aucune réponse fournie</Text>;
    }

    switch (question.type) {
      case 'photo':
      case 'video':
      case 'file':
      case 'voice':
        return <Text style={styles.answerText}>{answer.originalName || 'Fichier joint'}</Text>;
      case 'GPS':
        return (
          <Text style={styles.answerText}>
            Lat: {answer.latitude}, Lon: {answer.longitude}
          </Text>
        );
      case 'boolean':
        return <Text style={styles.answerText}>{answer ? 'Oui' : 'Non'}</Text>;
      default:
        return <Text style={styles.answerText}>{String(answer)}</Text>;
    }
  };

  const renderItem = ({ item }: { item: ManifolderQuestion }) => (
    <View style={styles.qaContainer}>
      <Text style={styles.questionText}>{item.title}</Text>
      {renderAnswer(item)}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Aperçu des réponses</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={28} color="#11224e" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={questions}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    borderWidth: 2,
    borderColor: '#f87b1b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#11224e',
  },
  closeButton: {
    padding: 5,
  },
  listContainer: {
    paddingBottom: 20,
  },
  qaContainer: {
    marginBottom: 15,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  answerText: {
    fontSize: 14,
    color: '#555',
  },
  noAnswerText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
});

export default AnswersPreviewModal;
