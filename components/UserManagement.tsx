import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import API_CONFIG from '../app/config/api';
import { useAuth } from '../contexts/AuthContext';
import userService from '../services/userService';
import { CompanyUser } from '../types/user';
import CreateUserModal from './CreateUserModal';

interface UserManagementProps {
  onUserCreated?: () => void;
}

export default function UserManagement({ onUserCreated }: UserManagementProps) {
  const { token } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const handleUserCreated = async () => {
    // Refresh users list when a new user is created
    await fetchUsers();
    onUserCreated?.();
  };

  const getRoleStyle = (role: string) => {
    return role === 'admin'
      ? { bg: '#e3f2fd', color: '#1976d2', border: '#bbdefb', label: 'Admin' }
      : { bg: '#f3e5f5', color: '#7b1fa2', border: '#e1bee7', label: 'Utilisateur' };
  };

  const getStatusStyle = (status: number) => {
    return status === 1
      ? { bg: '#e9f7ef', color: '#2ecc71', border: '#c6f0d9', label: 'Actif' }
      : { bg: '#f4f5f7', color: '#6b7280', border: '#e5e7eb', label: 'Inactif' };
  };

  const renderUserCard = ({ item }: { item: CompanyUser }) => {
    const roleStyle = getRoleStyle(item.role);
    const statusStyle = getStatusStyle(item.status);
    
    // Build avatar URL if photo exists
    const avatarUrl = item.photo 
      ? `${API_CONFIG.BASE_URL}${item.photo}`
      : null;
    
    return (
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#6b7280" />
              </View>
            )}
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {item.firstname} {item.lastname}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            {item.phone1 && (
              <Text style={styles.userPhone}>{item.phone1}</Text>
            )}
          </View>

          {/* Badges */}
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

      <CreateUserModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={handleUserCreated}
      />
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
  avatarContainer: {
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
} as const;
