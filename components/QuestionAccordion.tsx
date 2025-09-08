import API_CONFIG from '@/app/config/api';
import { ManifolderQuestion, QuestionType, Zone } from '@/types/manifolder';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FileUploader from './FileUploader';
import MapSelector from './MapSelector';
import PreviewModal from './PreviewModal';
import VoiceRecorder from './VoiceRecorder';

interface QuestionAccordionProps {
  question: ManifolderQuestion;
  value?: any;
  quantity?: number;
  selectedZoneId?: string;
  availableZones: Zone[];
  defaultZoneId: string;
  onValueChange: (questionId: string, value: any, quantity?: number, zoneId?: string) => void;
  isExpanded?: boolean;
  onToggleExpand: (questionId: string) => void;
  onCopyQuestion?: (questionId: string) => void;
}

export default function QuestionAccordion({
  question,
  value,
  quantity,
  selectedZoneId,
  availableZones,
  defaultZoneId,
  onValueChange,
  isExpanded = false,
  onToggleExpand,
  onCopyQuestion,
}: QuestionAccordionProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [animatedHeight] = useState(new Animated.Value(0));
  const [showPreview, setShowPreview] = useState(false);
  const [questionZoneId, setQuestionZoneId] = useState(selectedZoneId || defaultZoneId);
  const [showZoneModal, setShowZoneModal] = useState(false);

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const handleValueChange = (newValue: any, newQuantity?: number, zoneId?: string) => {
    onValueChange(question.id, newValue, newQuantity, zoneId || questionZoneId);
  };

  const handleZoneChange = (zoneId: string) => {
    setQuestionZoneId(zoneId);
    onValueChange(question.id, value, quantity, zoneId);
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Check if question has media that can be previewed
  const hasPreviewableMedia = () => {
    if (!value) return false;
    
    // For file uploads, check if it's an image, video, document, or voice
    if (typeof value === 'object' && value.path) {
      const path = value.path.toLowerCase();
      return path.includes('.jpg') || path.includes('.jpeg') || path.includes('.png') || 
             path.includes('.gif') || path.includes('.webp') || path.includes('.mp4') || 
             path.includes('.mov') || path.includes('.avi') || path.includes('.mkv') ||
             path.includes('.pdf') || path.includes('.doc') || path.includes('.docx') ||
             path.includes('.txt') || path.includes('.xls') || path.includes('.xlsx') ||
             path.includes('.mp3') || path.includes('.wav') || path.includes('.m4a') ||
             path.includes('.aac') || path.includes('.ogg');
    }
    
    return false;
  };

  // Get media type and URL for preview
  const getPreviewMedia = () => {
    if (!value || typeof value !== 'object' || !value.path) return null;
    
    const path = value.path.toLowerCase();
    const isImage = path.includes('.jpg') || path.includes('.jpeg') || path.includes('.png') || 
                   path.includes('.gif') || path.includes('.webp');
    const isVideo = path.includes('.mp4') || path.includes('.mov') || path.includes('.avi') || 
                   path.includes('.mkv');
    const isFile = path.includes('.pdf') || path.includes('.doc') || path.includes('.docx') ||
                   path.includes('.txt') || path.includes('.xls') || path.includes('.xlsx');
    const isVoice = path.includes('.mp3') || path.includes('.wav') || path.includes('.m4a') ||
                   path.includes('.aac') || path.includes('.ogg');
    
    // Construct full URL for backend files
    const baseUrl = API_CONFIG.BASE_URL;
    const fullUrl = `${baseUrl}${value.path}`;
    
    if (isImage) {
      return { type: 'image' as const, url: fullUrl };
    }
    
    if (isVideo) {
      return { type: 'video' as const, url: fullUrl };
    }
    
    if (isFile) {
      return { type: 'file' as const, url: fullUrl };
    }
    
    if (isVoice) {
      return { type: 'voice' as const, url: fullUrl };
    }
    
    return null;
  };

  const handlePreviewPress = () => {
    if (hasPreviewableMedia()) {
      setShowPreview(true);
    }
  };

  // Get hardcoded options for list questions based on question title and context
  const getListOptions = (question: ManifolderQuestion): string[] => {
    const interventionValues = {
      satisfaction: ["satisfait", "peu_satisfait", "non_satisfait"],
      piece: ["model", "serie", "mark", "situation"]
    };
    
    const suiviValues = {
      equipe: ["maçons", "ferrailleurs", "coffreurs"],
      engins_utilises: ["bétonnière", "grue", "vibrateur", "coffrage_métallique"],
      meteo: ["soleil", "risque_pluie", "beau_temps"]
    };

    // Normalize question title to match the keys
    const normalizedTitle = question.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check intervention context
    if (question.context === 'intervention') {
      if (interventionValues[normalizedTitle as keyof typeof interventionValues]) {
        return interventionValues[normalizedTitle as keyof typeof interventionValues];
      }
    }
    
    // Check suivi context
    if (question.context === 'suivi') {
      if (suiviValues[normalizedTitle as keyof typeof suiviValues]) {
        return suiviValues[normalizedTitle as keyof typeof suiviValues];
      }
    }
    
    // Fallback: return empty array if no match found
    return [];
  };

  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            value={value || ''}
            onChangeText={handleValueChange}
            placeholder={question.placeholder || 'Enter your answer...'}
            multiline
            numberOfLines={3}
          />
        );

      case 'long_text':
        return (
          <TextInput
            style={styles.longTextInput}
            value={value || ''}
            onChangeText={handleValueChange}
            placeholder={question.placeholder || 'Enter your detailed answer...'}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
        );

      case 'number':
        return (
          <TextInput
            style={styles.textInput}
            value={value?.toString() || ''}
            onChangeText={(text) => {
              const numValue = parseFloat(text);
              handleValueChange(isNaN(numValue) ? '' : numValue);
            }}
            placeholder={question.placeholder || 'Enter a number...'}
            keyboardType="numeric"
          />
        );

      case 'taux':
        return (
          <View style={styles.tauxContainer}>
            <TextInput
              style={styles.tauxInput}
              value={value?.toString() || ''}
              onChangeText={(text) => {
                const numValue = parseFloat(text);
                if (isNaN(numValue)) {
                  handleValueChange('');
                } else if (numValue >= 0 && numValue <= 100) {
                  handleValueChange(numValue);
                }
                // If value is outside range, don't update (silently ignore)
              }}
              placeholder={question.placeholder || 'Enter percentage (0-100)...'}
              keyboardType="numeric"
              maxLength={5} // Allow up to 100.0
            />
            <Text style={styles.tauxUnit}>%</Text>
          </View>
        );

      case 'boolean':
        return (
          <View style={styles.booleanContainer}>
            <Text style={styles.booleanLabel}>
              {value ? 'Yes' : 'No'}
            </Text>
            <Switch
              value={Boolean(value)}
              onValueChange={handleValueChange}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        );

             case 'date':
         return (
           <View>
             <Pressable 
               style={styles.dateButton} 
               onPress={() => setShowDatePicker(true)}
             >
               <Text style={[styles.dateText, !value && styles.placeholderText]}>
                 {value ? formatDate(new Date(value)) : 'Select a date...'}
               </Text>
             </Pressable>
             <DateTimePickerModal
               isVisible={showDatePicker}
               mode="date"
               date={value ? new Date(value) : new Date()}
               onConfirm={(selectedDate) => {
                 setShowDatePicker(false);
                 if (selectedDate) {
                   handleValueChange(formatDate(selectedDate));
                 }
               }}
               onCancel={() => setShowDatePicker(false)}
             />
           </View>
         );

       case 'GPS':
         return (
           <MapSelector
             value={value && value.latitude && value.longitude ? {
               latitude: parseFloat(value.latitude),
               longitude: parseFloat(value.longitude)
             } : null}
             onLocationSelect={(latitude, longitude) => {
               // Handle clearing (when latitude/longitude are 0)
               if (latitude === 0 && longitude === 0) {
                 handleValueChange(null);
               } else {
                 handleValueChange({ latitude, longitude });
               }
             }}
             placeholder={question.placeholder || 'Select location on map...'}
           />
         );

      case 'file':
        return (
          <FileUploader
            value={value}
            onFileSelect={(file) => handleValueChange(file)}
            onFileRemove={() => handleValueChange(null)}
            placeholder={question.placeholder || 'Select a document...'}
            acceptedTypes={['document']}
          />
        );

      case 'photo':
        return (
          <FileUploader
            value={value}
            onFileSelect={(file) => handleValueChange(file)}
            onFileRemove={() => handleValueChange(null)}
            placeholder={question.placeholder || 'Select an image...'}
            acceptedTypes={['image']}
          />
        );

             case 'video':
         return (
           <FileUploader
             value={value}
             onFileSelect={(file) => handleValueChange(file)}
             onFileRemove={() => handleValueChange(null)}
             placeholder={question.placeholder || 'Select a video...'}
             acceptedTypes={['video']}
           />
         );

       case 'voice':
         return (
           <VoiceRecorder
             value={value}
             onFileSelect={(file) => handleValueChange(file)}
             onFileRemove={() => handleValueChange(null)}
             placeholder={question.placeholder || 'Record voice message...'}
             maxDuration={300} // 5 minutes
           />
         );

      case 'list':
        return (
          <View style={styles.listContainer}>
            {getListOptions(question).map((option: string, index: number) => (
              <Pressable
                key={index}
                style={[
                  styles.listOption,
                  value === option && styles.listOptionSelected
                ]}
                onPress={() => handleValueChange(option)}
              >
                <Text style={[
                  styles.listOptionText,
                  value === option && styles.listOptionTextSelected
                ]}>
                  {option}
                </Text>
                {value === option && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color="#007AFF" 
                    style={styles.listOptionIcon}
                  />
                )}
              </Pressable>
            ))}
          </View>
        );

      default:
        return (
          <View style={styles.unsupportedContainer}>
            <Text style={styles.unsupportedText}>
              Question type &quot;{question.type}&quot; is not supported yet
            </Text>
          </View>
        );
    }
  };

  const getSupportedTypes = (): QuestionType[] => ['text', 'long_text', 'number', 'date', 'boolean', 'GPS', 'file', 'photo', 'video', 'voice', 'taux', 'list'];
  const isSupported = getSupportedTypes().includes(question.type);

  if (!isSupported) {
    return null; // Hide unsupported question types for now
  }

  // Get preview media info
  const previewMedia = getPreviewMedia();

  // Check if question is answered
  const isAnswered = () => {
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
  };

  return (
    <>
      <View style={[styles.container, isAnswered() && styles.containerAnswered]}>
        {/* Question Header - Always Visible */}
        <Pressable
          style={styles.questionHeader}
          onPress={() => onToggleExpand(question.id)}
          accessibilityRole="button"
          accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} question: ${question.title}`}
        >
          <View style={styles.questionTitleContainer}>
            <Text style={styles.questionTitle}>{question.title}</Text>
            {question.required && <Text style={styles.requiredIndicator}>*</Text>}
          </View>
          
          <View style={styles.headerActions}>
            {/* Copy Button */}
            {onCopyQuestion && (
              <Pressable
                style={styles.copyButton}
                onPress={() => onCopyQuestion(question.id)}
                accessibilityRole="button"
                accessibilityLabel="Copy question"
              >
                <Ionicons 
                  name="copy-outline" 
                  size={20} 
                  color="#8E8E93" 
                />
                
              </Pressable>
              
            )}
            
            {/* Refresh Button */}
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                // TODO: Implement refresh functionality
                console.log('Reset button pressed for question:', question.id);
              }}
              accessibilityRole="button"
              accessibilityLabel="Reset question"
            >
              <Ionicons 
                name="refresh-circle-outline" 
                size={16} 
                color="#8E8E93" 
              />
            </Pressable>
            
            {/* Camera Button */}
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                // TODO: Implement camera functionality
                console.log('Camera button pressed for question:', question.id);
              }}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
            >
              <Ionicons 
                name="camera-outline" 
                size={16} 
                color="#8E8E93" 
              />
            </Pressable>

            {/* vocal Button */}
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                // TODO: Implement camera functionality
                console.log('mic button pressed for question:', question.id);
              }}
              accessibilityRole="button"
              accessibilityLabel="record voice"
            >
              <Ionicons 
                name="mic-outline" 
                size={16} 
                color="#8E8E93" 
              />
            </Pressable>
            
            {/* Preview Button */}
            {hasPreviewableMedia() && (
              <Pressable
                style={styles.previewButton}
                onPress={handlePreviewPress}
                accessibilityRole="button"
                accessibilityLabel="Preview media"
              >
                <Ionicons 
                  name="eye-outline" 
                  size={16} 
                  color="#8E8E93" 
                />
              </Pressable>
            )}
            
            {/* Chevron */}
            <Animated.View
              style={[
                styles.chevronContainer,
                {
                  transform: [
                    {
                      rotate: animatedHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.chevron}>▼</Text>
            </Animated.View>
          </View>
        </Pressable>

        {/* Answer Section - Expandable */}
        {isExpanded && (
          <Animated.View
            style={[
              styles.answerSection,
              {
                opacity: animatedHeight,
                transform: [
                  {
                    translateY: animatedHeight.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Quantity Input - Only show if question has quantity enabled */}
            {question.quantity && (
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Quantity:</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity?.toString() || ''}
                    onChangeText={(text) => {
                      const numValue = parseInt(text);
                      if (text === '') {
                        handleValueChange(value, undefined);
                      } else if (!isNaN(numValue) && numValue >= 0) {
                        handleValueChange(value, numValue);
                      }
                      // If value is invalid, don't update (silently ignore)
                    }}
                    placeholder="Enter quantity..."
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              )}

            {/* Zone Selection */}
            <View style={styles.zoneContainer}>
              <Text style={styles.zoneLabel}>Zone:</Text>
              <Pressable 
                style={styles.zonePickerContainer}
                onPress={() => setShowZoneModal(true)}
              >
                <Text style={styles.zonePickerText}>
                  {availableZones.find(z => z.id === questionZoneId)?.title || 'Select Zone'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8E8E93" />
              </Pressable>
            </View>
            {question.description && (
              <Text style={styles.questionDescription}>{question.description}</Text>
            )}
            
            <View style={styles.inputContainer}>
              {renderInput()}
              
              
            </View>
          </Animated.View>
        )}
      </View>

      {/* Preview Modal */}
      <PreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        mediaUrl={previewMedia?.url}
        mediaType={previewMedia?.type}
        title={question.title}
      />

      {/* Zone Selection Modal */}
      <Modal
        visible={showZoneModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowZoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Zone</Text>
              <Pressable onPress={() => setShowZoneModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </Pressable>
            </View>
            <FlatList
              data={availableZones}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.zoneOption,
                    item.id === questionZoneId && styles.zoneOptionSelected
                  ]}
                  onPress={() => {
                    handleZoneChange(item.id);
                    setShowZoneModal(false);
                  }}
                >
                  <Text style={[
                    styles.zoneOptionText,
                    item.id === questionZoneId && styles.zoneOptionTextSelected
                  ]}>
                    {item.title} ({item.code})
                  </Text>
                  {item.id === questionZoneId && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#f87b1b',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  containerAnswered: {
    backgroundColor: '#F0FDF4',
    borderColor: '#34C759',
    borderWidth: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  questionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    lineHeight: 22,
  },
  requiredIndicator: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  chevronContainer: {
    padding: 4,
  },
  chevron: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  answerSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  questionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  inputContainer: {
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FAFAFA',
    textAlignVertical: 'top',
    minHeight: 44,
  },
  longTextInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FAFAFA',
    textAlignVertical: 'top',
    minHeight: 120,
    maxHeight: 200,
  },
  booleanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  booleanLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    minHeight: 44,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  placeholderText: {
    color: '#8E8E93',
  },
  unsupportedContainer: {
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignItems: 'center',
  },
  unsupportedText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  tauxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tauxInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FAFAFA',
    minHeight: 44,
    marginRight: 8,
  },
  tauxUnit: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
    minWidth: 20,
  },
  quantityContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    marginRight: 12,
    minWidth: 70,
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FAFAFA',
    minHeight: 44,
  },
  zoneContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    marginRight: 12,
    minWidth: 50,
  },
  zonePickerContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  zonePickerText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  zonePicker: {
    height: 40,
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
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  zoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  zoneOptionSelected: {
    backgroundColor: '#F0F8FF',
  },
  zoneOptionText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  zoneOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  listContainer: {
    gap: 8,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    minHeight: 44,
  },
  listOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  listOptionText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
  },
  listOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  listOptionIcon: {
    marginLeft: 8,
  },
  noOptionsText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
