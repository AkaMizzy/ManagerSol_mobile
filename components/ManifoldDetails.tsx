import API_CONFIG from '@/app/config/api';
import { useAuth } from '@/contexts/AuthContext';
import manifolderService from '@/services/manifolderService';
import { ManifolderListItem } from '@/types/manifolder';
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
import FileUploader from './FileUploader';

interface ManifoldDetailsProps {
  manifolderId: string;
  manifolderData?: ManifolderListItem;
  onBack: () => void;
  onGoToQuestions?: () => void;
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
  const [pdfExists, setPdfExists] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCheckingPdf, setIsCheckingPdf] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

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

  const checkPDFStatus = useCallback(async () => {
    try {
      setIsCheckingPdf(true);
      
      // Check if PDF exists by trying to fetch the latest PDF for this manifolder
      const response = await fetch(`${API_CONFIG.BASE_URL}/manifolder-details/check-pdf/${manifolderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setPdfExists(result.exists);
        setPdfUrl(result.fileUrl || null);
      } else {
        setPdfExists(false);
        setPdfUrl(null);
      }
    } catch {
      // If check fails, assume no PDF exists
      setPdfExists(false);
      setPdfUrl(null);
    } finally {
      setIsCheckingPdf(false);
    }
  }, [manifolderId, token]);

  useEffect(() => {
    // Check PDF status when manifolder loads
    if (manifolder) {
      checkPDFStatus();
    }
  }, [manifolder, checkPDFStatus]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Not specified';
    return timeString;
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
      setPdfExists(true);
      setPdfUrl(result.fileUrl);
      
      // Handle PDF opening based on platform
      if (Platform.OS === 'web') {
        // Web: Open PDF in new tab
        const pdfUrl = `${API_CONFIG.BASE_URL}${result.fileUrl}`;
        window.open(pdfUrl, '_blank');
        Alert.alert('Success', 'PDF opened in new tab!');
      } else {
        // Mobile: Try to open PDF directly with device's default PDF viewer
        const pdfUrl = `${API_CONFIG.BASE_URL}${result.fileUrl}`;
        
        try {
          // Try to open with device's default PDF viewer
          const supported = await Linking.canOpenURL(pdfUrl);
          
          if (supported) {
            await Linking.openURL(pdfUrl);
            Alert.alert('Success', 'PDF opened successfully!');
          } else {
            // Fallback to share if direct opening fails
            await Share.share({
              url: pdfUrl,
              title: `Manifolder ${manifolder?.code_formatted || manifolderId}`,
              message: `Manifolder PDF Report: ${manifolder?.code_formatted || manifolderId}`,
            });
            Alert.alert('Success', 'PDF shared successfully!');
          }
        } catch {
          // If direct opening fails, fallback to share
          try {
            await Share.share({
              url: pdfUrl,
              title: `Manifolder ${manifolder?.code_formatted || manifolderId}`,
              message: `Manifolder PDF Report: ${manifolder?.code_formatted || manifolderId}`,
            });
            Alert.alert('Success', 'PDF shared successfully!');
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

  const viewPDF = async () => {
    if (!pdfUrl) {
      Alert.alert('Error', 'PDF URL not found');
      return;
    }

    try {
      const fullPdfUrl = `${API_CONFIG.BASE_URL}${pdfUrl}`;
      
      // Handle PDF opening based on platform
      if (Platform.OS === 'web') {
        // Web: Open PDF in new tab
        window.open(fullPdfUrl, '_blank');
        Alert.alert('Success', 'PDF opened in new tab!');
      } else {
        // Mobile: Try to open PDF directly with device's default PDF viewer
        try {
          // Try to open with device's default PDF viewer
          const supported = await Linking.canOpenURL(fullPdfUrl);
          
          if (supported) {
            await Linking.openURL(fullPdfUrl);
            Alert.alert('Success', 'PDF opened successfully!');
          } else {
            // Fallback to share if direct opening fails
            await Share.share({
              url: fullPdfUrl,
              title: `Manifolder ${manifolder?.code_formatted || manifolderId}`,
              message: `Manifolder PDF Report: ${manifolder?.code_formatted || manifolderId}`,
            });
            Alert.alert('Success', 'PDF shared successfully!');
          }
        } catch {
          // If direct opening fails, fallback to share
          try {
            await Share.share({
              url: fullPdfUrl,
              title: `Manifolder ${manifolder?.code_formatted || manifolderId}`,
              message: `Manifolder PDF Report: ${manifolder?.code_formatted || manifolderId}`,
            });
            Alert.alert('Success', 'PDF shared successfully!');
          } catch {
            Alert.alert('Error', 'Failed to open or share PDF. Please try again.');
          }
        }
      }
      
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open PDF');
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
          <Pressable style={styles.headerBackButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#11224e" />
          </Pressable>
          <Text style={styles.headerTitle}>{manifolder.code_formatted}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Primary Actions */}
        <View style={styles.primaryActionsCard}>
          <View style={styles.primaryActionsContainer}>
            {onGoToQuestions && (
              <Pressable style={styles.primaryActionButton} onPress={onGoToQuestions}>
                <Ionicons name="list-outline" size={20} color="#FFFFFF" />
                <Text style={styles.primaryActionButtonText}>Go to Questions</Text>
              </Pressable>
            )}
            
            <Pressable 
              style={styles.primaryActionButton} 
              onPress={pdfExists ? viewPDF : generatePDF}
              disabled={isCheckingPdf}
            >
              <Ionicons 
                name={pdfExists ? "eye-outline" : "document-text-outline"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.primaryActionButtonText}>
                {isCheckingPdf ? 'Checking...' : pdfExists ? 'View PDF' : 'Generate PDF'}
              </Text>
              {pdfExists && (
                <Ionicons name="checkmark-circle" size={16} color="#34C759" style={{ marginLeft: 6 }} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Main Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text-outline" size={24} color="#11224e" />
            <Text style={styles.cardTitle}>Basic Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Title</Text>
            <Text style={styles.infoValue}>{manifolder.title}</Text>
          </View>
          
          {manifolder.description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Description</Text>
              <Text style={styles.infoValue}>{manifolder.description}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(manifolder.date)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Time</Text>
            <Text style={styles.infoValue}>{formatTime(manifolder.heur_d || null)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Time</Text>
            <Text style={styles.infoValue}>{formatTime(manifolder.heur_f || null)}</Text>
          </View>
        </View>

        {/* Project & Zone Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="business-outline" size={24} color="#11224e" />
            <Text style={styles.cardTitle}>Project & Zone</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Project</Text>
            <Text style={styles.infoValue}>{manifolder.project_title || 'Not specified'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Zone</Text>
            <View style={styles.zoneRow}>
              {manifolder.zone_logo && (
                <Image 
                  source={{ uri: `${API_CONFIG.BASE_URL}${manifolder.zone_logo}` }} 
                  style={styles.zoneLogo}
                  contentFit="cover"
                />
              )}
              <Text style={styles.infoValue}>{manifolder.zone_title || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        {/* Type Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetag-outline" size={24} color="#11224e" />
            <Text style={styles.cardTitle}>Type Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{manifolder.type_title || 'Not specified'}</Text>
          </View>
          
          {manifolder.type_description && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type Description</Text>
              <Text style={styles.infoValue}>{manifolder.type_description}</Text>
            </View>
          )}
        </View>

        {/* Document Upload Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-outline" size={24} color="#11224e" />
            <Text style={styles.cardTitle}>Attached Document</Text>
          </View>
          
          {manifolder.upload_doc ? (
            <View style={styles.documentContainer}>
              <View style={styles.documentInfo}>
                <Ionicons name="document-text-outline" size={32} color="#007AFF" />
                <View style={styles.documentDetails}>
                  <Text style={styles.documentName}>Attached Document</Text>
                  <Text style={styles.documentPath}>{manifolder.upload_doc.split('/').pop()}</Text>
                </View>
              </View>
              
              <View style={styles.documentActions}>
                <Pressable style={styles.documentActionButton} onPress={viewDocument}>
                  <Ionicons name="eye-outline" size={20} color="#007AFF" />
                  <Text style={styles.documentActionText}>View</Text>
                </Pressable>
                
                <Pressable 
                  style={[styles.documentActionButton, styles.dangerButton]} 
                  onPress={removeDocument}
                  disabled={isUploadingDocument}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={[styles.documentActionText, styles.dangerText]}>
                    {isUploadingDocument ? 'Removing...' : 'Remove'}
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
            <Text style={styles.cardTitle}>More Actions</Text>
          </View>
          
          <View style={styles.actionsContainer}>
            <Pressable style={styles.actionButton}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Edit Manifolder</Text>
            </Pressable>
            
            <Pressable style={styles.actionButton}>
              <Ionicons name="share-outline" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Share</Text>
            </Pressable>
            
            <Pressable style={[styles.actionButton, styles.dangerButton]}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.actionButtonText, styles.dangerText]}>Delete</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#11224e',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  primaryActionsCard: {
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
  },
  primaryActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f87b1b',
    borderRadius: 10,
    shadowColor: '#f87b1b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    flexShrink: 1,
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
    marginBottom: 16,
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
});
