import api from './api';

class UserService {
  // Get all employees (Manager only)
  async getAllEmployees() {
    try {
      const response = await api.get('/users/employees');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get all employees error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch employees',
      };
    }
  }

  // Get employee details
  async getEmployeeDetails(employeeId) {
    try {
      const response = await api.get(`/users/employees/${employeeId}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get employee details error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch employee details',
      };
    }
  }

  // Get team statistics
  async getTeamStats() {
    try {
      const response = await api.get('/users/team-stats');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get team stats error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch team statistics',
      };
    }
  }

  // Get attendance overview
  async getAttendanceOverview(date = null) {
    try {
      let url = '/users/attendance-overview';
      if (date) {
        url += `?date=${date}`;
      }
      const response = await api.get(url);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Get attendance overview error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch attendance overview',
      };
    }
  }

  

}

export default new UserService();