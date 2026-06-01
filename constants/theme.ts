export const lightTheme = {
  background: "#F8F8FB",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  text: "#111827",
  mutedText: "#6B7280",
  border: "#E5E7EB",
  primary: "#111827",
  primaryText: "#FFFFFF",
  danger: "#DC2626",
  inputBackground: "#FFFFFF",
  chipBackground: "#FFFFFF",
  modalBackground: "#FFFFFF",
  noteCard: "#FFFFFF",
  taskCard: "#E5E7EB",
  ideaCard: "#FDE68A",
  ideaText: "#111827",
};

export const darkTheme = {
  background: "#251914",
  surface: "#35251D",
  card: "#3D2B22",
  text: "#FFF4DE",
  mutedText: "#CBB79A",
  border: "#5A463A",
  primary: "#E8DCC4",
  primaryText: "#251914",
  danger: "#F87171",
  inputBackground: "#302119",
  chipBackground: "#422F25",
  modalBackground: "#302119",
  noteCard: "#3D2B22",
  taskCard: "#49382D",
  ideaCard: "#FDE68A",
  ideaText: "#251914",
};

export type MinutaTheme = typeof lightTheme;
export type ThemePreference = "light" | "dark" | "system";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
};

export const typography = {
  title: 28,
  subtitle: 20,
  body: 16,
  small: 13,
};
