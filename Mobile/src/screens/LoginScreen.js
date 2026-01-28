import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Text, Card, Checkbox } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_SCALE = Math.min(SCREEN_WIDTH / 375, 1);
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 700;

const LoginScreen = ({ navigation }) => {
  const [showIntro, setShowIntro] = useState(true);
  const [loginType, setLoginType] = useState('department');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [adminMode, setAdminMode] = useState('login'); // login | change | reset
  const [resetStep, setResetStep] = useState(1);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMobile, setResetMobile] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { generateOTP, loginWithOtp, loginWithPassword, changePassword, resetPassword, checkApiReachable } = useContext(AuthContext);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadRemembered = async () => {
      try {
        const savedUserId = await AsyncStorage.getItem('rememberedUserId');
        const savedPassword = await AsyncStorage.getItem('rememberedPassword');
        const rememberFlag = await AsyncStorage.getItem('rememberMe');

        if (rememberFlag === 'true') {
          setRememberMe(true);
        }

        if (savedUserId) {
          setUserId(savedUserId);
        }

        if (savedPassword) {
          setPassword(savedPassword);
        }
      } catch (error) {
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
          await AsyncStorage.removeItem('rememberedUserId');
          await AsyncStorage.removeItem('rememberedPassword');
          return;
        }

        await AsyncStorage.setItem('rememberMe', 'true');
        if (userId) {
          await AsyncStorage.setItem('rememberedUserId', userId);
        }
        if (password) {
          await AsyncStorage.setItem('rememberedPassword', password);
        }
      } catch (error) {
        // ignore
      }
    };

    persistRemembered();
  }, [rememberMe, userId, password]);

  const handleGenerateOTP = async () => {
    if (mobileNumber.length !== 10 || !/^\d+$/.test(mobileNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const reachable = await checkApiReachable();
      if (!reachable) {
        Alert.alert('Network Error', `Cannot reach server. Check Wi‑Fi and backend.\n${API_BASE_URL}`);
        return;
      }
      const response = await generateOTP(mobileNumber);
      if (response.success) {
        Alert.alert('OTP Sent', `OTP: ${response.otpCode} (Development Mode)`);
        setStep(2);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const reachable = await checkApiReachable();
      if (!reachable) {
        Alert.alert('Network Error', `Cannot reach server. Check Wi‑Fi and backend.\n${API_BASE_URL}`);
        return;
      }
      const result = await loginWithOtp(mobileNumber, otpCode);
      if (result.success) {
        return;
      }
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!userId || !password) {
      Alert.alert('Error', 'Please enter user ID and password');
      return;
    }

    setLoading(true);
    try {
      const reachable = await checkApiReachable();
      if (!reachable) {
        Alert.alert('Network Error', `Cannot reach server. Check Wi‑Fi and backend.\n${API_BASE_URL}`);
        return;
      }
      const result = await loginWithPassword(userId, password);
      if (result.success) {
        return;
      }
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRememberToggle = () => {
    setRememberMe(prev => !prev);
  };

  const handleChangePassword = async () => {
    if (!userId || !currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill all fields to change password');
      return;
    }

    setLoading(true);
    try {
      const response = await changePassword(userId, currentPassword, newPassword);
      if (response.success) {
        Alert.alert('Success', response.message);
        setAdminMode('login');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async () => {
    if (!userId || resetMobile.length !== 10 || !/^\d+$/.test(resetMobile)) {
      Alert.alert('Error', 'Enter user ID and valid mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await generateOTP(resetMobile);
      if (response.success) {
        Alert.alert('OTP Sent', `OTP: ${response.otpCode} (Development Mode)`);
        setResetStep(2);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userId || !resetMobile || !resetOtp || !newPassword) {
      Alert.alert('Error', 'Please fill all fields to reset password');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(userId, resetMobile, resetOtp, newPassword);
      if (response.success) {
        Alert.alert('Success', response.message);
        setAdminMode('login');
        setResetStep(1);
        setResetOtp('');
        setResetMobile('');
        setNewPassword('');
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (showIntro) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={[styles.container, styles.introContainer]}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.introLogo}
            resizeMode="contain"
          />
          <Text style={styles.introTitle}>UABIndia Hrms</Text>
          <Image
            source={require('../../assets/animal.png')}
            style={styles.introAnimal}
            resizeMode="contain"
          />
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
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>UABIndia Hrms</Text>
        <Text style={styles.subtitle}>
          {loginType === 'mvu'
            ? 'MVU Staff Login'
            : 'Admin / Department Head / Manager Login'}
        </Text>

        <View style={styles.roleRow}>
          {['department', 'mvu'].map((type) => (
            <Button
              key={type}
              mode={loginType === type ? 'contained' : 'outlined'}
              onPress={() => {
                setLoginType(type);
                setStep(1);
                setAdminMode('login');
                setResetStep(1);
              }}
              style={styles.roleButton}
            >
              {type === 'department' ? 'Department' : 'MVU'}
            </Button>
          ))}
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {loginType === 'mvu' ? (
              step === 1 ? (
                <>
                  <TextInput
                    label="Mobile Number"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={styles.input}
                    mode="outlined"
                  />
                  <Button
                    mode="contained"
                    onPress={handleGenerateOTP}
                    loading={loading}
                    style={styles.button}
                  >
                    Generate OTP
                  </Button>
                </>
              ) : (
                <>
                  <TextInput
                    label="Enter OTP"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.input}
                    mode="outlined"
                  />
                  <View style={styles.buttonRow}>
                    <Button
                      mode="outlined"
                      onPress={() => setStep(1)}
                      style={[styles.button, styles.buttonHalf]}
                    >
                      Back
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleVerifyOTP}
                      loading={loading}
                      style={[styles.button, styles.buttonHalf]}
                    >
                      Verify OTP
                    </Button>
                  </View>
                </>
              )
            ) : (
              <>
                {adminMode === 'login' && (
                  <>
                    <TextInput
                      label="User ID"
                      value={userId}
                      onChangeText={setUserId}
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
                          onPress={handleRememberToggle}
                          color="#16a34a"
                        />
                        <Text style={styles.rememberText}>Remember me</Text>
                      </View>
                    </View>
                    <Button
                      mode="contained"
                      onPress={handlePasswordLogin}
                      loading={loading}
                      style={styles.button}
                    >
                      Login
                    </Button>
                    <Text style={styles.helperText}>
                      First time? Use reset password with OTP to set your password.
                    </Text>
                  </>
                )}

                {adminMode === 'change' && (
                  <>
                    <TextInput
                      label="User ID"
                      value={userId}
                      onChangeText={setUserId}
                      style={styles.input}
                      mode="outlined"
                    />
                    <TextInput
                      label="Current Password"
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry
                      style={styles.input}
                      mode="outlined"
                    />
                    <TextInput
                      label="New Password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      style={styles.input}
                      mode="outlined"
                    />
                    <Button
                      mode="contained"
                      onPress={handleChangePassword}
                      loading={loading}
                      style={styles.button}
                    >
                      Update Password
                    </Button>
                  </>
                )}

                {adminMode === 'reset' && (
                  <>
                    <TextInput
                      label="User ID"
                      value={userId}
                      onChangeText={setUserId}
                      style={styles.input}
                      mode="outlined"
                    />
                    <TextInput
                      label="Mobile Number"
                      value={resetMobile}
                      onChangeText={setResetMobile}
                      keyboardType="phone-pad"
                      maxLength={10}
                      style={styles.input}
                      mode="outlined"
                    />
                    {resetStep === 2 && (
                      <>
                        <TextInput
                          label="OTP"
                          value={resetOtp}
                          onChangeText={setResetOtp}
                          keyboardType="number-pad"
                          maxLength={6}
                          style={styles.input}
                          mode="outlined"
                        />
                        <TextInput
                          label="New Password"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry
                          style={styles.input}
                          mode="outlined"
                        />
                      </>
                    )}
                    <Button
                      mode="contained"
                      onPress={resetStep === 1 ? handleSendResetOtp : handleResetPassword}
                      loading={loading}
                      style={styles.button}
                    >
                      {resetStep === 1 ? 'Send OTP' : 'Reset Password'}
                    </Button>
                  </>
                )}

                <View style={styles.modeRow}>
                  {['login', 'change', 'reset'].map((mode) => (
                    <Button
                      key={mode}
                      mode="text"
                      onPress={() => {
                        setAdminMode(mode);
                        setResetStep(1);
                      }}
                      textColor={adminMode === mode ? '#16a34a' : '#6b7280'}
                      style={styles.modeButton}
                      labelStyle={styles.modeButtonLabel}
                    >
                      {mode === 'login' && 'Login'}
                      {mode === 'change' && 'Change Password'}
                      {mode === 'reset' && 'Reset Password'}
                    </Button>
                  ))}
                </View>
              </>
            )}
          </Card.Content>
        </Card>
        <Image
          source={require('../../assets/animal.png')}
          style={styles.animalBanner}
          resizeMode="contain"
        />
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
    width: 88 * BASE_SCALE,
    height: 88 * BASE_SCALE,
    marginBottom: 10,
  },
  introTitle: {
    fontSize: 22 * BASE_SCALE,
    fontWeight: 'bold',
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 12,
  },
  introAnimal: {
    width: '100%',
    height: undefined,
    aspectRatio: IS_SMALL_SCREEN ? 2.4 : 2.1,
  },
  title: {
    fontSize: 26 * BASE_SCALE,
    fontWeight: 'bold',
    color: '#16a34a',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13 * BASE_SCALE,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  logo: {
    width: 74 * BASE_SCALE,
    height: 74 * BASE_SCALE,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
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
  helperText: {
    marginTop: 8,
    fontSize: 11 * BASE_SCALE,
    color: '#6b7280',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  buttonHalf: {
    flex: 0.48,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  modeButton: {
    paddingHorizontal: 6,
  },
  modeButtonLabel: {
    fontSize: 11 * BASE_SCALE,
  },
  versionText: {
    marginTop: 12,
    fontSize: 11 * BASE_SCALE,
    color: '#9ca3af',
    textAlign: 'center',
  },
  animalBanner: {
    width: '100%',
    height: undefined,
    aspectRatio: IS_SMALL_SCREEN ? 2.4 : 2.1,
    marginTop: 12,
  },
});

export default LoginScreen;
