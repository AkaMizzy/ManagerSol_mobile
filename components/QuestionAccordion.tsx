import { ICONS } from '@/constants/Icons';
import { ManifolderQuestion, QuestionType, Zone } from '@/types/manifolder';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import FileUploader from './FileUploader';
import MapSelector from './MapSelector';
import PreviewModal from './PreviewModal';

interface QuestionAccordionProps {
  question: ManifolderQuestion;
  value?: any;
  quantity?: number;
  selectedZoneId?: string;
  selectedStatus?: number;
  availableZones: Zone[];
  defaultZoneId: string;
  manifolderId: string;
  onValueChange: (questionId: string, value: any, quantity?: number, zoneId?: string, status?: number) => void;
  isExpanded?: boolean;
  onToggleExpand: (questionId: string) => void;
  onCopyQuestion?: (questionId: string, manifolderId: string) => void;
  onResetQuestion?: (questionId: string) => void;
  onSubmitAnswer?: (questionId: string) => void;
  onCreateDeclaration?: (questionId: string) => void;
  isSubmitting?: boolean;
  isSubmitted?: boolean;
  hasBeenSubmitted?: boolean; // Track if this question was ever submitted before
  isLocked?: boolean; // Track if questions are locked due to signature completion
  vocalAnswer?: any;
  onVocalFileSelect?: (file: { uri: string; name: string; type: string }) => void;
  onVocalFileRemove?: () => void;
  imageAnswer?: any;
  onImageFileSelect?: (file: { uri: string; name: string; type: string }) => void;
  onImageFileRemove?: () => void;
  onEnhanceText?: (questionId: string, text: string) => void;
  isEnhancing?: boolean;
  onTranscribeAudio?: (questionId: string, audioUri: string) => void;
  isTranscribing?: boolean;
}

