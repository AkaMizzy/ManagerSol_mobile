import { UploadedFile } from '@/types/manifolder';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface VoiceRecorderProps {
  value?: UploadedFile | null;
  onFileSelect: (file: { uri: string; name: string; type: string }) => void;
  onFileRemove: () => void;
  placeholder?: string;
  maxDuration?: number; // in seconds
}

export default function VoiceRecorder({
  value,
  onFileSelect,
  onFileRemove,
  placeholder = 'Record voice message',
  maxDuration = 300, // 5 minutes default
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxDuration]);

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone permission is required to record audio');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        const fileName = `voice_recording_${Date.now()}.m4a`;
        onFileSelect({
          uri,
          name: fileName,
          type: 'audio/mp4',
        });
      }
      
      setRecording(null);
      setRecordingTime(0);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const playRecording = async () => {
    const uri = value?.uri || value?.path;
    if (!uri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const stopPlaying = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={styles.container}>
      {value ? (
        // Display recorded audio
        <View style={styles.audioContainer}>
          <View style={styles.audioInfo}>
            <Ionicons name="musical-notes" size={24} color="#007AFF" />
            <View style={styles.audioDetails}>
              <Text style={styles.audioName} numberOfLines={1}>
                {value.originalName || value.name}
              </Text>
              <Text style={styles.audioSize}>
                {getFileSize(value.size)}
              </Text>
            </View>
          </View>
          
          <View style={styles.audioControls}>
            {isPlaying ? (
              <Pressable style={styles.controlButton} onPress={stopPlaying}>
                <Ionicons name="stop" size={20} color="#FF3B30" />
              </Pressable>
            ) : (
              <Pressable style={styles.controlButton} onPress={playRecording}>
                <Ionicons name="play" size={20} color="#34C759" />
              </Pressable>
            )}
            
            <Pressable style={styles.removeButton} onPress={onFileRemove}>
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
            </Pressable>
          </View>
        </View>
      ) : (
        // Recording interface
        <View style={styles.recordingContainer}>
          {isRecording ? (
            // Recording in progress
            <View style={styles.recordingActive}>
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  Recording... {formatTime(recordingTime)}
                </Text>
              </View>
              
              <Pressable 
                style={[styles.recordButton, styles.stopButton]} 
                onPress={stopRecording}
              >
                <Ionicons name="stop" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            // Start recording
            <Pressable 
              style={styles.recordButton} 
              onPress={startRecording}
            >
              <Ionicons name="mic" size={24} color="#FFFFFF" />
              <Text style={styles.recordText}>{placeholder}</Text>
            </Pressable>
          )}
          
          <Text style={styles.maxDurationText}>
            Max duration: {formatTime(maxDuration)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 12,
    minHeight: 60,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  audioDetails: {
    flex: 1,
    marginLeft: 12,
  },
  audioName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  audioSize: {
    fontSize: 12,
    color: '#8E8E93',
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  removeButton: {
    padding: 4,
  },
  recordingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  recordingActive: {
    alignItems: 'center',
    marginBottom: 12,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  recordText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  maxDurationText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
});
