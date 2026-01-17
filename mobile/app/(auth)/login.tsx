// Login screen

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  IconButton,
  HelperText,
  Surface,
  Divider,
} from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const theme = useTheme();
  const { toggleTheme, isDark } = useAppTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (adminQuickLogin = false) => {
    const loginEmail = adminQuickLogin ? 'admin@company.com' : email.trim();
    const loginPassword = adminQuickLogin ? 'Admin@123' : password;

    if (!adminQuickLogin && !validate()) return;

    setLoading(true);
    try {
      await login({ email: loginEmail, password: loginPassword });
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: 'Login successful',
      });
      router.replace('/(dashboard)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? theme.colors.background : '#f5f7fa' }
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Theme Toggle */}
          <View style={styles.themeToggle}>
            <IconButton
              icon={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'}
              size={24}
              onPress={toggleTheme}
              mode="contained-tonal"
            />
          </View>

          {/* Logo & Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: theme.colors.primaryContainer }
              ]}
            >
              <MaterialCommunityIcons
                name="office-building"
                size={48}
                color={theme.colors.primary}
              />
            </View>
            <Text
              variant="headlineMedium"
              style={[styles.title, { color: theme.colors.onBackground }]}
            >
              Office Management
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              Sign in to your account
            </Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Surface
              style={[
                styles.formCard,
                { backgroundColor: theme.colors.surface }
              ]}
              elevation={2}
            >
              <TextInput
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={!!errors.email}
                left={<TextInput.Icon icon="email-outline" />}
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
              {errors.email && (
                <HelperText type="error" visible={!!errors.email} style={styles.errorText}>
                  {errors.email}
                </HelperText>
              )}

              <TextInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                error={!!errors.password}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                outlineStyle={styles.inputOutline}
              />
              {errors.password && (
                <HelperText type="error" visible={!!errors.password} style={styles.errorText}>
                  {errors.password}
                </HelperText>
              )}

              <Button
                mode="contained"
                onPress={() => handleLogin(false)}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <View style={styles.dividerContainer}>
                <Divider style={styles.divider} />
                <Text
                  variant="bodySmall"
                  style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}
                >
                  OR
                </Text>
                <Divider style={styles.divider} />
              </View>

              <Button
                mode="outlined"
                onPress={() => handleLogin(true)}
                disabled={loading}
                style={styles.quickLoginButton}
                contentStyle={styles.buttonContent}
                icon="shield-account"
              >
                Quick Login as Admin
              </Button>
            </Surface>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, opacity: 0.7 }}
            >
              Operation Management Platform
            </Text>
            <Text
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant, opacity: 0.5, marginTop: 4 }}
            >
              v1.0.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 8,
  },
  themeToggle: {
    alignItems: 'flex-end',
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 0,
  },
  input: {
    marginBottom: 4,
  },
  inputOutline: {
    borderRadius: 12,
  },
  errorText: {
    marginBottom: 8,
    marginTop: -4,
  },
  loginButton: {
    marginTop: 20,
    borderRadius: 12,
  },
  quickLoginButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
});