export default function QuestionAccordion({
  question,
  value,
  quantity,
  selectedZoneId,
  availableZones,
  defaultZoneId,
  manifolderId,
  onValueChange,
  isExpanded = false,
  onToggleExpand,
  onCopyQuestion,
  onResetQuestion,
  onSubmitAnswer,
  onCreateDeclaration,
  isSubmitting = false,
  isSubmitted = false,
  hasBeenSubmitted = false,
  isLocked = false,
  vocalAnswer,
  onVocalFileSelect,
  onVocalFileRemove,
  imageAnswer,
  onImageFileSelect,
  onImageFileRemove,
  onEnhanceText,
  isEnhancing = false,
  onTranscribeAudio,
  isTranscribing = false,
}: QuestionAccordionProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [animatedHeight] = useState(new Animated.Value(0));
  const [showPreview, setShowPreview] = useState(false);
  const [questionZoneId, setQuestionZoneId] = useState(selectedZoneId || defaultZoneId);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // States for voice question type
  const [valueSound, setValueSound] = useState<Audio.Sound | null>(null);
  const [isValueRecording, setIsValueRecording] = useState(false);
  const [isValuePlaying, setIsValuePlaying] = useState(false);
  const [valueRecordingDuration, setValueRecordingDuration] = useState(0);
  const valueDurationIntervalRef = useRef<any>(null);
  const [isValueTranscribed, setIsValueTranscribed] = useState(false);

  // States for vocal attachment
  const [vocalAnswerSound, setVocalAnswerSound] = useState<Audio.Sound | null>(null);
  const [isVocalAnswerRecording, setIsVocalAnswerRecording] = useState(false);
  const [isVocalAnswerPlaying, setIsVocalAnswerPlaying] = useState(false);
  const [vocalAnswerRecordingDuration, setVocalAnswerRecordingDuration] = useState(0);
  const vocalAnswerDurationIntervalRef = useRef<any>(null);
  const [isVocalAnswerTranscribed, setIsVocalAnswerTranscribed] = useState(false); 
  const [showVocalAnswerRecorder, setShowVocalAnswerRecorder] = useState(false);


  // Tooltip state for compact labels
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState<string | null>(null);
  const [tooltipAnim] = useState(new Animated.Value(0));
  let tooltipTimer: ReturnType<typeof setTimeout> | null = null;

  const showInfo = (text?: string) => {
    if (!text) return;
    if (tooltipTimer) clearTimeout(tooltipTimer);
    setTooltipText(text);
    setTooltipVisible(true);
    tooltipAnim.setValue(0);
    Animated.timing(tooltipAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    tooltipTimer = setTimeout(() => hideInfo(), 2500);
  };

  const hideInfo = () => {
    Animated.timing(tooltipAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setTooltipVisible(false);
      setTooltipText(null);
    });
  };

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, animatedHeight]);

  function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  async function startRecording(type: 'value' | 'vocalAnswer') {
      try {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Microphone access is required to record audio.');
              return;
          }
          await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
          const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
          setRecording(newRecording);
          
          if (type === 'value') {
              setIsValueRecording(true);
              valueDurationIntervalRef.current = setInterval(() => {
                  setValueRecordingDuration(prev => prev + 1);
              }, 1000);
          } else {
              setIsVocalAnswerRecording(true);
              vocalAnswerDurationIntervalRef.current = setInterval(() => {
                  setVocalAnswerRecordingDuration(prev => prev + 1);
              }, 1000);
          }
      } catch (err) {
          console.error('Failed to start recording', err);
      }
  }

  async function stopRecording(type: 'value' | 'vocalAnswer') {
      if (!recording) return;

      if (type === 'value') {
          setIsValueRecording(false);
          if (valueDurationIntervalRef.current) clearInterval(valueDurationIntervalRef.current);
      } else {
          setIsVocalAnswerRecording(false);
          if (vocalAnswerDurationIntervalRef.current) clearInterval(vocalAnswerDurationIntervalRef.current);
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
          const file = { uri, name: `voicenote-${Date.now()}.m4a`, type: 'audio/m4a' };
          if (type === 'value') {
              handleValueChange(file);
              setIsValueTranscribed(false);
          } else {
              if (onVocalFileSelect) onVocalFileSelect(file);
              setIsVocalAnswerTranscribed(false);
          }
      }

      if (type === 'value') {
          setValueRecordingDuration(0);
      } else {
          setVocalAnswerRecordingDuration(0);
      }
      setRecording(null);
  }

  async function playSound(type: 'value' | 'vocalAnswer') {
    const voiceNote = type === 'value' ? value : vocalAnswer;
    const sound = type === 'value' ? valueSound : vocalAnswerSound;
    const isPlaying = type === 'value' ? isValuePlaying : isVocalAnswerPlaying;
    const setSound = type === 'value' ? setValueSound : setVocalAnswerSound;
    const setIsPlaying = type === 'value' ? setIsValuePlaying : setIsVocalAnswerPlaying;

    if (!voiceNote || !voiceNote.uri) return;
    if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
        return;
    }
    if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
        return;
    }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri: voiceNote.uri });
    setSound(newSound);
    setIsPlaying(true);
    newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            newSound.setPositionAsync(0);
        }
    });
    await newSound.playAsync();
  }

  const resetVoiceNote = (type: 'value' | 'vocalAnswer') => {
    if (type === 'value') {
        if (valueSound) valueSound.unloadAsync();
        handleValueChange(null);
        setValueSound(null);
        setIsValuePlaying(false);
        setIsValueTranscribed(false);
    } else {
        if (vocalAnswerSound) vocalAnswerSound.unloadAsync();
        if (onVocalFileRemove) onVocalFileRemove();
        setVocalAnswerSound(null);
        setIsVocalAnswerPlaying(false);
        setIsVocalAnswerTranscribed(false);
    }
  };

  const handleTranscribe = (type: 'value' | 'vocalAnswer') => {
      const voiceNote = type === 'value' ? value : vocalAnswer;
      const setIsTranscribed = type === 'value' ? setIsValueTranscribed : setIsVocalAnswerTranscribed;

      if (!voiceNote || !voiceNote.uri) {
          Alert.alert('Erreur', 'Aucune note vocale à transcrire.');
          return;
      }
      if (onTranscribeAudio) {
          onTranscribeAudio(question.id, voiceNote.uri);
          setIsTranscribed(true);
      }
  };

  React.useEffect(() => {
    return valueSound ? () => { valueSound.unloadAsync(); } : undefined;
  }, [valueSound]);

  React.useEffect(() => {
    return vocalAnswerSound ? () => { vocalAnswerSound.unloadAsync(); } : undefined;
  }, [vocalAnswerSound]);

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

  const handleCameraCapture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = `camera_${Date.now()}.jpg`;
        
        if (onImageFileSelect) {
            onImageFileSelect({
                uri: asset.uri,
                name: fileName,
                type: 'image/jpeg',
            });
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to capture photo');
    }
    setShowCameraModal(false);
  };

  const handleGalleryPick = async () => {
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
        
        if (onImageFileSelect) {
            onImageFileSelect({
                uri: asset.uri,
                name: fileName,
                type: fileType,
            });
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
    setShowCameraModal(false);
  };

  const handleImagePreview = () => {
    if (imageAnswer && (imageAnswer.path || imageAnswer.uri)) {
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
          <View style={styles.inputContainer}>
            <View style={styles.inputWithInfo}>
              <TextInput
                style={styles.textInput}
                value={value || ''}
                onChangeText={handleValueChange}
                placeholder={question.placeholder || 'Enter your answer...'}
                multiline
                numberOfLines={3}
              />
              {!!question.description && (
                <Pressable
                  onPress={() => showInfo(question.description ?? undefined)}
                  accessibilityRole="button"
                  accessibilityLabel="Show field info"
                  style={styles.infoIcon}
                >
                  <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                </Pressable>
              )}
              {tooltipVisible && tooltipText && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.tooltip,
                    {
                      opacity: tooltipAnim,
                      transform: [{ translateY: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
                    },
                  ]}
                >
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </Animated.View>
              )}
            </View>
          </View>
        );

      case 'long_text':
        return (
          <View style={styles.inputContainer}>
            <View style={styles.longTextInputContainer}>
              <TextInput
                style={styles.longTextInput}
                value={value || ''}
                onChangeText={handleValueChange}
                placeholder={question.placeholder || 'Enter your detailed answer...'}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
              {onEnhanceText && (
                <Pressable
                  onPress={() => onEnhanceText(question.id, value)}
                  style={styles.enhanceButton}
                  disabled={isEnhancing || !value}
                  accessibilityRole="button"
                  accessibilityLabel="Enhance text"
                >
                  <Ionicons name="sparkles-outline" size={24} color={isEnhancing ? '#fbbf24' : '#f87b1b'} />
                </Pressable>
              )}
              {!!question.description && (
                <Pressable
                  onPress={() => showInfo(question.description ?? undefined)}
                  accessibilityRole="button"
                  accessibilityLabel="Show field info"
                  style={[styles.infoIcon, { right: 44 }]}
                >
                  <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                </Pressable>
              )}
              {tooltipVisible && tooltipText && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.tooltip,
                    {
                      opacity: tooltipAnim,
                      transform: [{ translateY: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
                    },
                  ]}
                >
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </Animated.View>
              )}
            </View>
          </View>
        );

      case 'number':
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputWithInfo}>
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
              {!!question.description && (
                <Pressable onPress={() => showInfo(question.description ?? undefined)} accessibilityRole="button" accessibilityLabel="Show field info" style={styles.infoIcon}>
                  <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                </Pressable>
              )}
              {tooltipVisible && tooltipText && (
                <Animated.View pointerEvents="none" style={[styles.tooltip, { opacity: tooltipAnim, transform: [{ translateY: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </Animated.View>
              )}
            </View>
          </View>
        );

      case 'taux':
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputWithInfo}>
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
                  }}
                  placeholder={question.placeholder || 'Enter percentage (0-100)...'}
                  keyboardType="numeric"
                  maxLength={5}
                />
                <Text style={styles.tauxUnit}>%</Text>
              </View>
              {!!question.description && (
                <Pressable onPress={() => showInfo(question.description ?? undefined)} accessibilityRole="button" accessibilityLabel="Show field info" style={styles.infoIcon}>
                  <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                </Pressable>
              )}
              {tooltipVisible && tooltipText && (
                <Animated.View pointerEvents="none" style={[styles.tooltip, { opacity: tooltipAnim, transform: [{ translateY: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </Animated.View>
              )}
            </View>
          </View>
        );

      case 'boolean':
        return (
          <View style={styles.inputContainer}>
            <View style={[styles.inputWithInfo, { paddingTop: 6 }] }>
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
              {!!question.description && (
                <Pressable onPress={() => showInfo(question.description ?? undefined)} accessibilityRole="button" accessibilityLabel="Show field info" style={styles.infoIcon}>
                  <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                </Pressable>
              )}
              {tooltipVisible && tooltipText && (
                <Animated.View pointerEvents="none" style={[styles.tooltip, { opacity: tooltipAnim, transform: [{ translateY: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </Animated.View>
              )}
            </View>
          </View>
        );

      case 'date':
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputWithInfo}>
              <Pressable 
                style={styles.dateButton} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateText, !value && styles.placeholderText]}>
                  {value ? formatDate(new Date(value)) : 'Select a date...'}
                </Text>
              </Pressable>
              {!!question.description && (
                <Pressable onPress={() => showInfo(question.description ?? undefined)} accessibilityRole="button" accessibilityLabel="Show field info" style={styles.infoIcon}>
                  <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                </Pressable>
              )}
              {tooltipVisible && tooltipText && (
                <Animated.View pointerEvents="none" style={[styles.tooltip, { opacity: tooltipAnim, transform: [{ translateY: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </Animated.View>
              )}
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
          </View>
        );

      case 'GPS':
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputWithInfo}>
              <MapSelector
                value={value && value.latitude && value.longitude ? {
                  latitude: parseFloat(value.latitude),
                  longitude: parseFloat(value.longitude)
                } : null}
                onLocationSelect={(latitude, longitude) => {
                  if (latitude === 0 && longitude === 0) {
                    handleValueChange(null);
                  } else {
                    handleValueChange({ latitude, longitude });
                  }
                }}
                placeholder={question.placeholder || 'Select location on map...'}
              />
              {!!question.description && (
                <Pressable onPress={() => showInfo(question.description ?? undefined)} accessibilityRole="button" accessibilityLabel="Show field info" style={styles.infoIcon}>
                  <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                </Pressable>
              )}
              {tooltipVisible && tooltipText && (
                <Animated.View pointerEvents="none" style={[styles.tooltip, { opacity: tooltipAnim, transform: [{ translateY: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </Animated.View>
              )}
            </View>
          </View>
        );

      case 'file':
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputWithInfo}>
              <FileUploader
                value={value}
                onFileSelect={(file) => handleValueChange(file)}
                onFileRemove={() => handleValueChange(null)}
                placeholder={question.placeholder || 'Select a document...'}
                acceptedTypes={['document']}
              />
              {!!question.description && (
                <Pressable onPress={() => showInfo(question.description ?? undefined)} accessibilityRole="button" accessibilityLabel="Show field info" style={styles.infoIcon}>
                  <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                </Pressable>
              )}
              {tooltipVisible && tooltipText && (
                <Animated.View pointerEvents="none" style={[styles.tooltip, { opacity: tooltipAnim, transform: [{ translateY: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </Animated.View>
              )}
            </View>
          </View>
        );

      case 'photo':
      case 'video':
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputWithInfo}>
              <FileUploader
                value={imageAnswer}
                onFileSelect={(file) => {
                    if (onImageFileSelect) onImageFileSelect(file);
                }}
                onFileRemove={() => {
                    if (onImageFileRemove) onImageFileRemove();
                }}
                placeholder={question.placeholder || 'Select an image...'}
                acceptedTypes={question.type === 'photo' ? ['image'] : question.type === 'video' ? ['video'] : ['document']}
              />
              {!!question.description && (
                <Pressable onPress={() => showInfo(question.description ?? undefined)} accessibilityRole="button" accessibilityLabel="Show field info" style={styles.infoIcon}>
                  <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                </Pressable>
              )}
              {tooltipVisible && tooltipText && (
                <Animated.View pointerEvents="none" style={[styles.tooltip, { opacity: tooltipAnim, transform: [{ translateY: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </Animated.View>
              )}
            </View>
          </View>
        );

      case 'voice':
        return (
          <View style={styles.inputContainer}>
            <View style={styles.voiceNoteContainer}>
                {isValueRecording ? (
                    <View style={styles.recordingWrap}>
                        <Text style={styles.recordingText}>Enregistrement... {formatDuration(valueRecordingDuration)}</Text>
                        <TouchableOpacity style={styles.stopButton} onPress={() => stopRecording('value')}>
                            <Ionicons name="stop-circle" size={24} color="#dc2626" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.voiceActionsContainer}>
                        {value && value.uri ? (
                            <View style={styles.audioPlayerWrap}>
                                <TouchableOpacity style={styles.playButton} onPress={() => playSound('value')}>
                                    <Ionicons name={isValuePlaying ? 'pause-circle' : 'play-circle'} size={28} color="#11224e" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.deleteButton, isValueTranscribed && styles.buttonDisabled]} onPress={() => resetVoiceNote('value')} disabled={isValueTranscribed}>
                                    <Ionicons name="trash-outline" size={20} color={isValueTranscribed ? '#9ca3af' : '#dc2626'} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.voiceRecordButton} onPress={() => startRecording('value')}>
                                <View style={styles.buttonContentWrapper}>
                                    <Ionicons name="mic-outline" size={24} color="#11224e" />
                                </View>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.voiceRecordButton,
                                styles.transcribeButton,
                                (!value || !value.uri || isTranscribing) && styles.buttonDisabled,
                            ]}
                            onPress={() => handleTranscribe('value')}
                            disabled={!value || !value.uri || isTranscribing}
                        >
                            {isTranscribing ? (
                                <ActivityIndicator size="small" color="#11224e" />
                            ) : (
                                <View style={styles.buttonContentWrapper}>
                                    <Ionicons name="volume-high-outline" size={25} color="#11224e" />
                                    <Ionicons name="arrow-forward-circle-outline" size={20} color="#11224e" />
                                    <Ionicons name="document-text-outline" size={20} color="#11224e" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
              {!!question.description && (
                <Pressable onPress={() => showInfo(question.description ?? undefined)} accessibilityRole="button" accessibilityLabel="Show field info" style={styles.infoIcon}>
                  <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                </Pressable>
              )}
              {tooltipVisible && tooltipText && (
                <Animated.View pointerEvents="none" style={[styles.tooltip, { opacity: tooltipAnim, transform: [{ translateY: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </Animated.View>
              )}
          </View>
        );

      case 'list':
        return (
          <View style={styles.inputContainer}>
            <View style={styles.inputWithInfo}>
              <Pressable 
                style={styles.listPickerContainer}
                onPress={() => setShowListModal(true)}
              >
                <Text style={[
                  styles.listPickerText,
                  !value && styles.listPickerPlaceholder
                ]}>
                  {value || question.placeholder || 'Tap to select an option...'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#8E8E93" />
              </Pressable>
              {!!question.description && (
                <Pressable onPress={() => showInfo(question.description ?? undefined)} accessibilityRole="button" accessibilityLabel="Show field info" style={styles.infoIcon}>
                  <Ionicons name="information-circle-outline" size={18} color="#8E8E93" />
                </Pressable>
              )}
              {tooltipVisible && tooltipText && (
                <Animated.View pointerEvents="none" style={[styles.tooltip, { opacity: tooltipAnim, transform: [{ translateY: tooltipAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
                  <Text style={styles.tooltipText}>{tooltipText}</Text>
                </Animated.View>
              )}
            </View>
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

  // Check if question is answered
  const isAnswered = () => {
    // If all possible answer types are empty, then it's not answered.
    if (
      (value === undefined || value === null || value === '') &&
      (vocalAnswer === undefined || vocalAnswer === null || vocalAnswer === '') &&
      (imageAnswer === undefined || imageAnswer === null || imageAnswer === '')
    ) {
      return false;
    }

    // For GPS answers, check if value is an object with valid coordinates
    if (value && typeof value === 'object' && value.latitude !== undefined && value.longitude !== undefined) {
      return value.latitude !== null && value.longitude !== null;
    }
    
    // For file answers, check if value is an object with a path
    if (value && typeof value === 'object' && value.path !== undefined) {
      return value.path !== null && value.path !== '';
    }

    // Check for a valid vocal answer object
    if (vocalAnswer && typeof vocalAnswer === 'object' && vocalAnswer.path !== undefined) {
        return vocalAnswer.path !== null && vocalAnswer.path !== '';
    }
    
    // Check for a valid image answer object
    if (imageAnswer && typeof imageAnswer === 'object' && (imageAnswer.path !== undefined || imageAnswer.uri !== undefined)) {
      return (imageAnswer.path !== null && imageAnswer.path !== '') || (imageAnswer.uri !== null && imageAnswer.uri !== '');
    }
    
    // If any of the answer types have a value, consider it answered.
    // This will correctly handle boolean `false` as a valid answer.
    if (value !== undefined && value !== null && value !== '') return true;
    if (vocalAnswer !== undefined && vocalAnswer !== null && vocalAnswer !== '') return true;
    if (imageAnswer !== undefined && imageAnswer !== null && imageAnswer !== '') return true;

    // Fallback for cases like an empty object for a file answer, which should be considered unanswered.
    return false;
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
            {isLocked && <Text style={styles.lockedIndicator}>🔒</Text>}
          </View>
          
          <View style={styles.headerActions}>
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
            {/* Question Input - Primary focus */}
            {renderInput()}

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
            {/* <View style={styles.zoneContainer}>
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
            </View> */}

            {/* Action Buttons - Only visible when expanded */}
            <View style={styles.actionButtonsContainer}>
              {/* Copy Button */}
              {onCopyQuestion && (
                <Pressable
                  style={[styles.copyButton, (isLocked || isSubmitting) && styles.actionButtonDisabled]}
                  onPress={() => onCopyQuestion(question.id, manifolderId)}
                  accessibilityRole="button"
                  accessibilityLabel="Copy question"
                  disabled={isLocked || isSubmitting}
                >
                  <Ionicons 
                    name="copy-outline" 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </Pressable>
              )}
              
              {/* Refresh Button */}
              <Pressable
                style={[styles.actionButton, (isLocked || isSubmitting) && styles.actionButtonDisabled]}
                onPress={() => {
                  if (onResetQuestion) {
                    onResetQuestion(question.id);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Reset question"
                disabled={isLocked || isSubmitting}
              >
                <Ionicons 
                  name="refresh-circle-outline" 
                  size={16} 
                  color="#FFFFFF" 
                />
              </Pressable>
              
              {/* Camera Button */}
              <Pressable
                style={[styles.actionButton, (isLocked || isSubmitting) && styles.actionButtonDisabled]}
                onPress={() => setShowCameraModal(true)}
                accessibilityRole="button"
                accessibilityLabel="Take photo"
                disabled={isLocked || isSubmitting}
              >
                <Image source={ICONS.cameraPng} style={{ width: 20, height: 20 }} />
              </Pressable>

              {/* Vocal Button */}
              <Pressable
                style={[styles.actionButton, (isLocked || isSubmitting) && styles.actionButtonDisabled]}
                onPress={() => setShowVocalAnswerRecorder(v => !v)}
                accessibilityRole="button"
                accessibilityLabel="record voice"
                disabled={isLocked || isSubmitting}
              >
                <Ionicons 
                  name="mic-outline" 
                  size={16} 
                  color="#FFFFFF" 
                />
              </Pressable>

              {imageAnswer && isSubmitted && (
                <Pressable
                  style={styles.actionButton}
                  onPress={handleImagePreview}
                  accessibilityRole="button"
                  accessibilityLabel="Preview image"
                >
                  <Ionicons 
                    name="eye-outline" 
                    size={16} 
                    color="#FFFFFF" 
                  />
                </Pressable>
              )}
            </View>

            {(showVocalAnswerRecorder || vocalAnswer) && (
              <View style={[styles.voiceNoteContainer, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F2F2F7' }]}>
                {isVocalAnswerRecording ? (
                    <View style={styles.recordingWrap}>
                        <Text style={styles.recordingText}>Enregistrement... {formatDuration(vocalAnswerRecordingDuration)}</Text>
                        <TouchableOpacity style={styles.stopButton} onPress={() => stopRecording('vocalAnswer')}>
                            <Ionicons name="stop-circle" size={24} color="#dc2626" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.voiceActionsContainer}>
                        {vocalAnswer && vocalAnswer.uri ? (
                            <View style={styles.audioPlayerWrap}>
                                <TouchableOpacity style={styles.playButton} onPress={() => playSound('vocalAnswer')}>
                                    <Ionicons name={isVocalAnswerPlaying ? 'pause-circle' : 'play-circle'} size={28} color="#11224e" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.deleteButton, isVocalAnswerTranscribed && styles.buttonDisabled]} onPress={() => resetVoiceNote('vocalAnswer')} disabled={isVocalAnswerTranscribed}>
                                    <Ionicons name="trash-outline" size={20} color={isVocalAnswerTranscribed ? '#9ca3af' : '#dc2626'} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.voiceRecordButton} onPress={() => startRecording('vocalAnswer')}>
                                <View style={styles.buttonContentWrapper}>
                                    <Ionicons name="mic-outline" size={24} color="#11224e" />
                                </View>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.voiceRecordButton,
                                styles.transcribeButton,
                                (!vocalAnswer || !vocalAnswer.uri || isTranscribing) && styles.buttonDisabled,
                            ]}
                            onPress={() => handleTranscribe('vocalAnswer')}
                            disabled={!vocalAnswer || !vocalAnswer.uri || isTranscribing}
                        >
                            {isTranscribing ? (
                                <ActivityIndicator size="small" color="#11224e" />
                            ) : (
                                <View style={styles.buttonContentWrapper}>
                                    <Ionicons name="volume-high-outline" size={25} color="#11224e" />
                                    <Ionicons name="arrow-forward-circle-outline" size={20} color="#11224e" />
                                    <Ionicons name="document-text-outline" size={20} color="#11224e" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
              </View>
            )}

            {imageAnswer && !isSubmitted && (
                <View style={styles.imagePreviewContainer}>
                    <Text style={styles.imagePreviewLabel}>Image Attachment:</Text>
                    <Image source={{ uri: imageAnswer.uri || imageAnswer.path }} style={styles.imagePreview} />
                    <Pressable onPress={onImageFileRemove} style={styles.removeImageButton}>
                        <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </Pressable>
                </View>
            )}

            {/* Submit Button - Only show if answer exists and not already submitted */}
            {isAnswered() && !isSubmitted && onSubmitAnswer && (
              <View style={styles.submitContainer}>
                <Pressable
                  style={[
                    styles.submitButton,
                    (isSubmitting || isLocked) && styles.submitButtonDisabled,
                  ]}
                  onPress={() => onSubmitAnswer(question.id)}
                  disabled={isSubmitting || isLocked}
                  accessibilityRole="button"
                  accessibilityLabel={isLocked ? "Answer locked - cannot submit" : "Submit this answer"}
                >
                  <Ionicons 
                    name={isSubmitting ? "hourglass-outline" : "checkmark-circle-outline"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.submitButtonText}>
                    {isLocked 
                      ? 'Locked' 
                      : isSubmitting 
                        ? 'Submitting...' 
                        : hasBeenSubmitted 
                          ? 'Update Answer' 
                          : 'Submit Answer'
                    }
                  </Text>
                </Pressable>
              </View>
            )}

           

            {/* Declaration Creation Button - Only show if answer is submitted and onCreateDeclaration is provided */}
            {isSubmitted && onCreateDeclaration && (
              <View style={styles.declarationContainer}>
                <Pressable
                  style={styles.declarationButton}
                  onPress={() => {
                    onCreateDeclaration(question.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Create declaration for this question"
                >
                  <Ionicons 
                    name="document-text-outline" 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.declarationButtonText}>
                    Create Declaration
                  </Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}
      </View>

      {/* Preview Modal */}
      <PreviewModal
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        mediaUrl={imageAnswer?.path || imageAnswer?.uri}
        mediaType={'image'}
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

      {/* Camera Selection Modal */}
      <Modal
        visible={showCameraModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Photo</Text>
              <Pressable onPress={() => setShowCameraModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </Pressable>
            </View>
            
            <View style={styles.cameraOptionsContainer}>
              <Pressable style={styles.cameraOption} onPress={handleGalleryPick}>
                <Ionicons name="images-outline" size={32} color="#007AFF" />
                <Text style={styles.cameraOptionText}>Choose from Gallery</Text>
              </Pressable>
              
              <Pressable style={styles.cameraOption} onPress={handleCameraCapture}>
                <Ionicons name="camera-outline" size={32} color="#007AFF" />
                <Text style={styles.cameraOptionText}>Take Photo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* List Selection Modal */}
      <Modal
        visible={showListModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Option</Text>
              <Pressable onPress={() => setShowListModal(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </Pressable>
            </View>
            <FlatList
              data={getListOptions(question)}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.listOption,
                    value === item && styles.listOptionSelected
                  ]}
                  onPress={() => {
                    handleValueChange(item);
                    setShowListModal(false);
                  }}
                >
                  <Text style={[
                    styles.listOptionText,
                    value === item && styles.listOptionTextSelected
                  ]}>
                    {item}
                  </Text>
                  {value === item && (
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
    justifyContent: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 24,
    textAlign: 'left',
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
    backgroundColor: '#f87b1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#f87b1b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  requiredIndicator: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  lockedIndicator: {
    fontSize: 16,
    marginLeft: 4,
    opacity: 0.7,
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
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 4,
    fontWeight: '400',
  },
  inputContainer: {
    marginTop: 8,
  },
  inputWithInfo: {
    position: 'relative',
  },
  inputLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
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
  longTextInputContainer: {
    position: 'relative',
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
    paddingRight: 50, // To avoid text overlapping with button
  },
  enhanceButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 5,
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
    fontSize: 18,
    color: '#1C1C1E',
    fontWeight: '600',
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
    marginTop: 8,
  },
  listLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 8,
  },
  listPickerContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listPickerText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    flex: 1,
  },
  listPickerPlaceholder: {
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  imagePreviewContainer: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  imagePreviewLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  voiceNoteContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
},
voiceNoteLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 8,
},
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  listOptionSelected: {
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
  cameraOptionsContainer: {
    paddingVertical: 20,
    gap: 16,
  },
  cameraOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  cameraOptionText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 16,
    fontWeight: '500',
  },
  voiceOptionsContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  submitContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  submitButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submittedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 8,
  },
  submittedText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
  },
  declarationContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  declarationButton: {
    backgroundColor: '#f87b1b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  declarationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 4,
    backgroundColor: 'transparent',
  },
  tooltip: {
    position: 'absolute',
    right: 10,
    top: -30,
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    maxWidth: '80%',
    zIndex: 10,
  },
  tooltipText: {
    color: '#F9FAFB',
    fontSize: 12,
  },
  voiceActionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceRecordButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f87b1b'
  },
  transcribeButton: {},
  buttonDisabled: { 
    opacity: 0.5, 
    backgroundColor: '#e5e7eb' 
  },
  buttonContentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  recordingWrap: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fef2f2', 
    padding: 12, 
    borderRadius: 10 
  },
  recordingText: { 
    color: '#dc2626', 
    fontWeight: '600' 
  },
  stopButton: { 
    padding: 4 
  },
  audioPlayerWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#f1f5f9', 
    paddingHorizontal: 12, 
    height: 50, 
    borderRadius: 10, 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#f87b1b' 
  },
  playButton: {},
  deleteButton: {},
});
