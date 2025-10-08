import API_CONFIG from '@/app/config/api';
import SignatureField from '@/components/SignatureField';
import { useAuth } from '@/contexts/AuthContext';
import manifolderService from '@/services/manifolderService';
import { ManifolderListItem, ManifolderQuestion } from '@/types/manifolder';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import AnswersPreviewModal from './AnswersPreviewModal';
import FileUploader from './FileUploader';

interface ManifoldDetailsProps {
  manifolderId: string;
  manifolderData?: ManifolderListItem;
  onBack: () => void;
  onGoToQuestions?: (manifolderId: string) => void;
}

interface ManifolderDetailData extends ManifolderListItem {
  type_title?: string;
  created_at?: string;
  updated_at?: string;
  answers_count?: number;
  questions_count?: number;
  upload_doc?: string;
}

export default function ManifoldDetails({ 
  manifolderId, 
  manifolderData, 
  onBack,
  onGoToQuestions
}: ManifoldDetailsProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(!manifolderData);
  const [manifolder, setManifolder] = useState<ManifolderDetailData | null>(manifolderData || null);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  // Preview Modal states
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [questions, setQuestions] = useState<ManifolderQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Signature states
  const [signatures, setSignatures] = useState<{
    technicien: { signature: string; email: string } | null;
    control: { signature: string; email: string } | null;
    admin: { signature: string; email: string } | null;
  }>({
    technicien: null,
    control: null,
    admin: null,
  });
  const [signatureStatus, setSignatureStatus] = useState<{
    signatureCount: number;
    isComplete: boolean;
    remainingSignatures: number;
  } | null>(null);
  const [isLoadingSignatures, setIsLoadingSignatures] = useState(false);

  const loadManifolderDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const manifolderData = await manifolderService.getManifolderById(manifolderId, token!);
      setManifolder(manifolderData);
    } catch (err: any) {
      setError(err.message || 'Failed to load manifolder details');
      Alert.alert('Error', err.message || 'Failed to load manifolder details');
    } finally {
      setIsLoading(false);
    }
  }, [manifolderId, token]);

  useEffect(() => {
    if (manifolderData) {
      setManifolder(manifolderData);
      setIsLoading(false);
    } else {
      loadManifolderDetails();
    }
  }, [manifolderId, manifolderData, loadManifolderDetails]);

  const loadSignatures = useCallback(async () => {
    try {
      setIsLoadingSignatures(true);
      
      const signatureData = await manifolderService.getManifolderSignatures(manifolderId, token!);

      // Update signatures state
      const newSignatures = {
        technicien: signatureData.signatures.technicien ? { 
          signature: '', // We don't store the actual signature data in the list
          email: signatureData.signatures.technicien.email 
        } : null,
        control: signatureData.signatures.control ? { 
          signature: '', 
          email: signatureData.signatures.control.email 
        } : null,
        admin: signatureData.signatures.admin ? { 
          signature: '', 
          email: signatureData.signatures.admin.email 
        } : null,
      };
      
      setSignatures(newSignatures);
      
      // Calculate status locally from the signature data
      const signatureCount = signatureData.totalSignatures;
      setSignatureStatus({
        signatureCount: signatureCount,
        isComplete: signatureCount === 3,
        remainingSignatures: 3 - signatureCount
      });
      
    } catch (err: any) {
      console.log('Failed to load signatures:', err.message);
      // Don't show error alert for signatures as they're optional
    } finally {
      setIsLoadingSignatures(false);
    }
  }, [manifolderId, token]);

  const handleSignatureComplete = async (role: string, signature: string, email: string) => {
    try {
      await manifolderService.saveSignature({
        id_manifolder: manifolderId,
        signature_role: role as 'technicien' | 'control' | 'admin',
        signature: signature,
        signer_email: email,
      }, token!);

      // Update local state
      setSignatures(prev => ({
        ...prev,
        [role]: { signature, email }
      }));

      // Reload signature status
      await loadSignatures();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save signature');
    }
  };

  useEffect(() => {
    // Load signatures when manifolder loads
    if (manifolder) {
      loadSignatures();
    }
  }, [manifolder, loadSignatures]);

  const handlePreviewAnswers = async () => {
    if (isLoadingPreview) return;
    
    try {
      setIsLoadingPreview(true);
      
      // Use the correct endpoint from manifolderService
      const data = await manifolderService.getManifolderAnswers(manifolderId, token!);
      
      // The service now returns { answers: ManifolderAnswerWithDetails[] }
      // We need to transform this data to fit the modal's expected props.
      
      const transformedAnswers: Record<string, any> = {};
      const transformedQuantities: Record<string, number> = {};
      const questionMap: Record<string, ManifolderQuestion> = {};

      data.answers.forEach(answer => {
        // Handle text, file, and GPS answers from `value`
        if (answer.value) {
          if (answer.questionType === 'GPS' && typeof answer.value === 'object' && answer.value.latitude && answer.value.longitude) {
            transformedAnswers[answer.questionId] = {
              latitude: parseFloat(answer.value.latitude),
              longitude: parseFloat(answer.value.longitude)
            };
          } else {
            transformedAnswers[answer.questionId] = answer.value;
          }
        }
        
        // Handle image answers
        if (answer.imageAnswer) {
          transformedAnswers[answer.questionId] = {
            originalName: answer.imageAnswer.split('/').pop() || 'Image Answer',
            path: `${API_CONFIG.BASE_URL}${answer.imageAnswer}`,
          };
        }
        
        // Handle vocal answers
        if (answer.vocalAnswer) {
          transformedAnswers[answer.questionId] = {
            originalName: answer.vocalAnswer.split('/').pop() || 'Vocal Answer',
            path: `${API_CONFIG.BASE_URL}${answer.vocalAnswer}`,
          };
        }
        
        // Store quantity if available
        if (answer.quantity !== undefined && answer.quantity !== null) {
          transformedQuantities[answer.questionId] = answer.quantity;
        }

        // Build question map to avoid duplicates
        if (!questionMap[answer.questionId]) {
          questionMap[answer.questionId] = {
            id: answer.questionId,
            title: answer.questionTitle,
            type: answer.questionType,
            // Add other required fields with default values if necessary
            context: '',
            required: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      });

      setQuestions(Object.values(questionMap));
      setAnswers(transformedAnswers);
      setQuantities(transformedQuantities);
      setIsPreviewModalVisible(true);
      
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not load answers preview.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | null, prefix: string) => {
    if (!timeString) return 'Heure non spécifiée';
    // Extracts HH:MM from formats like HH:MM:SS
    return `${prefix}: ${timeString.slice(0, 5)}`;
  };

  const generatePDF = async () => {
    try {
      setIsLoading(true);
      
      // Generate PDF from backend
      const response = await fetch(`${API_CONFIG.BASE_URL}/manifolder-details/generate-pdf/${manifolderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        let msg = 'PDF generation failed';
        try { 
          const j = await response.json(); 
          msg = j.error || msg; 
        } catch {}
        throw new Error(msg);
      }
      
      const result = await response.json();
      
      // Update PDF status after successful generation
      const newPdfUrl = `${API_CONFIG.BASE_URL}${result.fileUrl}`;
      
      // Handle PDF opening based on platform
      if (Platform.OS === 'web') {
        // Web: Open PDF in new tab
        window.open(newPdfUrl, '_blank');
      } else {
        try {
          const supported = await Linking.canOpenURL(newPdfUrl);
          
          if (supported) {
            await Linking.openURL(newPdfUrl);
          } else {
            // Fallback to share if direct opening fails
            await Share.share({
              url: newPdfUrl,
              title: `Manifolder ${manifolder?.code_formatted || manifolderId}`,
              message: `Manifolder PDF Report: ${manifolder?.code_formatted || manifolderId}`,
            });
          }
        } catch {
          // If direct opening fails, fallback to share
          try {
            await Share.share({
              url: newPdfUrl,
              title: `Manifolder ${manifolder?.code_formatted || manifolderId}`,
              message: `Manifolder PDF Report: ${manifolder?.code_formatted || manifolderId}`,
            });
          } catch {
            Alert.alert('Error', 'Failed to open or share PDF. Please try again.');
          }
        }
      }
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file: { uri: string; name: string; type: string }) => {
    try {
      setIsUploadingDocument(true);
      
      const formData = new FormData();
      formData.append('document', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      const response = await fetch(`${API_CONFIG.BASE_URL}/manifolders/${manifolderId}/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        let msg = 'Document upload failed';
        try { 
          const j = await response.json(); 
          msg = j.error || msg; 
        } catch {}
        throw new Error(msg);
      }

      const result = await response.json();
      
      // Update manifolder state with new document
      if (manifolder) {
        setManifolder({
          ...manifolder,
          upload_doc: result.fileUrl
        });
      }
      
      Alert.alert('Success', 'Document uploaded successfully!');
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload document');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const removeDocument = async () => {
    try {
      setIsUploadingDocument(true);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/manifolders/${manifolderId}/document`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let msg = 'Document removal failed';
        try { 
          const j = await response.json(); 
          msg = j.error || msg; 
        } catch {}
        throw new Error(msg);
      }

      // Update manifolder state to remove document
      if (manifolder) {
        setManifolder({
          ...manifolder,
          upload_doc: undefined
        });
      }
      
      Alert.alert('Success', 'Document removed successfully!');
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove document');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const viewDocument = async () => {
    if (!manifolder?.upload_doc) {
      Alert.alert('Error', 'No document attached');
      return;
    }

    try {
      const fullDocUrl = `${API_CONFIG.BASE_URL}${manifolder.upload_doc}`;
      
      // Handle document opening based on platform
      if (Platform.OS === 'web') {
        // Web: Open document in new tab
        window.open(fullDocUrl, '_blank');
        Alert.alert('Success', 'Document opened in new tab!');
      } else {
        // Mobile: Try to open document directly with device's default viewer
        try {
          const supported = await Linking.canOpenURL(fullDocUrl);
          
          if (supported) {
            await Linking.openURL(fullDocUrl);
            Alert.alert('Success', 'Document opened successfully!');
          } else {
            // Fallback to share if direct opening fails
            await Share.share({
              url: fullDocUrl,
              title: `Manifolder Document: ${manifolder?.code_formatted || manifolderId}`,
              message: `Manifolder Document: ${manifolder?.code_formatted || manifolderId}`,
            });
            Alert.alert('Success', 'Document shared successfully!');
          }
        } catch {
          // If direct opening fails, fallback to share
          try {
            await Share.share({
              url: fullDocUrl,
              title: `Manifolder Document: ${manifolder?.code_formatted || manifolderId}`,
              message: `Manifolder Document: ${manifolder?.code_formatted || manifolderId}`,
            });
            Alert.alert('Success', 'Document shared successfully!');
          } catch {
            Alert.alert('Error', 'Failed to open or share document. Please try again.');
          }
        }
      }
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open document');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#11224e" />
          <Text style={styles.loadingText}>Loading manifolder details...</Text>
        </View>
      </View>
    );
  }

  if (error || !manifolder) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>
            {error || 'Failed to load manifolder details'}
          </Text>
          <Pressable style={styles.retryButton} onPress={loadManifolderDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button and Title */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <Pressable style={styles.headerBackButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#f87b1b" />
            </Pressable>
            <View style={styles.headerCenterContent}>
              <Text style={styles.headerTitle}>{manifolder.code_formatted}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.headerSubtitleContainer}>
            <View style={styles.headerSubtitleItem}>
              <Ionicons name="business-outline" size={16} color="#f87b1b" />
              <Text style={styles.headerSubtitleText} numberOfLines={1}>
                {manifolder.project_title || 'N/A'}
              </Text>
            </View>
            <View style={styles.headerSubtitleItem}>
              {manifolder.zone_logo ? (
                <Image 
                  source={{ uri: `${API_CONFIG.BASE_URL}${manifolder.zone_logo}` }} 
                  style={styles.headerZoneLogo}
                  contentFit="contain"
                />
              ) : (
                <Ionicons name="location-outline" size={16} color="#f87b1b" />
              )}
              <Text style={styles.headerSubtitleText} numberOfLines={1}>
                {manifolder.zone_title || 'N/A'}
              </Text>
            </View>
            <View style={styles.headerSubtitleItem}>
              <Ionicons name="pricetag-outline" size={16} color="#f87b1b" />
              <Text style={styles.headerSubtitleText} numberOfLines={1}>
                {manifolder.type_title || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{manifolder.title}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{formatDate(manifolder.date)}</Text>
          </View>
          
          {manifolder.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{manifolder.description}</Text>
            </View>
          )}
          
          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <Text style={styles.infoValue}>{formatTime(manifolder.heur_d || null, 'Début')}</Text>
            </View>
            <View style={styles.timeItem}>
              <Text style={styles.infoValue}>{formatTime(manifolder.heur_f || null, 'Fin')}</Text>
            </View>
          </View>
        </View>

        {/* Digital Signatures Card */}
        <View style={styles.card}>
          
          {isLoadingSignatures ? (
            <View style={styles.signatureLoadingContainer}>
              <ActivityIndicator size="small" color="#11224e" />
              <Text style={styles.signatureLoadingText}>Loading signatures...</Text>
            </View>
          ) : (
            <>
              <View style={styles.signatureFieldsContainer}>
                <SignatureField
                  role="technicien"
                  roleLabel="Technicien"
                  onSignatureComplete={handleSignatureComplete}
                  isCompleted={!!signatures.technicien}
                  disabled={!!signatures.technicien}
                  signerEmail={signatures.technicien?.email}
                />
                <SignatureField
                  role="control"
                  roleLabel="Contrôle"
                  onSignatureComplete={handleSignatureComplete}
                  isCompleted={!!signatures.control}
                  disabled={!!signatures.control}
                  signerEmail={signatures.control?.email}
                />
                <SignatureField
                  role="admin"
                  roleLabel="Admin"
                  onSignatureComplete={handleSignatureComplete}
                  isCompleted={!!signatures.admin}
                  disabled={!!signatures.admin}
                  signerEmail={signatures.admin?.email}
                />
              </View>       
              <View style={styles.primaryActionsContainer}>
                {onGoToQuestions && (
                  <Pressable style={styles.primaryActionButton} onPress={() => onGoToQuestions(manifolderId)}>
                    <Ionicons name="list-outline" size={28} color="#FFFFFF" />
                  </Pressable>
                )}
                <Pressable 
                  style={styles.primaryActionButton} 
                  onPress={generatePDF}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons 
                      name="document-text-outline" 
                      size={28} 
                      color="#FFFFFF" 
                    />
                  )}
                </Pressable>

                <Pressable 
                  style={styles.primaryActionButton} 
                  onPress={handlePreviewAnswers}
                  disabled={isLoadingPreview}
                >
                  {isLoadingPreview ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons 
                      name="eye-outline" 
                      size={28} 
                      color="#FFFFFF" 
                    />
                  )}
                </Pressable>
              </View>
              
              {signatures.technicien || signatures.control || signatures.admin ? (
                <View style={styles.signatureInfoContainer}>
                  <Text style={styles.signatureInfoTitle}>Signé par:</Text>
                  {signatures.technicien && (
                    <Text style={styles.signatureInfoText}>
                      • Technicien: {signatures.technicien.email}
                    </Text>
                  )}
                  {signatures.control && (
                    <Text style={styles.signatureInfoText}>
                      • Contrôle: {signatures.control.email}
                    </Text>
                  )}
                  {signatures.admin && (
                    <Text style={styles.signatureInfoText}>
                      • Admin: {signatures.admin.email}
                    </Text>
                  )}
                </View>
              ) : null}
            </>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-outline" size={24} color="#11224e" />
            <Text style={styles.cardTitle}>Uploader un document</Text>
          </View>
          
          {manifolder.upload_doc ? (
            <View style={styles.documentContainer}>
              <View style={styles.documentInfo}>
                <Ionicons name="document-text-outline" size={32} color="#007AFF" />
                <View style={styles.documentDetails}>
                  <Text style={styles.documentName}>Document attaché</Text>
                  <Text style={styles.documentPath}>{manifolder.upload_doc.split('/').pop()}</Text>
                </View>
              </View>
            
              <View style={styles.documentActions}>
                <Pressable style={styles.documentActionButton} onPress={viewDocument}>
                  <Ionicons name="eye-outline" size={20} color="#007AFF" />
                  <Text style={styles.documentActionText}>Voir</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.documentActionButton, styles.dangerButton]} 
                  onPress={removeDocument}
                  disabled={isUploadingDocument}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.documentActionText, styles.dangerText]}>
                    {isUploadingDocument ? 'Suppression...' : 'Supprimer'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.uploadContainer}>
              <FileUploader
                value={null}
                onFileSelect={uploadDocument}
                onFileRemove={() => {}}
                placeholder="Upload a document"
                acceptedTypes={['document']}
                maxSize={10}
              />
              {isUploadingDocument && (
                <View style={styles.uploadingIndicator}>
                  <ActivityIndicator size="small" color="#f87b1b" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Secondary Actions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={24} color="#11224e" />
            <Text style={styles.cardTitle}>Plus d&apos;actions</Text>
          </View>
          
          <View style={styles.actionsContainer}>
            <Pressable style={styles.actionButton}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Modifier le manifolder</Text>
            </Pressable>
            
            <Pressable style={styles.actionButton}>
              <Ionicons name="share-outline" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Partager</Text>
            </Pressable>
            
            <Pressable style={[styles.actionButton, styles.dangerButton]}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.actionButtonText, styles.dangerText]}>Supprimer</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <AnswersPreviewModal
        visible={isPreviewModalVisible}
        onClose={() => setIsPreviewModalVisible(false)}
        questions={questions}
        answers={answers}
        quantities={quantities}
        project={manifolder.project_title}
        zone={manifolder.zone_title}
        type={manifolder.type_title}
      />
    </View>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f87b1b',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f87b1b',
  },
  headerCenterContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#11224e',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  headerPreviewButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitleContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f87b1b',
  },
  headerSubtitleText: {
    fontSize: 14,
    color: '#3C3C43',
    fontWeight: '500',
    flexShrink: 1,
  },
  headerZoneLogo: {
    width: 20,
    height: 20,
  },
  headerSpacer: {
    width: 40,
  },
  primaryActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginVertical: 16,
  },
  primaryActionButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f87b1b',
    borderRadius: 12,
    shadowColor: '#f87b1b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f87b1b',
  },
  infoGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f87b1b',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
    marginHorizontal: -16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 12,
  },
  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '400',
    lineHeight: 22,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
    gap: 16,
  },
  timeItem: {
    flex: 1,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  zoneLogo: {
    width: 50,
    height: 24,
    
  },
  codeContainer: {
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
  },
  codeDisplay: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#11224e',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FFE5E5',
  },
  dangerText: {
    color: '#FF3B30',
  },
  bottomSpacing: {
    height: 20,
  },
  documentContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentDetails: {
    flex: 1,
    marginLeft: 12,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  documentPath: {
    fontSize: 14,
    color: '#8E8E93',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  documentActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  documentActionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  uploadContainer: {
    position: 'relative',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#f87b1b',
    fontWeight: '500',
  },
  // Signature section styles
  signatureStatusBadge: {
    backgroundColor: '#11224e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  signatureStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  signatureLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  signatureLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  signatureStatusContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  signatureStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  signatureFieldsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  signatureInfoContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  signatureInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  signatureInfoText: {
    fontSize: 13,
    color: '#166534',
    marginBottom: 4,
  },
});
