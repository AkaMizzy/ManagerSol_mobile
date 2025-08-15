import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CreateDeclarationData, DeclarationType, Zone } from '../types/declaration';

interface CreateDeclarationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeclarationData) => Promise<void>;
  declarationTypes: DeclarationType[];
  zones: Zone[];
  isLoading?: boolean;
}

const { width } = Dimensions.get('window');

export default function CreateDeclarationModal({
  visible,
  onClose,
  onSubmit,
  declarationTypes,
  zones,
  isLoading = false,
}: CreateDeclarationModalProps) {
  const [formData, setFormData] = useState<CreateDeclarationData>({
    id_declaration_type: '',
    severite: 5,
    id_zone: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  
  // Photo handling state
  const [selectedPhotos, setSelectedPhotos] = useState<{ uri: string; type: string; name: string }[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setFormData({
        id_declaration_type: '',
        severite: 5,
        id_zone: '',
        description: '',
      });
      setErrors({});
      setSelectedPhotos([]);
    }
  }, [visible]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.id_declaration_type) {
      newErrors.id_declaration_type = 'Declaration type is required';
    }
    if (!formData.id_zone) {
      newErrors.id_zone = 'Zone is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.severite < 0 || formData.severite > 10) {
      newErrors.severite = 'Severity must be between 0 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const dataWithPhotos = {
        ...formData,
        photos: selectedPhotos.length > 0 ? selectedPhotos : undefined
      };
      
      console.log('🔍 Submitting declaration with data:', dataWithPhotos);
      console.log('🔍 Selected photos count:', selectedPhotos.length);
      if (selectedPhotos.length > 0) {
        console.log('🔍 Photo details:', selectedPhotos.map(p => ({ name: p.name, type: p.type, uri: p.uri.substring(0, 50) + '...' })));
      }
      
      await onSubmit(dataWithPhotos);
      onClose();
    } catch (error) {
      console.error('❌ Failed to create declaration:', error);
      Alert.alert('Error', 'Failed to create declaration. Please try again.');
    }
  };

  const getDeclarationTypeTitle = (id: string) => {
    const type = declarationTypes.find(t => t.id === id);
    return type ? type.title : 'Select declaration type';
  };

  const getZoneTitle = (id: string) => {
    const zone = zones.find(z => z.id === id);
    return zone ? zone.title : 'Select zone';
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 7) return '#FF3B30'; // High - Red
    if (severity >= 5) return '#FF9500'; // Medium - Orange
    return '#34C759'; // Low - Green
  };

  const getSeverityText = (severity: number) => {
    if (severity >= 7) return 'High';
    if (severity >= 5) return 'Medium';
    return 'Low';
  };

  const updateFormData = (field: keyof CreateDeclarationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to select photos.');
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
        }));
        
        setSelectedPhotos(prev => [...prev, ...newPhotos]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const newPhoto = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
        };
        
        setSelectedPhotos(prev => [...prev, newPhoto]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photos',
      'Choose how you want to add photos',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImages },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Declaration</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Declaration Type */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Declaration Type *</Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.id_declaration_type && styles.dropdownError]}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <Text style={[
                styles.dropdownText,
                !formData.id_declaration_type && styles.placeholderText
              ]}>
                {getDeclarationTypeTitle(formData.id_declaration_type)}
              </Text>
              <Ionicons
                name={showTypeDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#8E8E93"
              />
            </TouchableOpacity>
            {showTypeDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {declarationTypes.map((type, index) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.dropdownItem,
                        index === declarationTypes.length - 1 && styles.dropdownItemLast
                      ]}
                      onPress={() => {
                        updateFormData('id_declaration_type', type.id);
                        setShowTypeDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{type.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {errors.id_declaration_type && (
              <Text style={styles.errorText}>{errors.id_declaration_type}</Text>
            )}
          </View>

          {/* Severity */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Severity *</Text>
            <View style={styles.severityContainer}>
              <View style={styles.severityHeader}>
                <Text style={[styles.severityValue, { color: getSeverityColor(formData.severite) }]}>
                  {formData.severite}/10
                </Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(formData.severite) }]}>
                  <Text style={styles.severityBadgeText}>{getSeverityText(formData.severite)}</Text>
                </View>
              </View>
              <View style={styles.severitySlider}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.severityDot,
                      formData.severite >= value && [styles.severityDotActive, { backgroundColor: getSeverityColor(formData.severite) }],
                      formData.severite === value && [styles.severityDotSelected, { borderColor: getSeverityColor(formData.severite) }],
                    ]}
                    onPress={() => updateFormData('severite', value)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>
            </View>
            {errors.severite && (
              <Text style={styles.errorText}>{errors.severite}</Text>
            )}
          </View>

          {/* Zone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Zone *</Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.id_zone && styles.dropdownError]}
              onPress={() => setShowZoneDropdown(!showZoneDropdown)}
            >
              <Text style={[
                styles.dropdownText,
                !formData.id_zone && styles.placeholderText
              ]}>
                {getZoneTitle(formData.id_zone)}
              </Text>
              <Ionicons
                name={showZoneDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#8E8E93"
              />
            </TouchableOpacity>
            {showZoneDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {zones.map((zone, index) => (
                    <TouchableOpacity
                      key={zone.id}
                      style={[
                        styles.dropdownItem,
                        index === zones.length - 1 && styles.dropdownItemLast
                      ]}
                      onPress={() => {
                        updateFormData('id_zone', zone.id);
                        setShowZoneDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{zone.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {errors.id_zone && (
              <Text style={styles.errorText}>{errors.id_zone}</Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[
                styles.textArea,
                errors.description && styles.textAreaError
              ]}
              placeholder="Describe the issue or request..."
              placeholderTextColor="#8E8E93"
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          {/* Photo Upload */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Photos (Optional)</Text>
            
            {/* Add Photo Button */}
            <TouchableOpacity style={styles.photoUpload} onPress={showPhotoOptions}>
              <Ionicons name="camera-outline" size={24} color="#8E8E93" />
              <Text style={styles.photoUploadText}>Add photos</Text>
            </TouchableOpacity>
            
            {/* Selected Photos Grid */}
            {selectedPhotos.length > 0 && (
              <View style={styles.photoGrid}>
                {selectedPhotos.map((photo, index) => (
                  <View key={index} style={styles.photoItem}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            <Text style={styles.photoUploadHint}>
              {selectedPhotos.length > 0 
                ? `${selectedPhotos.length} photo(s) selected`
                : 'Tap to add photos from camera or gallery'
              }
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.submitButtonText}>Creating...</Text>
            ) : (
              <Text style={styles.submitButtonText}>Create Declaration</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  placeholder: {
    width: 40,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dropdownError: {
    borderColor: '#FF3B30',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  placeholderText: {
    color: '#8E8E93',
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  dropdownItemLast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  severityContainer: {
    alignItems: 'center',
  },
  severityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  severityValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 0,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  severitySlider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  severityDotActive: {
    borderColor: '#E5E5EA',
  },
  severityDotSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 100,
  },
  textAreaError: {
    borderColor: '#FF3B30',
  },
  photoUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    gap: 8,
  },
  photoUploadText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  photoUploadHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  photoItem: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
