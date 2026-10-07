import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1E40AF' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#F9FAFB' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Clinical Profile',
          headerTitle: 'Clinical Profile Hub',
        }}
      />
      <Stack.Screen
        name="demographics"
        options={{
          title: 'Demographics',
          headerTitle: 'Demographics & Vitals',
        }}
      />
      <Stack.Screen
        name="allergies"
        options={{
          title: 'Allergies',
          headerTitle: 'Allergies & Reactions',
        }}
      />
      <Stack.Screen
        name="medications"
        options={{
          title: 'Medications',
          headerTitle: 'Active Medications',
        }}
      />
      <Stack.Screen
        name="conditions"
        options={{
          title: 'Conditions',
          headerTitle: 'Medical Conditions',
        }}
      />
      <Stack.Screen
        name="emergency-contact"
        options={{
          title: 'Emergency Contact',
          headerTitle: 'Primary Emergency Contact',
        }}
      />
    </Stack>
  );
}
