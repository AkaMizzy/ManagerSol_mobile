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
}

export default function AppHeader({
  showNotifications = true,
  showProfile = true,
  onNotificationPress,
  onProfilePress
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
        <View style={styles.headerLeft}>
          <View style={styles.brandRow}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>QualiSol</Text>
          </View>
        </View>
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
    flex: 1 
  },
  headerRight: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    gap: 12 
  },
  appName: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#11224e' 
  },
  brandRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  logo: { 
    width: 45, 
    height: 45 
  },
  iconButton: { 
    paddingHorizontal: 8, 
    paddingVertical: 4 
  },
});
