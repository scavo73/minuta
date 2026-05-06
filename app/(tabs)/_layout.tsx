import { Tabs, router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useMinutaTheme } from '../../constants/useMinutaTheme';

export default function TabsLayout() {
  const { theme } = useMinutaTheme();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedText,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 68,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="notas"
        options={{
          title: 'Notas',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarButton: () => (
            <Pressable
              accessibilityLabel="Crear nueva minuta"
              onPress={() => router.push('/nueva-nota')}
              style={styles.createTabButtonWrapper}
            >
              <Text
                style={[
                  styles.createTabButton,
                  { backgroundColor: theme.primary },
                ]}
              >
                +
              </Text>
            </Pressable>
          ),
          tabBarLabel: () => null,
          title: '',
        }}
      />
      <Tabs.Screen
        name="checklists"
        options={{
          title: 'Tareas',
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: 'Ideas',
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
  createTabButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
  },
  createTabButton: {
    borderRadius: 28,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    height: 56,
    lineHeight: 52,
    overflow: 'hidden',
    textAlign: 'center',
    width: 56,
  },
});
