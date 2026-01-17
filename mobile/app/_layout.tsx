// Root layout - Sets up providers and navigation structure

import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { lightTheme, darkTheme } from '../theme';

function RootLayoutNav() {
  const { theme, isDark } = useTheme();
  const paperTheme = isDark ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: paperTheme.colors.background,
            },
          }}
        />
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Toast />
      </AuthProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
