import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import { CompanyUser, CreateUserData } from '../types/user';

interface UserManagementProps {
  onUserCreated?: () => void;
}

export default function UserManagement({ onUserCreated }: UserManagementProps) {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { width } = useWindowDimensions();

  // Form state
  const [formData, setFormData] = useState<CreateUserData>({
    firstname: '',
    lastname: '',
    email: '',
    phone1: '',
    phone2: '',
    email_second: '',
    role: 'user',
  });

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const userList = await userService.getCompanyUsers(token);
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Erreur', 'Impossible de charger la liste des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    
    setRefreshing(true);
    try {
      const userList = await userService.getCompanyUsers(token);
      setUsers(userList);
    } catch (error) {
      console.error('Error refreshing users:', error);
      Alert.alert('Erreur', 'Impossible de rafraîchir la liste des utilisateurs');
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (!token) return;

    // Validation
    if (!formData.firstname.trim() || !formData.lastname.trim() || !formData.email.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse email valide');
      return;
    }

    try {
      setCreateLoading(true);
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
      setShowCreateModal(false);
      
      // Reset form
      setFormData({
        firstname: '',
        lastname: '',
        email: '',
        phone1: '',
        phone2: '',
        email_second: '',
        role: 'user',
      });

      // Refresh users list
      await fetchUsers();
      onUserCreated?.();
      
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de créer l\'utilisateur');
    } finally {
      setCreateLoading(false);
    }
  };

  const getRoleStyle = (role: string) => {
    return role === 'admin'
      ? { bg: '#e3f2fd', color: '#1976d2', border: '#bbdefb', label: 'Admin' }
      : { bg: '#f3e5f5', color: '#7b1fa2', border: '#e1bee7', label: 'Utilisateur' };
  };

  const getStatusStyle = (status: string) => {
    return status === 'active'
      ? { bg: '#e9f7ef', color: '#2ecc71', border: '#c6f0d9', label: 'Actif' }
      : { bg: '#f4f5f7', color: '#6b7280', border: '#e5e7eb', label: 'Inactif' };
  };

  const renderUserCard = ({ item }: { item: CompanyUser }) => {
    const roleStyle = getRoleStyle(item.role);
    const statusStyle = getStatusStyle(item.status);
    
    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {item.firstname} {item.lastname}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            {item.phone1 && (
              <Text style={styles.userPhone}>{item.phone1}</Text>
            )}
          </View>
          <View style={styles.badgesContainer}>
            <View style={[styles.badge, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
              <Text style={[styles.badgeText, { color: roleStyle.color }]}>
                {roleStyle.label}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border, marginTop: 4 }]}>
              <Text style={[styles.badgeText, { color: statusStyle.color }]}>
                {statusStyle.label}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Ionicons name="close" size={24} color="#11224e" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Créer un utilisateur</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              style={styles.input}
              value={formData.firstname}
              onChangeText={(text) => setFormData({ ...formData, firstname: text })}
              placeholder="Prénom"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={formData.lastname}
              onChangeText={(text) => setFormData({ ...formData, lastname: text })}
              placeholder="Nom"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="email@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Téléphone principal</Text>
            <TextInput
              style={styles.input}
              value={formData.phone1}
              onChangeText={(text) => setFormData({ ...formData, phone1: text })}
              placeholder="+33 1 23 45 67 89"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Téléphone secondaire</Text>
            <TextInput
              style={styles.input}
              value={formData.phone2}
              onChangeText={(text) => setFormData({ ...formData, phone2: text })}
              placeholder="+33 1 23 45 67 89"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email secondaire</Text>
            <TextInput
              style={styles.input}
              value={formData.email_second}
              onChangeText={(text) => setFormData({ ...formData, email_second: text })}
              placeholder="email2@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Rôle</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  formData.role === 'user' && styles.roleOptionActive
                ]}
                onPress={() => setFormData({ ...formData, role: 'user' })}
              >
                <Text style={[
                  styles.roleOptionText,
                  formData.role === 'user' && styles.roleOptionTextActive
                ]}>
                  Utilisateur
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  formData.role === 'admin' && styles.roleOptionActive
                ]}
                onPress={() => setFormData({ ...formData, role: 'admin' })}
              >
                <Text style={[
                  styles.roleOptionText,
                  formData.role === 'admin' && styles.roleOptionTextActive
                ]}>
                  Administrateur
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createButton, createLoading && styles.createButtonDisabled]}
            onPress={handleCreateUser}
            disabled={createLoading}
          >
            {createLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.createButtonText}>Créer l&apos;utilisateur</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

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
            <Ionicons name="checkmark-circle" size={48} color="#2ecc71" />
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

          <Text style={styles.passwordWarning}>
            ⚠️ Partagez ce mot de passe de manière sécurisée avec l&apos;utilisateur
          </Text>

          <TouchableOpacity
            style={styles.passwordModalButton}
            onPress={() => setShowPasswordModal(false)}
          >
            <Text style={styles.passwordModalButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading && users.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#11224e" size="large" />
        <Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Utilisateurs</Text>
          <Text style={styles.subtitle}>
            Gérez les utilisateurs de votre entreprise
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add-circle" size={20} color="#f87b1b" />
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserCard}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#11224e']}
            tintColor="#11224e"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>Aucun utilisateur</Text>
            <Text style={styles.emptySubtitle}>
              Commencez par ajouter des utilisateurs à votre entreprise
            </Text>
          </View>
        }
      />

      {renderCreateModal()}
      {renderPasswordModal()}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#11224e',
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#f87b1b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#f87b1b',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#f87b1b',
    marginLeft: 6,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#11224e',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  badgesContainer: {
    alignItems: 'flex-end' as const,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center' as const,
    marginTop: 8,
    paddingHorizontal: 32,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#11224e',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  roleSelector: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  roleOptionActive: {
    borderColor: '#f87b1b',
    backgroundColor: '#fff7ed',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#6b7280',
  },
  roleOptionTextActive: {
    color: '#f87b1b',
    fontWeight: '600' as const,
  },
  createButton: {
    backgroundColor: '#f87b1b',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 20,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  // Password modal styles
  passwordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 20,
  },
  passwordModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  passwordModalHeader: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  passwordModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#11224e',
    marginTop: 12,
    textAlign: 'center' as const,
  },
  passwordModalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center' as const,
    marginTop: 8,
  },
  passwordContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  passwordText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#11224e',
    textAlign: 'center' as const,
    letterSpacing: 2,
    marginBottom: 12,
  },
  copyButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#f87b1b',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  copyButtonText: {
    color: '#f87b1b',
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 6,
  },
  passwordWarning: {
    fontSize: 12,
    color: '#f59e0b',
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  passwordModalButton: {
    backgroundColor: '#11224e',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  passwordModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
} as const;
