import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

interface StickyChipsProps {
  children?: ReactNode;
}

export function StickyChips({ children }: StickyChipsProps) {
  if (!children) return null;

  return <View style={styles.wrapper}>{children}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 12,
    zIndex: 2,
  },
});
