import api from './api';

class ReportService {
  // Create daily report
  async createReport(reportData) {
    try {
      const response = await api.post('/reports', reportData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Create report error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create report',
      };
    }
  }

  // Get today's report
  async getTodayReport() {
    try {
      const response = await api.get('/reports/today');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get today report error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch report',
      };
    }
  }

  // Get report history
  async getReportHistory(page = 1, limit = 10) {
    try {
      const response = await api.get(`/reports/history?page=${page}&limit=${limit}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get report history error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch history',
      };
    }
  }

  // Update report
  async updateReport(reportId, reportData) {
    try {
      const response = await api.put(`/reports/${reportId}`, reportData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update report error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update report',
      };
    }
  }

  // Delete report
  async deleteReport(reportId) {
    try {
      const response = await api.delete(`/reports/${reportId}`);
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Delete report error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete report',
      };
    }
  }

  // Get report statistics
  async getReportStats(year, month) {
    try {
      const response = await api.get(`/reports/stats?year=${year}&month=${month}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get report stats error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch statistics',
      };
    }
  }

  // Get all employee reports (Manager only)
  async getAllEmployeeReports(date = null, needsReview = false) {
    try {
      let url = '/reports/all';
      const params = [];
      
      if (date) params.push(`date=${date}`);
      if (needsReview) params.push('needsReview=true');
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      const response = await api.get(url);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get all employee reports error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch employee reports',
      };
    }
  }

  // Add manager review (Manager only)
  async addManagerReview(reportId, comments) {
    try {
      const response = await api.put(`/reports/${reportId}/review`, {
        managerComments: comments,
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Add manager review error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to add review',
      };
    }
  }
}

export default new ReportService();