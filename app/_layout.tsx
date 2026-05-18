//import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GluestackUIProvider } from '../components/ui/gluestack-ui-provider';

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="system">
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="new-item"
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen name="item/[id]" />
      </Stack>
    </GluestackUIProvider>
  );
}
