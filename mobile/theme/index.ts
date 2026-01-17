// React Native Paper theme configuration

import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  fontFamily: 'System',
};

export const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3d9be9',
    primaryContainer: '#e3f2fd',
    secondary: '#10B981',
    secondaryContainer: '#d1fae5',
    tertiary: '#8B5CF6',
    tertiaryContainer: '#ede9fe',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    background: '#f8fafc',
    error: '#EF4444',
    errorContainer: '#fee2e2',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onTertiary: '#ffffff',
    onSurface: '#1e293b',
    onSurfaceVariant: '#64748b',
    onBackground: '#1e293b',
    outline: '#e2e8f0',
    outlineVariant: '#cbd5e1',
    elevation: {
      level0: 'transparent',
      level1: '#ffffff',
      level2: '#f8fafc',
      level3: '#f1f5f9',
      level4: '#e2e8f0',
      level5: '#cbd5e1',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3d9be9',
    primaryContainer: '#1e3a5f',
    secondary: '#10B981',
    secondaryContainer: '#064e3b',
    tertiary: '#8B5CF6',
    tertiaryContainer: '#4c1d95',
    surface: '#1e1e1e',
    surfaceVariant: '#2d2d2d',
    background: '#121212',
    error: '#EF4444',
    errorContainer: '#7f1d1d',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onTertiary: '#ffffff',
    onSurface: '#e2e8f0',
    onSurfaceVariant: '#94a3b8',
    onBackground: '#e2e8f0',
    outline: '#475569',
    outlineVariant: '#334155',
    elevation: {
      level0: 'transparent',
      level1: '#1e1e1e',
      level2: '#232323',
      level3: '#282828',
      level4: '#2d2d2d',
      level5: '#323232',
    },
  },
};

export type AppTheme = typeof lightTheme;
