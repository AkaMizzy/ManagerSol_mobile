import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      {
        paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 12) : 16,
        paddingTop: Platform.OS === 'android' ? 6 : 8,
      }
    ]}>
      {state.routes.filter(r => r.name !== 'profile' && r.name !== 'index' && r.name !== 'tasks' && r.name !== 'qualiphoto' && r.name !== 'planning' && r.name !== 'change-password').map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const renderIcon = (routeName: string) => {
          const opacity = isFocused ? 1 : 0.6;
          switch (routeName) {
            case 'declaration':
              return (
                <Image
                  source={require('../assets/icons/declaration_anomalie.png')}
                  style={[styles.customIcon, { opacity }]}
                  resizeMode="contain"
                />
              );
            case 'manifolder':
              return (
                <Image
                  source={require('../assets/icons/manifolder.png')}
                  style={[styles.customIcon, { opacity }]}
                  resizeMode="contain"
                />
              );
            case 'audit':
              return (
                <Image
                  source={require('../assets/icons/audit_zone.png')}
                  style={[styles.customIcon, { opacity }]}
                  resizeMode="contain"
                />
              );
            case 'echantillon':
              return (
                <Image
                  source={require('../assets/icons/prelevement_echantillon.png')}
                  style={[styles.customIcon, { opacity }]}
                  resizeMode="contain"
                />
              );
            case 'inventaire':
              return (
                <Image
                  source={require('../assets/icons/inventaire_article.png')}
                  style={[styles.customIcon, { opacity }]}
                  resizeMode="contain"
                />
              );
            default:
              return (
                <Ionicons
                  name="help-outline"
                  size={24}
                  color={isFocused ? '#F87B1B' : '#8E8E93'}
                />
              );
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tab, isFocused && styles.activeTab]}
          >
            <View style={styles.iconContainer}>
              {renderIcon(route.name)}
            </View>
            
            {isFocused && <View style={styles.activeIndicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: '#f87b1b',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 8 : 5,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'android' ? 8 : 8,
    position: 'relative',
    minHeight: Platform.OS === 'android' ? 56 : 52,
    paddingHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#FFF8F5',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  iconContainer: {
    marginBottom: Platform.OS === 'android' ? 3 : 4,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  customIcon: {
    width:50,
    height: 50,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: Platform.OS === 'android' ? 1 : 0,
    lineHeight: 12,
  },
  activeTabLabel: {
    color: '#F87B1B',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 4 : 0,
    width: 24,
    height: 4,
    backgroundColor: '#f87b1b',
    borderRadius: 2,
    shadowColor: '#f87b1b',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});
