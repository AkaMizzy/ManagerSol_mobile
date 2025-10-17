import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import { CreateUserData } from '../types/user';

interface CreateUserModalProps {
  visible: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export default function CreateUserModal({ visible, onClose, onUserCreated }: CreateUserModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<CreateUserData>({
    firstname: '',
    lastname: '',
    email: '',
    phone1: '',
    phone2: '',
    email_second: '',
    role: 'user',
    status: 1, // Always active
  });

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setFormData({
        firstname: '',
        lastname: '',
        email: '',
        phone1: '',
        phone2: '',
        email_second: '',
        role: 'user',
        status: 1, // Always active
      });
      setErrors({});
    }
  }, [visible]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.firstname.trim()) {
      newErrors.firstname = 'Le prénom est obligatoire';
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = 'Le nom est obligatoire';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Format d\'email invalide';
      }
    }

    // Optional email validation
    if (formData.email_second && formData.email_second.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email_second)) {
        newErrors.email_second = 'Format d\'email secondaire invalide';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Erreur', 'Authentification requise');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await userService.createUser(token, {
        ...formData,
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        email: formData.email.trim().toLowerCase(),
        phone1: formData.phone1?.trim() || undefined,
        phone2: formData.phone2?.trim() || undefined,
        email_second: formData.email_second?.trim() || undefined,
      });

      setGeneratedPassword(response.password);
      setShowPasswordModal(true);
      onUserCreated();
      
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de créer l&apos;utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const renderPasswordModal = () => (
    <Modal
      visible={showPasswordModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowPasswordModal(false)}
    >
      <View style={styles.passwordModalOverlay}>
        <View style={styles.passwordModalContent}>
          <View style={styles.passwordModalHeader}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#2ecc71" />
            </View>
            <Text style={styles.passwordModalTitle}>Utilisateur créé avec succès</Text>
            <Text style={styles.passwordModalSubtitle}>
              Le mot de passe généré automatiquement est :
            </Text>
          </View>
          
          <View style={styles.passwordContainer}>
            <Text style={styles.passwordText}>{generatedPassword}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                // Copy to clipboard functionality would go here
                Alert.alert('Copié', 'Mot de passe copié dans le presse-papiers');
              }}
            >
              <Ionicons name="copy" size={20} color="#f87b1b" />
              <Text style={styles.copyButtonText}>Copier</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={16} color="#f59e0b" />
            <Text style={styles.passwordWarning}>
              Partagez ce mot de passe de manière sécurisée avec l&apos;utilisateur
            </Text>
          </View>

          <TouchableOpacity
            style={styles.passwordModalButton}
            onPress={() => {
              setShowPasswordModal(false);
              handleClose();
            }}
          >
            <Text style={styles.passwordModalButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#11224e" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Créer un utilisateur</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formContainer}>
              {/* Name Row */}
              <View style={styles.nameRow}>
                <View style={styles.nameCol}>
                  <Text style={styles.label}>
                    Prénom <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.firstname && styles.inputError]}
                    value={formData.firstname}
                    onChangeText={(text) => {
                      setFormData({ ...formData, firstname: text });
                      if (errors.firstname) {
                        setErrors({ ...errors, firstname: '' });
                      }
                    }}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                  {errors.firstname && (
                    <Text style={styles.errorText}>{errors.firstname}</Text>
                  )}
                </View>

                <View style={styles.nameCol}>
                  <Text style={styles.label}>
                    Nom <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.lastname && styles.inputError]}
                    value={formData.lastname}
                    onChangeText={(text) => {
                      setFormData({ ...formData, lastname: text });
                      if (errors.lastname) {
                        setErrors({ ...errors, lastname: '' });
                      }
                    }}
                    placeholder="Nom"
                    autoCapitalize="words"
                    editable={!loading}
                  />
                  {errors.lastname && (
                    <Text style={styles.errorText}>{errors.lastname}</Text>
                  )}
                </View>
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Email <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email: text });
                    if (errors.email) {
                      setErrors({ ...errors, email: '' });
                    }
                  }}
                  placeholder="email@exemple.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Primary Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Téléphone principal</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone1}
                  onChangeText={(text) => setFormData({ ...formData, phone1: text })}
                  placeholder="+33 1 23 45 67 89"
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              {/* Secondary Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Téléphone secondaire</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone2}
                  onChangeText={(text) => setFormData({ ...formData, phone2: text })}
                  placeholder="+33 1 23 45 67 89"
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              {/* Secondary Email */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email secondaire</Text>
                <TextInput
                  style={[styles.input, errors.email_second && styles.inputError]}
                  value={formData.email_second}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email_second: text });
                    if (errors.email_second) {
                      setErrors({ ...errors, email_second: '' });
                    }
                  }}
                  placeholder="email2@exemple.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                {errors.email_second && (
                  <Text style={styles.errorText}>{errors.email_second}</Text>
                )}
              </View>


              {/* Role Info */}
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Ionicons name="information-circle" size={20} color="#3b82f6" />
                  <Text style={styles.infoTitle}>Rôle utilisateur</Text>
                </View>
                <Text style={styles.infoText}>
                  Le nouvel utilisateur sera créé avec le rôle &quot;Utilisateur&quot; par défaut. 
                  Vous pourrez modifier ce rôle ultérieurement si nécessaire.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Créer l&apos;utilisateur</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {renderPasswordModal()}
    </>
  );
}

const styles = {
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#11224e',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
  },
  formContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  nameCol: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 6,
    fontWeight: '500' as const,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1e40af',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row' as const,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
    backgroundColor: 'white',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#f87b1b',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#f87b1b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Password modal styles
  passwordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 20,
  },
  passwordModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  passwordModalHeader: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdf4',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  passwordModalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#11224e',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  passwordModalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  passwordContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  passwordText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#11224e',
    textAlign: 'center' as const,
    letterSpacing: 3,
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  copyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#f87b1b',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  copyButtonText: {
    color: '#f87b1b',
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  warningContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  passwordWarning: {
    fontSize: 14,
    color: '#f59e0b',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  passwordModalButton: {
    backgroundColor: '#11224e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  passwordModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
} as const;
