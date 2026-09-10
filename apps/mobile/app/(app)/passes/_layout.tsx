import { Stack } from 'expo-router';

export default function PassesLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: '#0a4d8c',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: 'New pass' }} />
      <Stack.Screen name="[passId]" options={{ title: 'Pass details' }} />
    </Stack>
  );
}
