import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ModernTabBarProps extends BottomTabBarButtonProps {
  isActive?: boolean;
}

export function ModernTabBar(props: ModernTabBarProps) {
  const { isActive, children, ...restProps } = props;

  return (
    <PlatformPressable
      {...restProps}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
      style={[
        styles.tabButton,
        isActive && styles.activeTabButton,
      ]}
    >
      {children}
    </PlatformPressable>
  );
}

interface TabIconProps {
  name: string;
  isActive: boolean;
  size?: number;
}

export function TabIcon({ name, isActive, size = 24 }: TabIconProps) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons
        name={name as any}
        size={size}
        color={isActive ? '#6366F1' : '#9CA3AF'}
      />
    </View>
  );
}

interface TabLabelProps {
  label: string;
  isActive: boolean;
}

export function TabLabel({ label, isActive }: TabLabelProps) {
  return (
    <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
      {label.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 4,
    minHeight: 60,
  },
  activeTabButton: {
    backgroundColor: '#F8FAFC',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pressedTabButton: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  iconContainer: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#6366F1',
    fontWeight: '700',
  },
});
