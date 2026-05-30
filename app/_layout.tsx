//import '../global.css';

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { GluestackUIProvider } from "../components/ui/gluestack-ui-provider";
import { useFoldersStore } from "../store/foldersStore";
import { useNotesStore } from "../store/notesStore";

export default function RootLayout() {
  const fetchFolders = useFoldersStore((state) => state.fetchFolders);
  const fetchItems = useNotesStore((state) => state.fetchItems);

  useEffect(() => {
    fetchFolders();
    fetchItems();
  }, [fetchFolders, fetchItems]);

  return (
    <GluestackUIProvider mode="system">
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new-item" />
        <Stack.Screen name="drafts" />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="folder/[id]" />
      </Stack>
    </GluestackUIProvider>
  );
}
