import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import API_CONFIG from '../app/config/api';
import { CompanyUser } from '../types/user';

interface UserDetailModalProps {
  visible: boolean;
  user: CompanyUser | null;
  onClose: () => void;
}

export default function UserDetailModal({ visible, user, onClose }: UserDetailModalProps) {
  if (!user) return null;

  const getRoleStyle = (role: string) => {
    return role === 'admin'
      ? { bg: '#e3f2fd', color: '#1976d2', border: '#bbdefb', label: 'Admin' }
      : { bg: '#ffffff', color: '#f87b1b', border: '#f87b1b', label: 'Utilisateur' };
  };

  const getStatusStyle = (status: number) => {
    return status === 1
      ? { bg: '#e9f7ef', color: '#2ecc71', border: '#c6f0d9', label: 'Actif' }
      : { bg: '#f4f5f7', color: '#6b7280', border: '#e5e7eb', label: 'Inactif' };
  };

  const roleStyle = getRoleStyle(user.role);
  const statusStyle = getStatusStyle(user.status);

  // Build avatar URL if photo exists
  const avatarUrl = user.photo 
    ? `${API_CONFIG.BASE_URL}${user.photo}`
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#11224e" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Détails de l&apos;utilisateur</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
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
                  <Ionicons name="person" size={40} color="#6b7280" />
                </View>
              )}
            </View>
            <Text style={styles.userName}>
              {user.firstname} {user.lastname}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          {/* Status & Role Cards */}
          <View style={styles.badgesSection}>
            <View style={[styles.badgeCard, { backgroundColor: roleStyle.bg, borderColor: roleStyle.border }]}>
              <View style={styles.badgeHeader}>
                <Ionicons name="shield-checkmark" size={20} color={roleStyle.color} />
                <Text style={[styles.badgeTitle, { color: roleStyle.color }]}>Rôle</Text>
              </View>
              <Text style={[styles.badgeValue, { color: roleStyle.color }]}>
                {roleStyle.label}
              </Text>
            </View>

            <View style={[styles.badgeCard, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
              <View style={styles.badgeHeader}>
                <Ionicons name="checkmark-circle" size={20} color={statusStyle.color} />
                <Text style={[styles.badgeTitle, { color: statusStyle.color }]}>Statut</Text>
              </View>
              <Text style={[styles.badgeValue, { color: statusStyle.color }]}>
                {statusStyle.label}
              </Text>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de contact</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="mail" size={18} color="#11224e" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email principal</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>

              {user.email_second && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="mail-outline" size={18} color="#11224e" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email secondaire</Text>
                    <Text style={styles.infoValue}>{user.email_second}</Text>
                  </View>
                </View>
              )}

              {user.phone1 && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="call" size={18} color="#11224e" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Téléphone principal</Text>
                    <Text style={styles.infoValue}>{user.phone1}</Text>
                  </View>
                </View>
              )}

              {user.phone2 && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="call-outline" size={18} color="#11224e" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Téléphone secondaire</Text>
                    <Text style={styles.infoValue}>{user.phone2}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="person" size={18} color="#11224e" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Prénom</Text>
                  <Text style={styles.infoValue}>{user.firstname}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="person-outline" size={18} color="#11224e" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nom</Text>
                  <Text style={styles.infoValue}>{user.lastname}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Ionicons name="business" size={18} color="#11224e" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Entreprise</Text>
                  <Text style={styles.infoValue}>{user.company_name || 'Non spécifiée'}</Text>
                </View>
              </View>

            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
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
  avatarSection: {
    alignItems: 'center' as const,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#11224e',
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center' as const,
  },
  badgesSection: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 24,
  },
  badgeCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
  },
  badgeHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginLeft: 6,
    textTransform: 'uppercase' as const,
  },
  badgeValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#11224e',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoItemLast: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#6b7280',
    marginBottom: 2,
    textTransform: 'uppercase' as const,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
} as const;
