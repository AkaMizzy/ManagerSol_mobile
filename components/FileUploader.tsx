import { UploadedFile } from '@/types/manifolder';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';

interface FileUploaderProps {
  value?: UploadedFile | null;
  onFileSelect: (file: { uri: string; name: string; type: string }) => void;
  onFileRemove: () => void;
  placeholder?: string;
  acceptedTypes?: ('image' | 'document')[];
  maxSize?: number; // in MB
}

export default function FileUploader({
  value,
  onFileSelect,
  onFileRemove,
  placeholder = 'Select a file',
  acceptedTypes = ['image', 'document'],
  maxSize = 25,
}: FileUploaderProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `image_${Date.now()}.jpg`;
        const fileType = asset.type || 'image/jpeg';
        
        onFileSelect({
          uri: asset.uri,
          name: fileName,
          type: fileType,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
    setShowOptions(false);
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onFileSelect({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
    setShowOptions(false);
  };

  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        setShowOptions(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `camera_${Date.now()}.jpg`;
        
        onFileSelect({
          uri: asset.uri,
          name: fileName,
          type: 'image/jpeg',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
    setShowOptions(false);
  };

  const getFileIcon = () => {
    if (!value) return 'document-outline';
    
    const mimeType = value.mimetype;
    if (mimeType.startsWith('image/')) return 'image-outline';
    if (mimeType === 'application/pdf') return 'document-text-outline';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document-outline';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'grid-outline';
    return 'document-outline';
  };

  const getFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = value?.mimetype.startsWith('image/');

  return (
    <View style={styles.container}>
      {/* File Display */}
      {value ? (
        <View style={styles.fileContainer}>
          {isImage ? (
            <Image source={{ uri: value.path }} style={styles.imagePreview} />
          ) : (
            <View style={styles.documentPreview}>
              <Ionicons name={getFileIcon()} size={32} color="#007AFF" />
            </View>
          )}
          
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={2}>
              {value.originalName}
            </Text>
            <Text style={styles.fileSize}>
              {getFileSize(value.size)}
            </Text>
          </View>
          
          <Pressable style={styles.removeButton} onPress={onFileRemove}>
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.uploadButton}
          onPress={() => setShowOptions(true)}
        >
          <Ionicons name="cloud-upload-outline" size={24} color="#8E8E93" />
          <Text style={styles.uploadText}>{placeholder}</Text>
        </Pressable>
      )}

      {/* File Selection Modal */}
      <Modal
        visible={showOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select File</Text>
            
            <View style={styles.optionsContainer}>
              {acceptedTypes.includes('image') && (
                <>
                  <Pressable style={styles.optionButton} onPress={handleImagePicker}>
                    <Ionicons name="images-outline" size={24} color="#007AFF" />
                    <Text style={styles.optionText}>Choose from Gallery</Text>
                  </Pressable>
                  
                  <Pressable style={styles.optionButton} onPress={handleCameraCapture}>
                    <Ionicons name="camera-outline" size={24} color="#007AFF" />
                    <Text style={styles.optionText}>Take Photo</Text>
                  </Pressable>
                </>
              )}
              
              {acceptedTypes.includes('document') && (
                <Pressable style={styles.optionButton} onPress={handleDocumentPicker}>
                  <Ionicons name="document-outline" size={24} color="#007AFF" />
                  <Text style={styles.optionText}>Choose Document</Text>
                </Pressable>
              )}
            </View>
            
            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 12,
    minHeight: 60,
  },
  imagePreview: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
  },
  documentPreview: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#8E8E93',
  },
  removeButton: {
    padding: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    minHeight: 60,
  },
  uploadText: {
    fontSize: 16,
    color: '#8E8E93',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
});
