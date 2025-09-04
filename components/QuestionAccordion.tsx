import API_CONFIG from '@/app/config/api';
import { ManifolderQuestion, QuestionType } from '@/types/manifolder';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Animated,
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
  onValueChange: (questionId: string, value: any) => void;
  isExpanded?: boolean;
  onToggleExpand: (questionId: string) => void;
}

export default function QuestionAccordion({
  question,
  value,
  onValueChange,
  isExpanded = false,
  onToggleExpand,
}: QuestionAccordionProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [animatedHeight] = useState(new Animated.Value(0));
  const [showPreview, setShowPreview] = useState(false);

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const handleValueChange = (newValue: any) => {
    onValueChange(question.id, newValue);
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

  const getSupportedTypes = (): QuestionType[] => ['text', 'number', 'date', 'boolean', 'GPS', 'file', 'photo', 'video', 'voice', 'taux'];
  const isSupported = getSupportedTypes().includes(question.type);

  if (!isSupported) {
    return null; // Hide unsupported question types for now
  }

  // Get preview media info
  const previewMedia = getPreviewMedia();

  return (
    <>
      <View style={styles.container}>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
});
