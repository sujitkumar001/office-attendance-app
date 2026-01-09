const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceHistory,
  getAttendanceStats,
  getAllEmployeesAttendance,
  getMonthlyAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const Attendance = require('../models/Attendance');


// Employee & Manager routes
router.post('/checkin', protect, checkIn);
router.put('/checkout', protect, checkOut);
router.get('/today', protect, getTodayAttendance);
router.get('/history', protect, getAttendanceHistory);
router.get('/stats', protect, getAttendanceStats);
router.get('/monthly', protect, getMonthlyAttendance);

// Manager only routes
router.get('/all', protect, authorize('manager'), getAllEmployeesAttendance);
// Get attendance of a specific employee (Manager only)
router.get(
  '/employee/:employeeId',
  protect,
  authorize('manager'),
  async (req, res) => {
    try {
      const { employeeId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 30;
      const skip = (page - 1) * limit;

      const attendances = await Attendance.find({ user: employeeId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        success: true,
        data: {
          attendances,
        },
      });
    } catch (error) {
      console.error('Get employee attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employee attendance',
      });
    }
  }
);



module.exports = router;