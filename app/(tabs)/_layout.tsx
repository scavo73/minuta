import { Ionicons } from '@expo/vector-icons';
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
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,

          backgroundColor: theme.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(0,0,0,0.12)',

          paddingTop: 8,
          paddingBottom: 8,

          elevation: 0,
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: {
            width: 0,
            height: 0,
          },
        },

        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="notas"
        options={{
          title: 'Notas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarLabel: () => null,
          tabBarButton: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Crear nueva minuta"
              onPress={() => router.push('/new-item')}
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
        }}
      />

      <Tabs.Screen
        name="checklists"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'checkbox' : 'checkbox-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ideas"
        options={{
          title: 'Ideas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'bulb' : 'bulb-outline'}
              size={22}
              color={color}
            />
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

  createTabButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -14,
  },

  createTabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 52,
    overflow: 'hidden',
    textAlign: 'center',
  },
});