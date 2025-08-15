import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import API_CONFIG from '../app/config/api';
import { ChatMessage, Declaration } from '../types/declaration';

interface ChatModalProps {
  visible: boolean;
  declaration: Declaration | null;
  onClose: () => void;
  onSendMessage: (message: string, photo?: { uri: string; type: string; name: string }) => Promise<void>;
  onFetchMessages: (declarationId: string) => Promise<void>;
}

const { height: screenHeight } = Dimensions.get('window');

export default function ChatModal({ visible, declaration, onClose, onSendMessage, onFetchMessages }: ChatModalProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    console.log('🔍 ChatModal useEffect triggered:', { visible, declarationId: declaration?.id, hasInitialFetch });
    if (visible && declaration && !hasInitialFetch) {
      console.log('🚀 ChatModal: Initial fetch triggered');
      // Fetch messages only once when modal opens
      fetchMessages();
      setHasInitialFetch(true);
      // Removed auto-focus to prevent keyboard from opening automatically
      // Scroll to bottom
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 400);
    }
  }, [visible, declaration, hasInitialFetch]); // Include hasInitialFetch to prevent re-fetching

  // Watch for changes in declaration.chats and update local state
  useEffect(() => {
    if (declaration && declaration.chats) {
      setChatMessages(declaration.chats);
    }
  }, [declaration?.chats]);

  // Reset fetch flag when modal closes
  useEffect(() => {
    if (!visible) {
      setHasInitialFetch(false);
    }
  }, [visible]);

  const fetchMessages = async () => {
    if (!declaration) return;
    
    console.log('🔄 ChatModal: Fetching messages for declaration:', declaration.id);
    setIsLoadingMessages(true);
    try {
      await onFetchMessages(declaration.id);
      console.log('✅ ChatModal: Messages fetched successfully');
    } catch (error) {
      console.error('❌ ChatModal: Failed to fetch messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && !selectedPhoto) || !declaration) return;

    setIsLoading(true);
    try {
      await onSendMessage(message.trim(), selectedPhoto || undefined);
      setMessage('');
      setSelectedPhoto(null);
      // Refresh messages after sending
      await fetchMessages();
      // Scroll to bottom after sending
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOwnMessage = (chatMessage: ChatMessage) => {
    // This will be updated when we integrate with AuthContext
    return false; // For now, assume all messages are from others
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to select photos.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const photo = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `chat_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
        };
        setSelectedPhoto(photo);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
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
        const photo = {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: `chat_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`
        };
        setSelectedPhoto(photo);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose how you want to add a photo',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
      ]
    );
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
  };

  const handlePhotoPress = (photoPath: string) => {
    // For now, just show an alert. In the future, this could open a full-screen photo viewer
    Alert.alert(
      'Photo',
      'Photo tapped! Full-screen viewer will be implemented next.',
      [{ text: 'OK' }]
    );
  };

  if (!declaration) return null;

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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Chat</Text>
            <Text style={styles.headerSubtitle}>
              {declaration.declaration_type_title} • {declaration.zone_title}
            </Text>
          </View>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoadingMessages ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : chatMessages && chatMessages.length > 0 ? (
            chatMessages.map((chatMessage) => (
              <View
                key={chatMessage.id}
                style={[
                  styles.messageContainer,
                  isOwnMessage(chatMessage) ? styles.ownMessage : styles.otherMessage,
                ]}
              >
                {!isOwnMessage(chatMessage) && (
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageAuthor}>
                      {chatMessage.firstname} {chatMessage.lastname}
                    </Text>
                    <Text style={styles.messageTime}>
                      {formatTime(chatMessage.date_chat)}
                    </Text>
                  </View>
                )}
                
                {chatMessage.title && (
                  <Text style={styles.messageTitle}>{chatMessage.title}</Text>
                )}
                
                {/* Message Content Container */}
                <View style={[
                  styles.messageContentContainer,
                  !chatMessage.description && chatMessage.photo && styles.photoOnlyContainer
                ]}>
                  {chatMessage.description && (
                    <Text style={[
                      styles.messageText,
                      isOwnMessage(chatMessage) ? styles.ownMessageText : styles.otherMessageText,
                    ]}>
                      {chatMessage.description}
                    </Text>
                  )}

                  {chatMessage.photo && (
                    <View style={[
                      styles.messagePhotoContainer,
                      !chatMessage.description && styles.messagePhotoOnly
                    ]}>
                      <TouchableOpacity
                        onPress={() => handlePhotoPress(chatMessage.photo!)}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: `${API_CONFIG.BASE_URL}${chatMessage.photo}`}}
                          style={[
                            styles.messagePhoto,
                            !chatMessage.description && styles.photoOnlySize
                          ]}
                          contentFit="cover"
                          transition={200}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="#C7C7CC" />
              <Text style={styles.emptyStateTitle}>No messages yet</Text>
              <Text style={styles.emptyStateSubtitle}>
                Start the conversation about this declaration
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Photo Preview */}
          {selectedPhoto && (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: selectedPhoto.uri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.removePhotoButton} onPress={removePhoto}>
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Type a message..."
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={showPhotoOptions}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            {(message.trim() || selectedPhoto) && (
              <TouchableOpacity
              style={[
                styles.sendButton,
                (!message.trim() && !selectedPhoto || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={(!message.trim() && !selectedPhoto) || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <Ionicons name="hourglass-outline" size={20} color="#8E8E93" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Using the updated background color from second stylesheet
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  menuButton: {
    padding: 8,
    marginLeft: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Using the updated alignment from second stylesheet
    marginBottom: 8, // Using the updated margin from second stylesheet
    gap: 8,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  messageInfo: {
    flex: 1,
  },
  messageAuthor: {
    fontSize: 12,
    fontWeight: '600', // Using the updated font weight from second stylesheet
    color: '#007AFF', // Using the updated color from second stylesheet
    marginBottom: 2, // Added margin from second stylesheet
  },
  messageTime: {
    fontSize: 11,
    color: '#8E8E93', // Using the updated color from second stylesheet
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    padding: 12,
    borderRadius: 18,
    marginBottom: 4, // Added margin from second stylesheet
  },
  messageContentContainer: {
    gap: 8,
  },
  ownMessageText: {
    backgroundColor: '#007AFF',
    color: '#FFFFFF',
    borderBottomRightRadius: 6,
  },
  otherMessageText: {
    backgroundColor: '#FFFFFF',
    color: '#1C1C1E',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  messagePhotoContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messagePhoto: {
    width: 200,
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  messagePhotoOnly: {
    marginTop: 0,
  },
  photoOnlyContainer: {
    alignItems: 'center',
  },
  photoOnlySize: {
    width: 250,
    height: 200,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    padding: 16, // Using the consistent padding from second stylesheet
    paddingBottom: Platform.OS === 'android' ? 40 : 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 20,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Using the updated background from second stylesheet
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 44,
  },
  attachmentButton: {
    padding: 12,
    marginLeft: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  photoPreviewContainer: {
    position: 'relative',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  photoButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
});