import axios from 'axios';
import { Platform } from 'react-native';

// API Configuration
// Development defaults:
// - iOS simulator: http://localhost:5000/api
// - Android emulator (default): http://10.0.2.2:5000/api
// You can override by setting environment variable API_BASE_URL when building/running.

const defaultLocal = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

export const API_BASE_URL = (__DEV__ && (process.env.API_BASE_URL || defaultLocal)) || 'https://your-api-domain.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await require('@react-native-async-storage/async-storage').default.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
