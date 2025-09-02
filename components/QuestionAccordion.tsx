import { ManifolderQuestion, QuestionType } from '@/types/manifolder';
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
import MapSelector from './MapSelector';

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

      default:
        return (
          <View style={styles.unsupportedContainer}>
            <Text style={styles.unsupportedText}>
              Question type "{question.type}" is not supported yet
            </Text>
          </View>
        );
    }
  };

  const getSupportedTypes = (): QuestionType[] => ['text', 'number', 'date', 'boolean', 'GPS'];
  const isSupported = getSupportedTypes().includes(question.type);

  if (!isSupported) {
    return null; // Hide unsupported question types for now
  }

  return (
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
});
