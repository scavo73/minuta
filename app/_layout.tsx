//import '../global.css';

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { GluestackUIProvider } from "../components/ui/gluestack-ui-provider";

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="system">
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="new-item"
          options={{
            presentation: "modal",
            //hanimation: 'slide_from_bottom',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="folder/[id]" />
      </Stack>
    </GluestackUIProvider>
  );
}
