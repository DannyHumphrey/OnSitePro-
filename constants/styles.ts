import { StyleSheet } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const appStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: spacing.md,
  },
});
