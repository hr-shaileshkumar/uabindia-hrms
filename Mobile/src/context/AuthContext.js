import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_ROOT } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const me = await api.get('/auth/me');
        setUser(me.data);
      }
    } catch (error) {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceId = async () => {
    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const loginWithPassword = async (email, password) => {
    const deviceId = await getDeviceId();
    const response = await api.post('/auth/login', { Email: email, Password: password, DeviceId: deviceId });

    if (response.data?.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
      if (response.data.refresh_token) {
        await AsyncStorage.setItem('refresh_token', response.data.refresh_token);
      }

      const me = await api.get('/auth/me');
      await AsyncStorage.setItem('user', JSON.stringify(me.data));
      setUser(me.data);
      return { success: true };
    }

    throw new Error(response.data?.message || 'Login failed');
  };

  const checkApiReachable = async () => {
    try {
      const res = await fetch(`${API_ROOT}/health`);
      return res.ok;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithPassword, logout, checkApiReachable, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
