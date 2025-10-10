import API_CONFIG from '@/app/config/api';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ICONS } from '@/constants/Icons';


interface AppHeaderProps {
  showNotifications?: boolean;
  showProfile?: boolean;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onNavigate?: () => void;
  user?: {
    firstname?: string;
    lastname?: string;
    photo?: string | null;
  };
}

export default function AppHeader({
  showNotifications = true,
  showProfile = true,
  onNotificationPress,
  onProfilePress,
  onNavigate,
  user
}: AppHeaderProps) {
  const router = useRouter();

  const handleNavigate = (path: React.ComponentProps<typeof Link>['href']) => {
    if (onNavigate) {
      onNavigate();
    }
    router.push(path);
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    }
  };

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      handleNavigate('/(tabs)/profile');
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.headerLeft}
          onPress={() => handleNavigate('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Navigate to home"
        >
          <Image
            source={ICONS.icon}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        {/* Center - User Name */}
        <View style={styles.headerCenter}>
          <Text style={styles.userName}>
            {user?.firstname && user?.lastname 
              ? `${user.firstname} ${user.lastname}`
              : 'QualiSol'
            }
          </Text>
        </View>
        
        {/* Right side - Action Icons */}
        <View style={styles.headerRight}>
          {/* {showNotifications && (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.iconButton}
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications-outline" size={20} color="#FF6B35" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.iconButton}
          
          >
            <Ionicons name="chatbox-outline" size={20} color="#FF6B35" />
          </TouchableOpacity> */}
          {showProfile && (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.iconButton}
              onPress={handleProfilePress}
            >
              {user?.photo ? (
                <Image
                  source={{ uri: `${API_CONFIG.BASE_URL}${user.photo}` }}
                  style={styles.avatar}
                />
              ) : (
                <Ionicons name="person-circle-outline" size={28} color="#FF6B35" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#f87b1b',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerRight: { 
    width: 100,
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    gap: 8 
  },
  userName: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#11224e',
    textAlign: 'center'
  },
  logo: {
    width: 50,
    height: 50,
  },
  iconButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
});
