import API_CONFIG from '@/app/config/api';
import { useAuth } from '@/contexts/AuthContext';
import declarationService from '@/services/declarationService';
import manifolderService from '@/services/manifolderService';
import { ManifolderDetailsForDeclaration } from '@/types/declaration';
import { ManifolderAnswer, ManifolderQuestion, Zone } from '@/types/manifolder';
import Ionicons from '@expo/vector-icons/Ionicons';
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
import AnsweredQuestionsCounter from './AnsweredQuestionsCounter';
import CreateDeclarationModal from './CreateDeclarationModal';
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
  const { user, token } = useAuth();
  const [questions, setQuestions] = useState<ManifolderQuestion[]>([]);
  const [manifolderType, setManifolderType] = useState<string>('');
  const [projectId, setProjectId] = useState<string>(''); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [projectTitle, setProjectTitle] = useState<string>(''); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [defaultZoneId, setDefaultZoneId] = useState<string>('');
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [vocalAnswers, setVocalAnswers] = useState<Record<string, any>>({});
  const [imageAnswers, setImageAnswers] = useState<Record<string, any>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [questionZones, setQuestionZones] = useState<Record<string, string>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, number>>({});
  const [answerIds, setAnswerIds] = useState<Record<string, string>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingQuestions, setSubmittingQuestions] = useState<Set<string>>(new Set());
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set());
  const [hasBeenSubmittedQuestions, setHasBeenSubmittedQuestions] = useState<Set<string>>(new Set());
  
  // Signature completion state
  const [signatureStatus, setSignatureStatus] = useState<{
    signatureCount: number;
    isComplete: boolean;
    remainingSignatures: number;
  } | null>(null);
  
  // Declaration creation state
  const [showDeclarationModal, setShowDeclarationModal] = useState(false);
  const [manifolderDetailsForDeclaration, setManifolderDetailsForDeclaration] = useState<ManifolderDetailsForDeclaration | null>(null);
  const [isLoadingManifolderDetails, setIsLoadingManifolderDetails] = useState(false);
  
  // Declaration modal data
  const [declarationTypes, setDeclarationTypes] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);

  useEffect(() => {
    loadQuestions();
    loadDeclarationData();
    loadSignatureStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifolderId, token]);

  const loadQuestions = async () => {
    if (!token || !manifolderId) return;
    
    try {
      setIsLoading(true);
      const response = await manifolderService.getManifolderQuestions(manifolderId, token);
      setQuestions(response.questions);
      setManifolderType(response.manifolderType);
      setProjectId(response.projectId);
      setProjectTitle(response.projectTitle);
      setDefaultZoneId(response.defaultZoneId);
      setAvailableZones(response.availableZones);
      
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
      
                      // Try to load existing answers
       try {
         const answersResponse = await manifolderService.getManifolderAnswers(manifolderId, token);
         const existingAnswers: Record<string, any> = {};
         const existingVocalAnswers: Record<string, any> = {};
         const existingImageAnswers: Record<string, any> = {};
         const existingQuantities: Record<string, number> = {};
         const existingQuestionZones: Record<string, string> = {};
         const existingQuestionStatuses: Record<string, number> = {};
         const existingAnswerIds: Record<string, string> = {};
         const existingSubmittedQuestions: Set<string> = new Set();
         const existingHasBeenSubmittedQuestions: Set<string> = new Set();
         answersResponse.answers.forEach(answer => {
           // Handle text, file, and GPS answers from `value`
           if (answer.value) {
             if (answer.questionType === 'GPS' && typeof answer.value === 'object' && answer.value.latitude && answer.value.longitude) {
               existingAnswers[answer.questionId] = {
                 latitude: parseFloat(answer.value.latitude),
                 longitude: parseFloat(answer.value.longitude)
               };
             } else {
               existingAnswers[answer.questionId] = answer.value;
             }
           }
           
           if (answer.imageAnswer) {
             existingImageAnswers[answer.questionId] = {
               filename: answer.imageAnswer.split('/').pop() || '',
               originalName: answer.imageAnswer.split('/').pop() || '',
               path: `${API_CONFIG.BASE_URL}${answer.imageAnswer}`,
               size: 0,
               mimetype: 'application/octet-stream'
             };
           }
           
           // Handle vocal answers from `vocalAnswer`
           if (answer.vocalAnswer) {
             existingVocalAnswers[answer.questionId] = {
               filename: answer.vocalAnswer.split('/').pop() || '',
               originalName: answer.vocalAnswer.split('/').pop() || '',
               path: `${API_CONFIG.BASE_URL}${answer.vocalAnswer}`,
               size: 0,
               mimetype: 'audio/mp4'
             };
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
           // Also mark as having been submitted before
           existingHasBeenSubmittedQuestions.add(answer.questionId);
         });
         setAnswers(existingAnswers);
         setVocalAnswers(existingVocalAnswers);
         setImageAnswers(existingImageAnswers);
         setQuantities(existingQuantities);
         setQuestionZones(prev => ({ ...prev, ...existingQuestionZones }));
         setQuestionStatuses(prev => ({ ...prev, ...existingQuestionStatuses }));
         setAnswerIds(existingAnswerIds);
         setSubmittedQuestions(existingSubmittedQuestions);
         setHasBeenSubmittedQuestions(existingHasBeenSubmittedQuestions);
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

  const loadDeclarationData = async () => {
    if (!token) return;
    
    try {
      // Load declaration types, projects, and company users in parallel
      const [typesData, projectsData, usersData] = await Promise.all([
        declarationService.getDeclarationTypes(token),
        declarationService.getCompanyProjects(token),
        declarationService.getCompanyUsers(token),
      ]);
      
      setDeclarationTypes(typesData);
      setProjects(projectsData);
      setCompanyUsers(usersData);
    } catch (error: any) {
      console.error('Failed to load declaration data:', error);
      // Don't show alert as this is not critical for the main functionality
    }
  };

  const loadSignatureStatus = async () => {
    if (!token || !manifolderId) return;
    
    try {
      const signatureData = await manifolderService.getManifolderSignatures(manifolderId, token);
      
      // Calculate status locally from the signature data
      const signatureCount = signatureData.totalSignatures;
      setSignatureStatus({
        signatureCount: signatureCount,
        isComplete: signatureCount === 3,
        remainingSignatures: 3 - signatureCount
      });
      
    } catch (err: any) {
      console.log('Failed to load signature status:', err.message);
      // Don't show error alert for signatures as they're optional
    }
  };

  const handleAnswerChange = (questionId: string, value: any, quantity?: number, zoneId?: string, status?: number) => {
    // Prevent answer changes if all signatures are completed
    if (signatureStatus?.isComplete) {
      Alert.alert(
        'Questions Locked',
        'All signatures have been completed. Questions can no longer be modified.',
        [{ text: 'OK' }]
      );
      return;
    }

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

    // Reset submission status when answer is changed
    if (submittedQuestions.has(questionId)) {
      setSubmittedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const handleCopyQuestion = async (questionId: string, manifolderId: string) => {
    if (!token) return;

    try {
      // Call backend API to duplicate the question
      const result = await manifolderService.duplicateManifolderQuestion(questionId, manifolderId, token);
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

  const handleVocalFileUpload = async (questionId: string, file: { uri: string; name: string; type: string }) => {
    if (!token || !manifolderId) return;
    const zoneId = questionZones[questionId] || defaultZoneId;
    if (!zoneId) return;

    try {
        const response = await manifolderService.uploadManifolderFile(manifolderId, questionId, file, token, zoneId);
        setVocalAnswers(prev => ({
            ...prev,
            [questionId]: response.file,
        }));
    } catch (error: any) {
        Alert.alert('Upload Error', error.message || 'Failed to upload vocal file');
    }
  };

  const handleVocalFileRemove = (questionId: string) => {
    setVocalAnswers(prev => {
        const newVocalAnswers = { ...prev };
        delete newVocalAnswers[questionId];
        return newVocalAnswers;
    });
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
      
      // Reset submission status
      setSubmittedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
      setHasBeenSubmittedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
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
                
                // Reset submission status
                setSubmittedQuestions(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(questionId);
                  return newSet;
                });
                setHasBeenSubmittedQuestions(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(questionId);
                  return newSet;
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

  const handleSubmitSingleAnswer = async (questionId: string) => {
    if (!token || !manifolderId) return;

    // Prevent submission if all signatures are completed
    if (signatureStatus?.isComplete) {
      Alert.alert(
        'Submission Locked',
        'All signatures have been completed. Questions can no longer be submitted.',
        [{ text: 'OK' }]
      );
      return;
    }

    const answer = answers[questionId];
    const vocalAnswer = vocalAnswers[questionId];
    const imageAnswer = imageAnswers[questionId];
    const quantity = quantities[questionId];
    const zoneId = questionZones[questionId] || defaultZoneId;
    const status = questionStatuses[questionId];

    if (!answer && !vocalAnswer && !imageAnswer) {
      Alert.alert('No Answer', 'Please provide an answer before submitting.');
      return;
    }

    try {
      setSubmittingQuestions(prev => new Set(prev).add(questionId));

      let submitData: any = {
        manifolderId,
        questionId,
        zoneId,
        status,
        quantity,
      };

      if (imageAnswer && typeof imageAnswer === 'object' && imageAnswer.uri) {
        submitData.imageFile = imageAnswer;
      }

      if (answer && typeof answer === 'object' && answer.latitude !== undefined && answer.longitude !== undefined) {
        submitData.latitude = answer.latitude;
        submitData.longitude = answer.longitude;
      } else if (answer) {
        submitData.value = answer;
      }

      // Check for vocal file to upload
      if (vocalAnswer && typeof vocalAnswer === 'object' && vocalAnswer.uri) {
        submitData.vocalFile = vocalAnswer;
      }

      await manifolderService.submitSingleAnswer(submitData, token);

      // Mark as submitted
      setSubmittedQuestions(prev => new Set(prev).add(questionId));
      
      // Track that this question has been submitted before
      setHasBeenSubmittedQuestions(prev => new Set(prev).add(questionId));
      
      // Auto-collapse the accordion after successful submission
      setExpandedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
      
      // Store the answer ID for future reference and refresh local state
      await loadQuestions();

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

  const handleCreateDeclaration = async (questionId: string) => {
    if (!token || !manifolderId) return;

    // Get the answer ID for this question to use as manifolderDetailId
    const answerId = answerIds[questionId];
    if (!answerId) {
      Alert.alert('Error', 'Please submit your answer first before creating a declaration');
      return;
    }

    try {
      setIsLoadingManifolderDetails(true);
      
      // Fetch manifolder details for declaration creation
      const response = await fetch(`${API_CONFIG.BASE_URL}/manifolder-details-for-declaration/${manifolderId}/${answerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch manifolder details');
      }

      const manifolderDetails: ManifolderDetailsForDeclaration = await response.json();
      setManifolderDetailsForDeclaration(manifolderDetails);
      setShowDeclarationModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load manifolder details for declaration creation');
    } finally {
      setIsLoadingManifolderDetails(false);
    }
  };

  const handleDeclarationSubmit = async (declarationData: any) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/declarations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(declarationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create declaration');
      }

      await response.json(); // We don't need the result, just check if it was successful
      Alert.alert('Success', 'Declaration created successfully!');
      setShowDeclarationModal(false);
      setManifolderDetailsForDeclaration(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create declaration');
    }
  };

  const handleSubmitAnswers = async () => {
    if (!token || !manifolderId) return;

    // Prevent submission if all signatures are completed
    if (signatureStatus?.isComplete) {
      Alert.alert(
        'Submission Locked',
        'All signatures have been completed. Questions can no longer be submitted.',
        [{ text: 'OK' }]
      );
      return;
    }

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
        const filteredQuestions = questions.filter(q => supportedTypes.includes(q.type));
        
        // Sort questions: unanswered first, then answered
        return filteredQuestions.sort((a, b) => {
          const aIsSubmitted = submittedQuestions.has(a.id);
          const bIsSubmitted = submittedQuestions.has(b.id);
          
          // If both have same submission status, maintain original order
          if (aIsSubmitted === bIsSubmitted) {
            return 0;
          }
          
          // Unanswered questions (false) come before answered questions (true)
          return aIsSubmitted ? 1 : -1;
        });
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
          <Ionicons name="document-text-outline" size={20} color="#11224e" />
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
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.questionIcon}>
              <Ionicons name="document-text-outline" size={20} color="#11224e" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>
                {formatManifolderType(manifolderType)} Questions
              </Text>
              <Text style={styles.headerSubtitle}>
              Répondez à toutes les questions pour compléter le manifolder
              </Text>
            </View>
          </View>
          
          {/* Counter inside header */}
          <View style={styles.counterContainer}>
            <AnsweredQuestionsCounter 
              answeredCount={getAnsweredCount()} 
              totalCount={supportedQuestions.length} 
            />
          </View>
        </View>
        
        {/* Signature Status Banner */}
        {signatureStatus && signatureStatus.isComplete && (
          <View style={[
            styles.signatureStatusBanner,
            styles.signatureStatusBannerComplete
          ]}>
            <View style={styles.signatureStatusContent}>
              <Ionicons 
                name={"lock-closed"} 
                size={24} 
                color={'#DC2626'}
                style={styles.signatureStatusIcon}
              />
              <View style={styles.signatureStatusText}>
                <Text style={styles.signatureStatusTitle}>
                  {'Questions Locked'}
                </Text>
                <Text style={styles.signatureStatusDescription}>
                  {'All signatures completed. Questions cannot be modified.'}
                </Text>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.questionsContainer}>
          {supportedQuestions.map((question) => (
            <QuestionAccordion
              key={question.id}
              manifolderId={manifolderId}
              question={question}
              value={answers[question.id]}
              quantity={quantities[question.id]}
              selectedZoneId={questionZones[question.id]}
              selectedStatus={questionStatuses[question.id]}
              availableZones={availableZones}
              defaultZoneId={defaultZoneId}
              onValueChange={(questionId, value, quantity, zoneId, status) => {
                handleAnswerChange(questionId, value, quantity, zoneId, status);
              }}
              isExpanded={expandedQuestions.has(question.id)}
              onToggleExpand={handleQuestionToggle}
              onCopyQuestion={handleCopyQuestion}
              onResetQuestion={handleResetQuestion}
              onSubmitAnswer={handleSubmitSingleAnswer}
              onCreateDeclaration={handleCreateDeclaration}
              isSubmitting={submittingQuestions.has(question.id)}
              isSubmitted={submittedQuestions.has(question.id)}
              hasBeenSubmitted={hasBeenSubmittedQuestions.has(question.id)}
              isLocked={signatureStatus?.isComplete || false}
              vocalAnswer={vocalAnswers[question.id]}
              imageAnswer={imageAnswers[question.id]}
              onVocalFileSelect={(file) => setVocalAnswers(prev => ({ ...prev, [question.id]: file }))}
              onVocalFileRemove={() => handleVocalFileRemove(question.id)}
              onImageFileSelect={(file) => setImageAnswers(prev => ({ ...prev, [question.id]: file }))}
              onImageFileRemove={() => {
                const newImageAnswers = { ...imageAnswers };
                delete newImageAnswers[question.id];
                setImageAnswers(newImageAnswers);
              }}
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

      {/* Declaration Creation Modal */}
      <CreateDeclarationModal
        visible={showDeclarationModal}
        onClose={() => {
          setShowDeclarationModal(false);
          setManifolderDetailsForDeclaration(null);
        }}
        onSubmit={handleDeclarationSubmit}
        declarationTypes={declarationTypes}
        zones={manifolderDetailsForDeclaration?.availableZones || []}
        projects={projects}
        companyUsers={companyUsers}
        currentUser={user || { id: '', firstname: '', lastname: '', email: '' }}
        isLoading={isLoadingManifolderDetails}
        manifolderDetails={manifolderDetailsForDeclaration || undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#94A3B8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8FAFC',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    color: '#11224e',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  counterContainer: {
    marginTop: 16,
  },
  // Signature Status Banner Styles
  signatureStatusBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signatureStatusBannerComplete: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signatureStatusBannerIncomplete: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  signatureStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signatureStatusIcon: {
    marginRight: 12,
  },
  signatureStatusText: {
    flex: 1,
  },
  signatureStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  signatureStatusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitButton: {
    backgroundColor: '#f87b1b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#f87b1b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
