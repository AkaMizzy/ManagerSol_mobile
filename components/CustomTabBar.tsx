import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { TabIcon, TabLabel } from './ModernTabBar';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const animatedValues = useRef<{ [key: string]: Animated.Value }>({});

  // Initialize animated values for each tab
  useEffect(() => {
    state.routes.forEach((route) => {
      if (!animatedValues.current[route.key]) {
        animatedValues.current[route.key] = new Animated.Value(0);
      }
    });
  }, [state.routes]);

  // Animate active tab
  useEffect(() => {
    const activeRoute = state.routes[state.index];
    if (activeRoute && animatedValues.current[activeRoute.key]) {
      Animated.spring(animatedValues.current[activeRoute.key], {
        toValue: 1,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    }

    // Reset other tabs
    state.routes.forEach((route, index) => {
      if (index !== state.index && animatedValues.current[route.key]) {
        Animated.spring(animatedValues.current[route.key], {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }
    });
  }, [state.index, state.routes]);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = state.index === index;
          const animatedValue = animatedValues.current[route.key] || new Animated.Value(0);

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

          const scale = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.05],
          });

          const opacity = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 1],
          });

          return (
            <Animated.View
              key={route.key}
              style={[
                styles.tabContainer,
                {
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[
                  styles.tab,
                  isFocused && styles.activeTab,
                ]}
              >
                <TabIcon
                  name={getIconName(route.name)}
                  isActive={isFocused}
                  size={24}
                />
                <TabLabel
                  label={label}
                  isActive={isFocused}
                />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function getIconName(routeName: string): string {
  switch (routeName) {
    case 'index':
      return 'home-outline';
    case 'tasks':
      return 'list-outline';
    case 'declaration':
      return 'document-text-outline';
    case 'profile':
      return 'person-outline';
    default:
      return 'help-outline';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: 20,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    height: 80,
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    marginHorizontal: 4,
    minHeight: 60,
    width: '100%',
  },
  activeTab: {
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
});
