import api from './api';

class AttendanceService {
  // Check-in
  async checkIn(notes = '') {
    try {
      const response = await api.post('/attendance/checkin', { notes });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Check-in error:', error);
      return {
        success: false,
        message: error.message || 'Failed to check-in',
      };
    }
  }

  // Check-out
  async checkOut() {
    try {
      const response = await api.put('/attendance/checkout');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Check-out error:', error);
      return {
        success: false,
        message: error.message || 'Failed to check-out',
      };
    }
  }

  // Get today's attendance
  async getTodayAttendance() {
    try {
      const response = await api.get('/attendance/today');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get today attendance error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch attendance',
      };
    }
  }

  // Get attendance history
  async getAttendanceHistory(page = 1, limit = 10) {
    try {
      const response = await api.get(
        `/attendance/history?page=${page}&limit=${limit}`
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get attendance history error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch history',
      };
    }
  }

  // Get specific employee's attendance (Manager only)
  async getEmployeeAttendance(employeeId, page = 1, limit = 30) {
    try {
      const response = await api.get(
        `/attendance/employee/${employeeId}?page=${page}&limit=${limit}`
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get employee attendance error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch employee attendance',
      };
    }
  }

  // Get attendance statistics
  async getAttendanceStats(days = 30) {
    try {
      const response = await api.get(`/attendance/stats?days=${days}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get attendance stats error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch statistics',
      };
    }
  }

  // Get monthly attendance
  async getMonthlyAttendance(year, month) {
    try {
      const response = await api.get(
        `/attendance/monthly?year=${year}&month=${month}`
      );
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get monthly attendance error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch monthly attendance',
      };
    }
  }

  // Get all employees attendance (Manager only)
  async getAllEmployeesAttendance(date = null) {
    try {
      const url = date
        ? `/attendance/all?date=${date}`
        : '/attendance/all';
      const response = await api.get(url);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get all employees attendance error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch employees attendance',
      };
    }
  }
}

export default new AttendanceService();