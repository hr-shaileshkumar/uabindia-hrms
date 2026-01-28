import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginWithOtp = async (mobileNumber, otpCode) => {
    const response = await api.post('/auth/verify-otp', {
      mobileNumber,
      otpCode,
    });

    if (response.data.success) {
      const { token, user } = response.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    }

    throw new Error(response.data.message);
  };

  const loginWithPassword = async (userId, password) => {
    const response = await api.post('/auth/login', { userId, password });

    if (response.data.success) {
      const { token, user } = response.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    }

    throw new Error(response.data.message);
  };

  const generateOTP = async (mobileNumber) => {
    const response = await api.post('/auth/generate-otp', { mobileNumber });
    return response.data;
  };

  const checkApiReachable = async () => {
    try {
      await api.get('/health');
      return true;
    } catch (error) {
      return Boolean(error?.response);
    }
  };

  const changePassword = async (userId, currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      userId,
      currentPassword,
      newPassword,
    });
    return response.data;
  };

  const resetPassword = async (userId, mobileNumber, otpCode, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      userId,
      mobileNumber,
      otpCode,
      newPassword,
    });
    return response.data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithOtp, loginWithPassword, logout, generateOTP, changePassword, resetPassword, checkApiReachable, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
