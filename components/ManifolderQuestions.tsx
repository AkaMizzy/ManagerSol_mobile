import API_CONFIG from '@/app/config/api';
import { useAuth } from '@/contexts/AuthContext';
import manifolderService from '@/services/manifolderService';
import { ManifolderAnswer, ManifolderQuestion, Zone } from '@/types/manifolder';
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
  manifolderData?: {
    title: string;
    project_title?: string;
    zone_title?: string;
  };
  onComplete?: () => void;
}

export default function ManifolderQuestions({
  manifolderId,
  manifolderData,
  onComplete,
}: ManifolderQuestionsProps) {
  const { token } = useAuth();
  const [questions, setQuestions] = useState<ManifolderQuestion[]>([]);
  const [manifolderType, setManifolderType] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [defaultZoneId, setDefaultZoneId] = useState<string>('');
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [questionZones, setQuestionZones] = useState<Record<string, string>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, number>>({});
  const [answerIds, setAnswerIds] = useState<Record<string, string>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingQuestions, setSubmittingQuestions] = useState<Set<string>>(new Set());
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifolderId, token]);

  const loadQuestions = async (preserveState = false) => {
    if (!token || !manifolderId) return;
    
    try {
      if (!preserveState) {
        setIsLoading(true);
      }
      
      const response = await manifolderService.getManifolderQuestions(manifolderId, token);
      setQuestions(response.questions);
      setManifolderType(response.manifolderType);
      setProjectId(response.projectId);
      setProjectTitle(response.projectTitle);
      setDefaultZoneId(response.defaultZoneId);
      setAvailableZones(response.availableZones);
      
      // Only initialize zones and statuses if not preserving state
      if (!preserveState) {
        // Initialize question zones with default zone
        const initialQuestionZones: Record<string, string> = {};
        response.questions.forEach(q => {
          initialQuestionZones[q.id] = response.defaultZoneId;
        });
        setQuestionZones(initialQuestionZones);
        
        // Initialize question statuses with default status (0)
        const initialQuestionStatuses: Record<string, number> = {};
        response.questions.forEach(q => {
          initialQuestionStatuses[q.id] = 0;
        });
        setQuestionStatuses(initialQuestionStatuses);
      }
      
                      // Try to load existing answers
       try {
         const answersResponse = await manifolderService.getManifolderAnswers(manifolderId, token);
         const existingAnswers: Record<string, any> = {};
         const existingQuantities: Record<string, number> = {};
         const existingQuestionZones: Record<string, string> = {};
         const existingQuestionStatuses: Record<string, number> = {};
         const existingAnswerIds: Record<string, string> = {};
         const existingSubmittedQuestions: Set<string> = new Set();
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
           } else if (answer.vocalAnswer) {
             // Handle vocal answers - they come as file paths from backend
             existingAnswers[answer.questionId] = {
               filename: answer.vocalAnswer.split('/').pop() || '',
               originalName: answer.vocalAnswer.split('/').pop() || '',
               path: answer.vocalAnswer,
               size: 0, // Backend doesn't provide size, so we'll set to 0
               mimetype: 'audio/mp4' // Audio mimetype
             };
           } else {
             existingAnswers[answer.questionId] = answer.value;
           }
           
           // Store quantity if available
           if (answer.quantity !== undefined && answer.quantity !== null) {
             existingQuantities[answer.questionId] = answer.quantity;
           }
           
           // Store zone if available
           if (answer.zoneId) {
             existingQuestionZones[answer.questionId] = answer.zoneId;
           }
           
           // Store status if available
           if (answer.status !== undefined && answer.status !== null) {
             existingQuestionStatuses[answer.questionId] = answer.status;
           }
           
           // Store answer ID for deletion purposes
           existingAnswerIds[answer.questionId] = answer.id;
           
           // Mark as submitted since it exists in the database
           existingSubmittedQuestions.add(answer.questionId);
         });
         setAnswers(existingAnswers);
         setQuantities(existingQuantities);
         setQuestionZones(prev => ({ ...prev, ...existingQuestionZones }));
         setQuestionStatuses(prev => ({ ...prev, ...existingQuestionStatuses }));
         setAnswerIds(existingAnswerIds);
         setSubmittedQuestions(existingSubmittedQuestions);
       } catch {
         // If no existing answers, that's fine
         console.log('No existing answers found');
       }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load questions');
    } finally {
      if (!preserveState) {
        setIsLoading(false);
      }
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

  const handleAnswerChange = (questionId: string, value: any, quantity?: number, zoneId?: string, status?: number) => {
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

    if (zoneId) {
      setQuestionZones(prev => ({
        ...prev,
        [questionId]: zoneId,
      }));
    }

    if (status !== undefined) {
      setQuestionStatuses(prev => ({
        ...prev,
        [questionId]: status,
      }));
    }
  };

  const handleCopyQuestion = async (questionId: string) => {
    if (!token) return;

    try {
      // Call backend API to duplicate the question
      const response = await fetch(`${API_CONFIG.BASE_URL}/task-elements/${questionId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate question');
      }

      const result = await response.json();
      const newQuestion = result.newElement;

      // Add the new question to the questions list
      setQuestions(prev => [...prev, newQuestion]);

      // Reload questions to ensure we have the latest data from backend
      await loadQuestions();

      // Show success message
      Alert.alert('Success', 'Question duplicated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to duplicate question');
    }
  };

  const handleResetQuestion = async (questionId: string) => {
    if (!token) return;

    const answerId = answerIds[questionId];
    if (!answerId) {
      // If no answer ID exists, just clear the local state
      setAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      });
      setQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[questionId];
        return newQuantities;
      });
      setQuestionStatuses(prev => {
        const newStatuses = { ...prev };
        delete newStatuses[questionId];
        return newStatuses;
      });
      return;
    }

    try {
      // Show confirmation dialog
      Alert.alert(
        'Reset Answer',
        'Are you sure you want to delete this answer? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await manifolderService.deleteManifolderAnswer(answerId, token);
                
                // Clear the local state
                setAnswers(prev => {
                  const newAnswers = { ...prev };
                  delete newAnswers[questionId];
                  return newAnswers;
                });
                setQuantities(prev => {
                  const newQuantities = { ...prev };
                  delete newQuantities[questionId];
                  return newQuantities;
                });
                setQuestionStatuses(prev => {
                  const newStatuses = { ...prev };
                  delete newStatuses[questionId];
                  return newStatuses;
                });
                setAnswerIds(prev => {
                  const newAnswerIds = { ...prev };
                  delete newAnswerIds[questionId];
                  return newAnswerIds;
                });
                
                Alert.alert('Success', 'Answer deleted successfully!');
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to delete answer');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reset answer');
    }
  };

  const handleFileUpload = async (questionId: string, file: { uri: string; name: string; type: string }) => {
    if (!token || !manifolderId) return;

    const zoneId = questionZones[questionId] || defaultZoneId;
    if (!zoneId) return;

    try {
      const response = await manifolderService.uploadManifolderFile(manifolderId, questionId, file, token, zoneId);
      
      // Update the answer with the uploaded file info
      setAnswers(prev => ({
        ...prev,
        [questionId]: response.file,
      }));
    } catch (error: any) {
      Alert.alert('Upload Error', error.message || 'Failed to upload file');
    }
  };

  const handleSubmissionComplete = (questionId: string) => {
    // Reset the unsaved changes flag for this question
    // This is handled by the QuestionAccordion component itself
    console.log(`Submission completed for question ${questionId}`);
  };

  const handleSubmitSingleAnswer = async (questionId: string) => {
    if (!token || !manifolderId) return;

    const answer = answers[questionId];
    const quantity = quantities[questionId];
    const zoneId = questionZones[questionId] || defaultZoneId;
    const status = questionStatuses[questionId];

    if (!answer) {
      Alert.alert('No Answer', 'Please provide an answer before submitting.');
      return;
    }

    try {
      setSubmittingQuestions(prev => new Set(prev).add(questionId));

      // Prepare the answer data based on question type
      let submitData: any = {
        manifolderId,
        questionId,
        zoneId,
        status,
      };

      // Handle GPS answers
      if (typeof answer === 'object' && answer.latitude !== undefined && answer.longitude !== undefined) {
        submitData.latitude = answer.latitude;
        submitData.longitude = answer.longitude;
      }
      // Handle file answers - they're already uploaded, so we don't need to include them in submission
      else if (typeof answer === 'object' && answer.path !== undefined) {
        submitData.value = answer.path; // Just send the file path
      }
      // Handle regular answers
      else {
        submitData.value = answer;
      }

      // Add quantity if available
      if (quantity !== undefined) {
        submitData.quantity = quantity;
      }

      await manifolderService.submitSingleAnswer(submitData, token);

      // Mark as submitted
      setSubmittedQuestions(prev => new Set(prev).add(questionId));
      
      // Store the answer ID for future reference
      const response = await manifolderService.getManifolderAnswers(manifolderId, token);
      const submittedAnswer = response.answers.find(a => a.questionId === questionId);
      if (submittedAnswer) {
        setAnswerIds(prev => ({
          ...prev,
          [questionId]: submittedAnswer.id,
        }));
      }

      // Reload questions to reflect the new sorting (answered questions move to bottom)
      // Preserve state to maintain expanded questions and user inputs
      await loadQuestions(true);

      Alert.alert('Success', 'Answer submitted successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit answer');
    } finally {
      setSubmittingQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
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
               zoneId: questionZones[questionId],
               status: questionStatuses[questionId],
             };
           }
           // Handle file answers - they're already uploaded, so we don't need to include them in submission
           if (typeof value === 'object' && value.path !== undefined) {
             return {
               questionId,
               value: value.path, // Just send the file path
               quantity: quantities[questionId],
               zoneId: questionZones[questionId],
               status: questionStatuses[questionId],
             };
           }
           // Handle regular answers
           return {
             questionId,
             value,
             quantity: quantities[questionId],
             zoneId: questionZones[questionId],
             status: questionStatuses[questionId],
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
        const supportedTypes = ['text', 'long_text', 'number', 'date', 'boolean', 'GPS', 'file', 'photo', 'video', 'voice', 'taux', 'list'];
        return questions.filter(q => supportedTypes.includes(q.type));
      };

  const formatManifolderType = (type: string) => {
    switch (type) {
      case 'manifolder':
        return 'Manifolder';
      case 'intervention':
        return 'Intervention';
      case 'suivi':
        return 'Suivi';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
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
          {manifolderType 
            ? `There are no questions configured for ${formatManifolderType(manifolderType)} type yet.`
            : 'There are no questions configured for this manifolder type yet.'
          }
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
              selectedZoneId={questionZones[question.id]}
              selectedStatus={questionStatuses[question.id]}
              availableZones={availableZones}
              defaultZoneId={defaultZoneId}
              onValueChange={(questionId, value, quantity, zoneId, status) => {
                // Check if this is a file upload (has uri, name, type properties)
                if (value && typeof value === 'object' && value.uri && value.name && value.type) {
                  handleFileUpload(questionId, value);
                } else {
                  handleAnswerChange(questionId, value, quantity, zoneId, status);
                }
              }}
              isExpanded={expandedQuestions.has(question.id)}
              onToggleExpand={handleQuestionToggle}
              onCopyQuestion={handleCopyQuestion}
              onResetQuestion={handleResetQuestion}
              onSubmitAnswer={handleSubmitSingleAnswer}
              isSubmitting={submittingQuestions.has(question.id)}
              isSubmitted={submittedQuestions.has(question.id)}
              onSubmissionComplete={handleSubmissionComplete}
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
