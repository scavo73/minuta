import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme } from './theme';

export function useMinutaTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    theme: isDark ? darkTheme : lightTheme,
    colorScheme,
    isDark,
  };
}
