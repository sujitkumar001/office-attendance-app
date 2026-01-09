import api from './api';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class TaskService {
  // Create task (Manager only)
  async createTask(taskData) {
    try {
      const response = await api.post('/tasks', taskData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Create Task Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create task',
      };
    }
  }

  // Get all tasks with optional filters
  async getTasks(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.assignedTo) queryParams.append('assignedTo', filters.assignedTo);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await api.get(`/tasks?${queryParams.toString()}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get Tasks Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch tasks',
        data: [],
      };
    }
  }

  // Get single task by ID
  async getTaskById(taskId) {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get Task Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch task details',
      };
    }
  }

  // Update task
  async updateTask(taskId, updateData) {
    try {
      const response = await api.put(`/tasks/${taskId}`, updateData);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Update Task Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update task',
      };
    }
  }

  // Update task status
  async updateTaskStatus(taskId, status) {
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, { status });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Update Status Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update status',
      };
    }
  }

  // Delete task
  async deleteTask(taskId) {
    try {
      await api.delete(`/tasks/${taskId}`);
      return {
        success: true,
        message: 'Task deleted successfully',
      };
    } catch (error) {
      console.error('Delete Task Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete task',
      };
    }
  }

  // Add comment
  async addComment(taskId, commentText) {
    try {
      const response = await api.post(`/tasks/${taskId}/comments`, {
        text: commentText,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Add Comment Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to add comment',
      };
    }
  }

  // Pick document using DocumentPicker
  async pickDocument() {
    try {
      console.log('Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        return {
          success: false,
          message: 'Document selection cancelled',
        };
      }

      const file = result.assets[0];
      console.log('Selected file:', {
        uri: file.uri,
        name: file.name,
        size: file.size,
        type: file.mimeType,
      });

      return {
        success: true,
        data: {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
          size: file.size,
        },
      };
    } catch (error) {
      console.error('Pick document error:', error);
      return {
        success: false,
        message: error.message || 'Failed to pick document',
      };
    }
  }

  // Upload attachment - USING FETCH API (most reliable for React Native)
  async uploadAttachment(taskId, fileUri, fileName, fileType) {
    try {
      console.log('=== UPLOAD START ===');
      console.log('Task ID:', taskId);
      console.log('File URI:', fileUri);
      console.log('File Name:', fileName);
      console.log('File Type:', fileType);

      // Get the token
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create FormData
      const formData = new FormData();
      
      // Add file to FormData with proper structure for React Native
      formData.append('file', {
        uri: fileUri,
        type: fileType,
        name: fileName,
      });

      const url = `https://office-attendance-app.onrender.com/api/tasks/${taskId}/attachments`;
      console.log('Making fetch request to:', url);

      // Use fetch API instead of axios - more reliable for file uploads in React Native
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let the browser handle it
        },
        body: formData,
      });

      console.log('=== FETCH RESPONSE RECEIVED ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Upload failed');
      }

      console.log('=== UPLOAD SUCCESS ===');

      return {
        success: true,
        data: responseData.data,
      };
    } catch (error) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error type:', error.constructor.name);
      
      return {
        success: false,
        message: error.message || 'Failed to upload attachment',
      };
    }
  }

  // Delete attachment
  async deleteAttachment(taskId, attachmentId) {
    try {
      const response = await api.delete(
        `/tasks/${taskId}/attachments/${attachmentId}`
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Delete Attachment Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete attachment',
      };
    }
  }

  // Get task statistics
  async getTaskStats() {
    try {
      const response = await api.get('/tasks/stats');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get Task Stats Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch task statistics',
      };
    }
  }

  // Download attachment (for opening files)
  async downloadAttachment(fileUrl) {
    try {
      console.log('Downloading attachment from:', fileUrl);
      
      // Simply return the fileUrl - the OS will handle opening it
      return {
        success: true,
        url: fileUrl,
      };
    } catch (error) {
      console.error('Download Attachment Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to download attachment',
      };
    }
  }
}

export default new TaskService();