const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  addComment,
  uploadAttachment,
  deleteAttachment,
  deleteTask,
  getTaskStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

// Get task statistics (must be before /:id routes)
router.get('/stats', protect, getTaskStats);

// Task CRUD
router.post('/', protect, authorize('manager'), createTask);
router.get('/', protect, getTasks);
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, authorize('manager'), deleteTask);

// Status update
router.patch('/:id/status', protect, updateTaskStatus);

// Comments
router.post('/:id/comments', protect, addComment);

// Attachments
router.post('/:id/attachments', protect, upload.single('file'), uploadAttachment);
router.delete('/:id/attachments/:attachmentId', protect, deleteAttachment);

module.exports = router;