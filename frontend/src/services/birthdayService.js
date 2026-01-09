import api from './api';

class BirthdayService {
  // Get today's birthdays
  async getTodaysBirthdays() {
    try {
      const response = await api.get('/users/birthdays/today');
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      console.error('Get todays birthdays error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch birthdays',
      };
    }
  }

  // Get upcoming birthdays
  async getUpcomingBirthdays() {
    try {
      const response = await api.get('/users/birthdays/upcoming');
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } catch (error) {
      console.error('Get upcoming birthdays error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch upcoming birthdays',
      };
    }
  }
}

export default new BirthdayService();