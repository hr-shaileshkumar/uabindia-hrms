import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Text, Card, Checkbox } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { API_ROOT } from '../config/api';

const LoginScreen = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const { loginWithPassword, checkApiReachable } = useContext(AuthContext);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadRemembered = async () => {
      try {
        const rememberFlag = await AsyncStorage.getItem('rememberMe');
        const savedEmail = await AsyncStorage.getItem('rememberedEmail');
        const savedPassword = await AsyncStorage.getItem('rememberedPassword');

        if (rememberFlag === 'true') {
          setRememberMe(true);
        }

        if (savedEmail) {
          setEmail(savedEmail);
        }

        if (savedPassword) {
          setPassword(savedPassword);
        }
      } catch {
        // ignore
      }
    };

    loadRemembered();
  }, []);

  useEffect(() => {
    const persistRemembered = async () => {
      try {
        if (!rememberMe) {
          await AsyncStorage.setItem('rememberMe', 'false');
          await AsyncStorage.removeItem('rememberedEmail');
          await AsyncStorage.removeItem('rememberedPassword');
          return;
        }

        await AsyncStorage.setItem('rememberMe', 'true');
        if (email) {
          await AsyncStorage.setItem('rememberedEmail', email);
        }
        if (password) {
          await AsyncStorage.setItem('rememberedPassword', password);
        }
      } catch {
        // ignore
      }
    };

    persistRemembered();
  }, [rememberMe, email, password]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const reachable = await checkApiReachable();
      if (!reachable) {
        Alert.alert('Network Error', `Cannot reach server. Check Wi‑Fi and backend.\n${API_ROOT}`);
        return;
      }

      const result = await loginWithPassword(email, password);
      if (result?.success) {
        return;
      }
    } catch (error) {
      Alert.alert('Login Failed', error?.response?.data?.message || error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  if (showIntro) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={[styles.container, styles.introContainer]}>
          <Image source={require('../../assets/logo.png')} style={styles.introLogo} resizeMode="contain" />
          <Text style={styles.introTitle}>UABIndia HRMS</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>UABIndia HRMS</Text>
          <Text style={styles.subtitle}>Sign in with your work email</Text>

          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                mode="outlined"
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(prev => !prev)}
                  />
                }
              />
              <View style={styles.rememberRow}>
                <View style={styles.rememberLeft}>
                  <Checkbox
                    status={rememberMe ? 'checked' : 'unchecked'}
                    onPress={() => setRememberMe(prev => !prev)}
                    color="#16a34a"
                  />
                  <Text style={styles.rememberText}>Remember me</Text>
                </View>
              </View>
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                style={styles.button}
              >
                Login
              </Button>
            </Card.Content>
          </Card>

          <Text style={styles.versionText}>Version 1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    paddingBottom: 24,
  },
  introContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  introLogo: {
    width: 88,
    height: 88,
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16a34a',
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  logo: {
    width: 74,
    height: 74,
  },
  card: {
    elevation: 3,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    fontSize: 13,
    color: '#4b5563',
  },
  versionText: {
    marginTop: 12,
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default LoginScreen;
