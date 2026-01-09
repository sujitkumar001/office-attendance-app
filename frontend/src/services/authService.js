import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        // Store token and user data
        await AsyncStorage.setItem('userToken', response.data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
        
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Registration failed',
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        // Store token and user data
        await AsyncStorage.setItem('userToken', response.data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
        
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }
      
      return {
        success: false,
        message: response.data.message || 'Login failed',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed',
      };
    }
  }

  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local storage
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      return { success: true };
    }
  }

  // Get current user data
  async getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        // Update stored user data
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.data.user));
        return {
          success: true,
          data: response.data.data.user,
        };
      }
      
      return {
        success: false,
        message: 'Failed to fetch user data',
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch user data',
      };
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('userToken');
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Get stored user data
  async getStoredUserData() {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }
}

export default new AuthService();