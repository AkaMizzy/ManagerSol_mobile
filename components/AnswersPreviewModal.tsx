import { ManifolderQuestion } from '@/types/manifolder';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface AnswersPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  questions: ManifolderQuestion[];
  answers: Record<string, any>;
  quantities: Record<string, number>;
  project?: string;
  zone?: string;
  type?: string;
}

const AnswersPreviewModal: React.FC<AnswersPreviewModalProps> = ({
  visible,
  onClose,
  questions,
  answers,
  quantities,
  project,
  zone,
  type,
}) => {
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, ManifolderQuestion[]> = {};
    questions.forEach(q => {
      if (!groups[q.title]) {
        groups[q.title] = [];
      }
      groups[q.title].push(q);
    });
    return Object.values(groups);
  }, [questions]);

  const renderAnswer = (question: ManifolderQuestion) => {
    const answer = answers[question.id];
    const quantity = quantities[question.id];

    const answerContent = () => {
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

    return (
      <View style={styles.answerContainer}>
        {answerContent()}
        {quantity !== undefined && quantity !== null && (
          <Text style={styles.quantityText}>({quantity})</Text>
        )}
      </View>
    );
  };

  const renderItem = ({ item: questionGroup }: { item: ManifolderQuestion[] }) => (
    <View style={styles.qaContainer}>
      <Text style={styles.questionText}>{questionGroup[0].title}</Text>
      {questionGroup.map((question, index) => (
        <View key={question.id} style={index > 0 ? styles.clonedAnswer : null}>
          {renderAnswer(question)}
          {index < questionGroup.length - 1 && <View style={styles.answerSeparator} />}
        </View>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{project || 'Aperçu des réponses'}</Text>
              <Text style={styles.headerSubtitle}>
                {[zone, type].filter(Boolean).join(' • ')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color="#f87b1b" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={groupedQuestions}
            renderItem={renderItem}
            keyExtractor={(item) => item[0].id}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
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
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
    marginBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#11224e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    marginLeft: 16,
  },
  contextHeader: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  contextProject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  contextZone: {
    fontSize: 14,
    color: '#475569',
  },
  listContainer: {
    paddingBottom: 20,
  },
  qaContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f87b1b',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  clonedAnswer: {
    marginTop: 8,
  },
  answerSeparator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  answerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    flex: 1,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#11224e',
    marginLeft: 8,
  },
  noAnswerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  separator: {
    height: 12,
  },
});

export default AnswersPreviewModal;
