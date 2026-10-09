import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Validating session..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1E40AF' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: '#1E40AF',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: 'MediPass Patient Hub',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={[styles.tabLabel, { color }]}>Dashboard</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={[styles.tabLabel, { color }]}>Profile</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="sharing"
        options={{
          title: 'Sharing',
          headerTitle: 'Sharing Preferences',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'share-social' : 'share-social-outline'}
              size={size}
              color={color}
            />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={[styles.tabLabel, { color }]}>Sharing</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="passes"
        options={{
          title: 'Passes',
          headerTitle: 'Active Emergency Passes',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'qr-code' : 'qr-code-outline'}
              size={size}
              color={color}
            />
          ),
          tabBarLabel: ({ color }) => (
            <Text style={[styles.tabLabel, { color }]}>Passes</Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
