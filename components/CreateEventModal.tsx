import { useAuth } from '@/contexts/AuthContext';
import calendarService, { CreateEventData } from '@/services/calendarService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (eventData: CreateEventData) => void;
  selectedDate?: Date;
}

export interface EventData {
  context: string;
  title: string;
  description: string;
  date: string;
  heur_debut?: string;
  heur_fin?: string;
}

// Context options as defined in calendar_module.md
const CONTEXT_OPTIONS = [
  { value: 'declaration_anomalie', label: 'Déclaration d\'anomalies', icon: 'warning-outline' },
  { value: 'action_corrective', label: 'Actions correctives', icon: 'construct-outline' },
  { value: 'audit_zone', label: 'Audit de zone', icon: 'search-outline' },
  { value: 'prelevement_echantillon', label: 'Prélèvement d\'échantillons', icon: 'flask-outline' },
  { value: 'inventaire_article', label: 'Inventaire / Article', icon: 'list-outline' },
];

export default function CreateEventModal({ visible, onClose, onSubmit, selectedDate }: CreateEventModalProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EventData>({
    context: '',
    title: '',
    description: '',
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    heur_debut: '',
    heur_fin: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Helper functions for date handling
  const toISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (iso?: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  const resetForm = () => {
    setFormData({
      context: '',
      title: '',
      description: '',
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      heur_debut: '',
      heur_fin: '',
    });
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const validateForm = (): boolean => {
    if (!formData.context) {
      Alert.alert('Error', 'Please select a context');
      return false;
    }
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (!formData.date) {
      Alert.alert('Error', 'Please select a date');
      return false;
    }

    // Validate time range if both times are provided
    if (formData.heur_debut && formData.heur_fin) {
      const startTime = new Date(`2000-01-01T${formData.heur_debut}`);
      const endTime = new Date(`2000-01-01T${formData.heur_fin}`);
      if (startTime >= endTime) {
        Alert.alert('Error', 'End time must be after start time');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!token) {
      Alert.alert('Error', 'Authentication required. Please log in again.');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for backend (remove empty strings for optional fields)
      const eventData: CreateEventData = {
        context: formData.context,
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        ...(formData.heur_debut && { heur_debut: formData.heur_debut }),
        ...(formData.heur_fin && { heur_fin: formData.heur_fin }),
      };

      // Send to backend
      const response = await calendarService.createEvent(token, eventData);
      
      console.log('Event created successfully:', response);
      
      // Call the parent onSubmit with the created event data
      onSubmit(eventData);
      
      // Show success message
      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: handleClose }
      ]);

    } catch (error: any) {
      console.error('Failed to create event:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to create event. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isLoading}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Context Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Context *</Text>
            <View style={styles.contextGrid}>
              {CONTEXT_OPTIONS.map((context) => (
                <TouchableOpacity
                  key={context.value}
                  style={[
                    styles.contextOption,
                    formData.context === context.value && styles.contextOptionSelected
                  ]}
                  onPress={() => !isLoading && setFormData(prev => ({ ...prev, context: context.value }))}
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={context.icon as any} 
                    size={24} 
                    color={formData.context === context.value ? '#FFFFFF' : '#007AFF'} 
                  />
                  <Text style={[
                    styles.contextLabel,
                    formData.context === context.value && styles.contextLabelSelected
                  ]}>
                    {context.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Title *</Text>
            <TextInput
              style={[styles.input, isLoading && styles.inputDisabled]}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Enter event title"
              placeholderTextColor="#8E8E93"
              editable={!isLoading}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, isLoading && styles.inputDisabled]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter event description"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date *</Text>
            <TouchableOpacity
              style={[styles.dateInput, isLoading && styles.inputDisabled]}
              onPress={() => !isLoading && setShowDatePicker(true)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
              <Text style={[styles.dateText, !formData.date && styles.placeholderText]}>
                {formData.date ? formatDisplayDate(formData.date) : 'Select date'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Start Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Start Time</Text>
            <TouchableOpacity
              style={[styles.dateInput, isLoading && styles.inputDisabled]}
              onPress={() => !isLoading && setShowStartTimePicker(true)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={18} color="#8E8E93" />
              <Text style={[styles.dateText, !formData.heur_debut && styles.placeholderText]}>
                {formData.heur_debut ? formatTime(formData.heur_debut) : 'Select start time'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* End Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>End Time</Text>
            <TouchableOpacity
              style={[styles.dateInput, isLoading && styles.inputDisabled]}
              onPress={() => !isLoading && setShowEndTimePicker(true)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={18} color="#8E8E93" />
              <Text style={[styles.dateText, !formData.heur_fin && styles.placeholderText]}>
                {formData.heur_fin ? formatTime(formData.heur_fin) : 'Select end time'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Date/Time Pickers */}
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          date={formData.date ? new Date(formData.date) : new Date()}
          onConfirm={(selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setFormData(prev => ({
                ...prev,
                date: toISODate(selectedDate)
              }));
            }
          }}
          onCancel={() => setShowDatePicker(false)}
        />

        <DateTimePickerModal
          isVisible={showStartTimePicker}
          mode="time"
          date={formData.heur_debut ? new Date(`2000-01-01T${formData.heur_debut}`) : new Date()}
          onConfirm={(selectedTime) => {
            setShowStartTimePicker(false);
            if (selectedTime) {
              const timeString = selectedTime.toTimeString().slice(0, 5); // HH:MM format
              setFormData(prev => ({
                ...prev,
                heur_debut: timeString
              }));
            }
          }}
          onCancel={() => setShowStartTimePicker(false)}
        />

        <DateTimePickerModal
          isVisible={showEndTimePicker}
          mode="time"
          date={formData.heur_fin ? new Date(`2000-01-01T${formData.heur_fin}`) : new Date()}
          onConfirm={(selectedTime) => {
            setShowEndTimePicker(false);
            if (selectedTime) {
              const timeString = selectedTime.toTimeString().slice(0, 5); // HH:MM format
              setFormData(prev => ({
                ...prev,
                heur_fin: timeString
              }));
            }
          }}
          onCancel={() => setShowEndTimePicker(false)}
        />
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  saveButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contextOption: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  contextOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1C1C1E',
    marginTop: 8,
    textAlign: 'center',
  },
  contextLabelSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  textArea: {
    height: 100,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    color: '#1C1C1E',
    fontSize: 14,
  },
  placeholderText: {
    color: '#8E8E93',
  },
});
