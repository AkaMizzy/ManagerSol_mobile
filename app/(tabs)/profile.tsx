import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';

export default function ProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();

  // Watch for authentication changes and navigate automatically
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Profile screen detected logout, navigating to login...');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('Logging out...');
            await logout();
            console.log('Logout completed, waiting for navigation...');
            // Navigation will be handled automatically by the useEffect above
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* App Header */}
      <AppHeader showNotifications={false} user={user || undefined} />
      
      <View style={styles.content}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.avatarLarge}>
              <Ionicons name="person" size={44} color="#11224e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nameText} numberOfLines={1}>
                {user ? `${user.firstname} ${user.lastname}` : 'Loading...'}
              </Text>
              <Text style={styles.emailText} numberOfLines={1}>{user?.email || '—'}</Text>
              <View style={styles.roleBadge}><Text style={styles.roleText}>{user?.role || 'user'}</Text></View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickRow}>
            <TouchableOpacity style={styles.quickItem}>
              <Ionicons name="person-outline" size={20} color="#11224e" />
              <Text style={styles.quickText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickItem}>
              <Ionicons name="notifications-outline" size={20} color="#11224e" />
              <Text style={styles.quickText}>Alerts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickItem}>
              <Ionicons name="settings-outline" size={20} color="#11224e" />
              <Text style={styles.quickText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={20} color="#1C1C1E" />
            <Text style={styles.menuText}>Personal information</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={20} color="#1C1C1E" />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#1C1C1E" />
            <Text style={styles.menuText}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={20} color="#1C1C1E" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  emailText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleText: { fontSize: 11, color: '#11224e', fontWeight: '700' },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quickItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    gap: 6,
  },
  quickText: { fontSize: 12, color: '#11224e', fontWeight: '600' },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 8,
  },
});
