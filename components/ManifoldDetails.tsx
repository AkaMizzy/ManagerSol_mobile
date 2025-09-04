import API_CONFIG from '@/app/config/api';
import { useAuth } from '@/contexts/AuthContext';
import manifolderService from '@/services/manifolderService';
import { ManifolderListItem } from '@/types/manifolder';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (manifolderData) {
      setManifolder(manifolderData);
      setIsLoading(false);
    } else {
      loadManifolderDetails();
    }
  }, [manifolderId]);

  const loadManifolderDetails = async () => {
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
        } catch (openError) {
          // If direct opening fails, fallback to share
          try {
            await Share.share({
              url: pdfUrl,
              title: `Manifolder ${manifolder?.code_formatted || manifolderId}`,
              message: `Manifolder PDF Report: ${manifolder?.code_formatted || manifolderId}`,
            });
            Alert.alert('Success', 'PDF shared successfully!');
          } catch (shareError) {
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
        {/* Floating Back Button */}
        <Pressable style={styles.floatingBackButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </Pressable>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active</Text>
          </View>
          <Text style={styles.manifolderCode}>{manifolder.code_formatted}</Text>
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

        {/* Code Information Card */}
        

        {/* Actions Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings-outline" size={24} color="#11224e" />
            <Text style={styles.cardTitle}>Actions</Text>
          </View>
          
          <View style={styles.actionsContainer}>
            {onGoToQuestions && (
              <Pressable style={styles.actionButton} onPress={onGoToQuestions}>
                <Ionicons name="list-outline" size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Go to Questions</Text>
              </Pressable>
            )}
            
            <Pressable style={styles.actionButton} onPress={generatePDF}>
              <Ionicons name="document-text-outline" size={20} color="#007AFF" />
              <Text style={styles.actionButtonText}>Generate PDF</Text>
            </Pressable>
            
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
  floatingBackButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  manifolderCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#11224e',
    fontFamily: 'monospace',
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
});
