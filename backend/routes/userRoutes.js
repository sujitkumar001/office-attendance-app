const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployeeDetails,
  getTeamStats,
  getAttendanceOverview,
  getTodaysBirthdays,
  getUpcomingBirthdays,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Birthday routes - accessible to all authenticated users
router.get('/birthdays/today', protect, getTodaysBirthdays);
router.get('/birthdays/upcoming', protect, getUpcomingBirthdays);

// Manager only routes
router.use(protect);
router.use(authorize('manager'));

router.get('/employees', getAllEmployees);
router.get('/employees/:id', getEmployeeDetails);
router.get('/team-stats', getTeamStats);
router.get('/attendance-overview', getAttendanceOverview);

module.exports = router;