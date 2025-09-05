import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface AppHeaderProps {
  showNotifications?: boolean;
  showProfile?: boolean;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  user?: {
    firstname?: string;
    lastname?: string;
  };
}

export default function AppHeader({
  showNotifications = true,
  showProfile = true,
  onNotificationPress,
  onProfilePress,
  user
}: AppHeaderProps) {
  const router = useRouter();

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    }
  };

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push('/(tabs)/profile');
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {/* Left side - App Icon */}
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
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
          {showNotifications && (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.iconButton}
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications-outline" size={22} color="#1C1C1E" />
            </TouchableOpacity>
          )}
          {showProfile && (
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.iconButton}
              onPress={handleProfilePress}
            >
              <Ionicons name="person-circle-outline" size={24} color="#1C1C1E" />
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { 
    width: 45,
    alignItems: 'flex-start'
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerRight: { 
    width: 80,
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    gap: 12 
  },
  userName: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#11224e',
    textAlign: 'center'
  },
  logo: { 
    width: 50, 
    height: 50 
  },
  iconButton: { 
    paddingHorizontal: 8, 
    paddingVertical: 4 
  },
});
