const express = require('express');
const router = express.Router();
const {
  createReport,
  getTodayReport,
  getReportHistory,
  updateReport,
  deleteReport,
  getAllEmployeeReports,
  addManagerReview,
  getReportStats,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// All routes require authentication
router.use(protect);

// Employee & Manager routes (both roles can access)
router.post('/', createReport);
router.get('/today', getTodayReport);
router.get('/history', getReportHistory);
router.get('/stats', getReportStats);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

// Manager only routes
router.get('/all', authorize('manager'), getAllEmployeeReports);
router.put('/:id/review', authorize('manager'), addManagerReview);

module.exports = router;