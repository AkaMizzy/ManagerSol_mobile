import Ionicons from '@expo/vector-icons/build/Ionicons';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';

const { width: screenWidth } = Dimensions.get('window');

interface SignatureFieldProps {
  role: 'technicien' | 'control' | 'admin';
  roleLabel: string;
  onSignatureComplete: (role: string, signature: string, email: string) => void;
  isCompleted: boolean;
}

interface SignatureData {
  signature: string;
  email: string;
}

export default function SignatureField({
  role,
  roleLabel,
  onSignatureComplete,
  isCompleted,
}: SignatureFieldProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [signature, setSignature] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const signatureRef = useRef<any>(null);

  const handleSignature = (signature: string) => {
    setSignature(signature);
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
    setSignature('');
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = () => {
    if (!signature || !email.trim()) {
      Alert.alert('Validation', 'Please provide both signature and email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Validation', 'Please enter a valid email address');
      return;
    }

    onSignatureComplete(role, signature, email.trim());
    setIsModalVisible(false);
    setEmail('');
    clearSignature();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEmail('');
    clearSignature();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'technicien':
        return '🔧';
      case 'control':
        return '🔍';
      case 'admin':
        return '👨‍💼';
      default:
        return '✍️';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'technicien':
        return '#34C759';
      case 'control':
        return '#007AFF';
      case 'admin':
        return '#FF9500';
      default:
        return '#11224e';
    }
  };

  return (
    <>
      <Pressable
        style={[
          styles.signatureField,
          isCompleted && styles.completedField,
          { borderColor: getRoleColor(role) },
        ]}
        onPress={() => setIsModalVisible(true)}
      >
        <View style={styles.fieldContent}>
          <View style={styles.fieldHeader}>
            <Text style={styles.roleIcon}>{getRoleIcon(role)}</Text>
            <Text style={[styles.roleLabel, { color: getRoleColor(role) }]}>
              {roleLabel}
            </Text>
            {isCompleted && (
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            )}
          </View>
          <Text style={styles.fieldSubtext}>
            {isCompleted ? 'Signature completed' : 'Tap to add signature'}
          </Text>
        </View>
      </Pressable>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Signature - {roleLabel}</Text>
              <Pressable onPress={handleCancel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#11224e" />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter signer email..."
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>Signature *</Text>
              <View style={styles.canvasContainer}>
                <SignatureCanvas
                  ref={signatureRef}
                  onOK={handleSignature}
                  descriptionText="Sign here"
                  clearText="Clear"
                  confirmText="Confirm"
                  webStyle={`
                    .m-signature-pad {
                      box-shadow: none;
                      border: 1px solid #E5E5EA;
                      border-radius: 10px;
                      background-color: #FFFFFF;
                      width: 100%;
                      height: 100%;
                    }
                    .m-signature-pad--body {
                      background-color: #FFFFFF;
                      height: 200px;
                    }
                    .m-signature-pad--body canvas {
                      background-color: #FFFFFF;
                      border: 1px solid #E5E5EA;
                      border-radius: 10px;
                      width: 100% !important;
                      height: 100% !important;
                    }
                    .m-signature-pad--footer {
                      background-color: #F8F9FA;
                      border-top: 1px solid #E5E5EA;
                      padding: 10px;
                    }
                    .m-signature-pad--footer button {
                      background-color: #11224e;
                      color: white;
                      border: none;
                      padding: 8px 16px;
                      border-radius: 6px;
                      margin: 4px;
                      font-size: 14px;
                    }
                    .m-signature-pad--footer button:hover {
                      background-color: #0a1a3a;
                    }
                    .m-signature-pad--footer .description {
                      color: #6B7280;
                      font-size: 12px;
                      margin-bottom: 8px;
                    }
                  `}
                  style={styles.signatureCanvas}
                  backgroundColor="white"
                  penColor="#11224e"
                  minWidth={2}
                  maxWidth={4}
                  imageType="image/png"
                  trimWhitespace={true}
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable onPress={handleCancel} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Save Signature</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  signatureField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  completedField: {
    borderColor: '#34C759',
    backgroundColor: '#F0FDF4',
  },
  fieldContent: {
    alignItems: 'center',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  fieldSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
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
    fontWeight: '700',
    color: '#11224e',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11224e',
    marginBottom: 8,
    marginTop: 12,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  canvasContainer: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    width: screenWidth - 80,
    height: 280,
  },
  signatureCanvas: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#11224e',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#11224e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
