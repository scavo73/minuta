import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import {
  darkTheme,
  lightTheme,
  type MinutaTheme,
  type ThemePreference,
} from "./theme";

const THEME_PREFERENCE_KEY = "minuta-theme-preference";

interface MinutaThemeContextValue {
  colorScheme: "light" | "dark";
  isDark: boolean;
  isLoaded: boolean;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  theme: MinutaTheme;
  themePreference: ThemePreference;
}

const MinutaThemeContext = createContext<MinutaThemeContextValue | null>(null);

function normalizeColorScheme(colorScheme: ReturnType<typeof useColorScheme>) {
  return colorScheme === "dark" ? "dark" : "light";
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function MinutaThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = normalizeColorScheme(useColorScheme());
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPreference() {
      const storedPreference = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);

      if (!isMounted) return;

      if (isThemePreference(storedPreference)) {
        setThemePreferenceState(storedPreference);
      }

      setIsLoaded(true);
    }

    void loadPreference();

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemePreference = async (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
  };

  const resolvedColorScheme =
    themePreference === "system" ? systemColorScheme : themePreference;
  const isDark = resolvedColorScheme === "dark";

  const value = useMemo(
    () => ({
      colorScheme: resolvedColorScheme,
      isDark,
      isLoaded,
      setThemePreference,
      theme: isDark ? darkTheme : lightTheme,
      themePreference,
    }),
    [isDark, isLoaded, resolvedColorScheme, themePreference],
  );

  return createElement(MinutaThemeContext.Provider, { value }, children);
}

export function useMinutaTheme(): MinutaThemeContextValue {
  const colorScheme = normalizeColorScheme(useColorScheme());
  const context = useContext(MinutaThemeContext);

  if (context) {
    return context;
  }

  const isDark = colorScheme === "dark";

  return {
    theme: isDark ? darkTheme : lightTheme,
    colorScheme,
    isDark,
    isLoaded: true,
    setThemePreference: async () => undefined,
    themePreference: "system" as const,
  };
}
