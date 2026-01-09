import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get API URL from environment variables
// IMPORTANT: Update this IP to match your computer's IP
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://office-attendance-app.onrender.com/api';

console.log('API Base URL:', API_URL); // Debug log

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds - increased for file uploads
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log the request for debugging
      console.log('API Request:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
      });
      
      return config;
    } catch (error) {
      console.error('Error adding token to request:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  async (error) => {
    console.error('API Response Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      if (status === 401) {
        // Token expired or invalid - logout user
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
      }

      return Promise.reject({
        message: data.message || 'Something went wrong',
        status,
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('No response received:', error.request);
      return Promise.reject({
        message: 'Network error. Please check your connection and ensure the server is running.',
        status: 0,
      });
    } else {
      // Something else happened
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0,
      });
    }
  }
);

export default api;