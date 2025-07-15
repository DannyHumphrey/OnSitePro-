import { MD3DarkTheme, MD3LightTheme, Theme } from 'react-native-paper';

const baseColors = {
  primary: '#0a7ea4',
  secondary: '#5cb85c',
};

export const lightTheme: Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: baseColors.primary,
    secondary: baseColors.secondary,
  },
};

export const darkTheme: Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: baseColors.primary,
    secondary: baseColors.secondary,
  },
};
