import { useAuth } from '@/contexts/AuthContext';
import manifolderService from '@/services/manifolderService';
import { ManifolderAnswer, ManifolderQuestion } from '@/types/manifolder';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QuestionAccordion from './QuestionAccordion';

interface ManifolderQuestionsProps {
  manifolderId: string;
  onComplete?: () => void;
}

export default function ManifolderQuestions({
  manifolderId,
  onComplete,
}: ManifolderQuestionsProps) {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<ManifolderQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifolderId, token]);

  const loadQuestions = async () => {
    if (!token || !manifolderId) return;
    
    try {
      setIsLoading(true);
      const response = await manifolderService.getManifolderQuestions(manifolderId, token);
      setQuestions(response.questions);
      
                      // Try to load existing answers
       try {
         const answersResponse = await manifolderService.getManifolderAnswers(manifolderId, token);
         const existingAnswers: Record<string, any> = {};
         const existingQuantities: Record<string, number> = {};
         answersResponse.answers.forEach(answer => {
           // Handle GPS answers - they come with latitude/longitude from backend
           if (answer.questionType === 'GPS' && typeof answer.value === 'object' && answer.value.latitude && answer.value.longitude) {
             existingAnswers[answer.questionId] = {
               latitude: parseFloat(answer.value.latitude),
               longitude: parseFloat(answer.value.longitude)
             };
           } else if (['file', 'photo', 'video', 'voice'].includes(answer.questionType) && answer.value) {
             // Handle file answers - they come as file paths from backend
             existingAnswers[answer.questionId] = {
               filename: answer.value.split('/').pop() || '',
               originalName: answer.value.split('/').pop() || '',
               path: answer.value,
               size: 0, // Backend doesn't provide size, so we'll set to 0
               mimetype: 'application/octet-stream' // Default mimetype
             };
           } else {
             existingAnswers[answer.questionId] = answer.value;
           }
           
           // Store quantity if available
           if (answer.quantity !== undefined && answer.quantity !== null) {
             existingQuantities[answer.questionId] = answer.quantity;
           }
         });
         setAnswers(existingAnswers);
         setQuantities(existingQuantities);
       } catch {
         // If no existing answers, that's fine
         console.log('No existing answers found');
       }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionToggle = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleAnswerChange = (questionId: string, value: any, quantity?: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
    
    if (quantity !== undefined) {
      setQuantities(prev => ({
        ...prev,
        [questionId]: quantity,
      }));
    }
  };

  const handleFileUpload = async (questionId: string, file: { uri: string; name: string; type: string }) => {
    if (!token || !manifolderId) return;

    try {
      const response = await manifolderService.uploadManifolderFile(manifolderId, questionId, file, token);
      
      // Update the answer with the uploaded file info
      setAnswers(prev => ({
        ...prev,
        [questionId]: response.file,
      }));
    } catch (error: any) {
      Alert.alert('Upload Error', error.message || 'Failed to upload file');
    }
  };

  const handleSubmitAnswers = async () => {
    if (!token || !manifolderId) return;

         // Note: Skip required field validation since we don't have required column in database
     // In the future, you can add this validation back if the required column is added

    try {
      setIsSubmitting(true);
      
             // Convert answers to the expected format
       const answersArray: ManifolderAnswer[] = Object.entries(answers)
         .filter(([, value]) => {
           if (value === undefined || value === null || value === '') return false;
           // For GPS answers, check if both latitude and longitude exist
           if (typeof value === 'object' && value.latitude !== undefined && value.longitude !== undefined) {
             return value.latitude !== null && value.longitude !== null;
           }
           // For file answers, check if file object exists with path
           if (typeof value === 'object' && value.path !== undefined) {
             return value.path !== null && value.path !== '';
           }
           return true;
         })
         .map(([questionId, value]) => {
           // Handle GPS answers format
           if (typeof value === 'object' && value.latitude !== undefined && value.longitude !== undefined) {
             return {
               questionId,
               latitude: value.latitude,
               longitude: value.longitude,
               quantity: quantities[questionId],
             };
           }
           // Handle file answers - they're already uploaded, so we don't need to include them in submission
           if (typeof value === 'object' && value.path !== undefined) {
             return {
               questionId,
               value: value.path, // Just send the file path
               quantity: quantities[questionId],
             };
           }
           // Handle regular answers
           return {
             questionId,
             value,
             quantity: quantities[questionId],
           };
         });

      if (answersArray.length === 0) {
        Alert.alert('No Answers', 'Please provide at least one answer before submitting.');
        return;
      }

      await manifolderService.submitManifolderAnswers(
        { manifolderId, answers: answersArray },
        token
      );

      Alert.alert(
        'Success',
        'Your answers have been submitted successfully!',
        [{ text: 'OK', onPress: onComplete }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit answers');
    } finally {
      setIsSubmitting(false);
    }
  };

     const getAnsweredCount = () => {
     return Object.values(answers).filter(value => {
       if (value === undefined || value === null || value === '') return false;
       // For GPS answers, check if both latitude and longitude exist
       if (typeof value === 'object' && value.latitude !== undefined && value.longitude !== undefined) {
         return value.latitude !== null && value.longitude !== null;
       }
       // For file answers, check if file object exists with path
       if (typeof value === 'object' && value.path !== undefined) {
         return value.path !== null && value.path !== '';
       }
       return true;
     }).length;
   };

           const getSupportedQuestions = () => {
        const supportedTypes = ['text', 'number', 'date', 'boolean', 'GPS', 'file', 'photo', 'video', 'voice', 'taux'];
        return questions.filter(q => supportedTypes.includes(q.type));
      };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color="#11224e" />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </SafeAreaView>
    );
  }

  const supportedQuestions = getSupportedQuestions();

  if (supportedQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['bottom']}>
        <View style={styles.questionIcon}>
          <Text style={styles.questionIconText}>?</Text>
        </View>
        <Text style={styles.emptyTitle}>No Questions Available</Text>
        <Text style={styles.emptyDescription}>
          There are no questions configured for this manifolder type yet.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.questionIcon}>
            <Text style={styles.questionIconText}>?</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Questions</Text>
            <Text style={styles.headerSubtitle}>
              {getAnsweredCount()} of {supportedQuestions.length} answered
            </Text>
          </View>
        </View>
      </View>

      {/* Questions List */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.questionsContainer}>
          {supportedQuestions.map((question) => (
            <QuestionAccordion
              key={question.id}
              question={question}
              value={answers[question.id]}
              quantity={quantities[question.id]}
              onValueChange={(questionId, value, quantity) => {
                // Check if this is a file upload (has uri, name, type properties)
                if (value && typeof value === 'object' && value.uri && value.name && value.type) {
                  handleFileUpload(questionId, value);
                } else {
                  handleAnswerChange(questionId, value, quantity);
                }
              }}
              isExpanded={expandedQuestions.has(question.id)}
              onToggleExpand={handleQuestionToggle}
            />
          ))}
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Pressable
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitAnswers}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Answers'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F2F2F7',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding to ensure submit button is visible above tab bar
  },
  questionsContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  submitContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 20, // Extra bottom padding for tab bar clearance
  },
  submitButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#34C759',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#8E8E93',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
