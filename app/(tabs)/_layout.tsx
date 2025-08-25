import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { CustomTabBar } from '@/components/CustomTabBar';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          display: 'none',
          height: 0,
          padding: 0,
          margin: 0,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: 'transparent',
        tabBarInactiveTintColor: 'transparent',
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          
        }}
      />
      <Tabs.Screen
        name="declaration"
        options={{
          title: 'Declaration',
          
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          
        }}
      />
      <Tabs.Screen
        name="audit"
        options={{
          title: 'Audit',
          
        }}
      />
      <Tabs.Screen
        name="echantillon"
        options={{
          title: 'Echantillon',
         
        }}
      />
      <Tabs.Screen
        name="inventaire"
        options={{
          title: 'Inventaire',
        }}
      />
      {/* Profile tab removed; accessible via header icon */}
    </Tabs>
  );
}
