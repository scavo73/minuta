//import '../global.css';

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { GluestackUIProvider } from "../components/ui/gluestack-ui-provider";
import { MinutaThemeProvider, useMinutaTheme } from "../constants/useMinutaTheme";
import { getToken } from "../lib/authStorage";
import { useFoldersStore } from "../store/foldersStore";
import { useNotesStore } from "../store/notesStore";

export default function RootLayout() {
  return (
    <MinutaThemeProvider>
      <RootLayoutContent />
    </MinutaThemeProvider>
  );
}

function RootLayoutContent() {
  const fetchFolders = useFoldersStore((state) => state.fetchFolders);
  const fetchItems = useNotesStore((state) => state.fetchItems);
  const { colorScheme, isDark } = useMinutaTheme();

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      const token = await getToken();

      if (!isMounted || !token) return;

      fetchFolders();
      fetchItems();
    }

    void loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchFolders, fetchItems]);

  return (
    <GluestackUIProvider mode={colorScheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="account" />
        <Stack.Screen name="auth/sign-in" />
        <Stack.Screen name="auth/sign-up" />
        <Stack.Screen name="auth/forgot-password" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="new-item" />
        <Stack.Screen name="drafts" />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="folder/[id]" />
      </Stack>
    </GluestackUIProvider>
  );
}
