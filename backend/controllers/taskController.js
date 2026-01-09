const Task = require('../models/Task');
const User = require('../models/User');
const path = require('path');
const fs = require('fs').promises;

// @desc    Create new task (Manager only)
// @route   POST /api/tasks
// @access  Private (Manager)
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, tags } = req.body;

    // Validate assigned user exists and is an employee
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: 'Assigned user not found',
      });
    }

    if (assignedUser.role !== 'employee') {
      return res.status(400).json({
        success: false,
        message: 'Tasks can only be assigned to employees',
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      priority: priority || 'medium',
      dueDate,
      tags: tags || [],
    });

    // Populate user details
    await task.populate([
      { path: 'assignedTo', select: 'name email profileInitial' },
      { path: 'assignedBy', select: 'name email profileInitial' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message,
    });
  }
};

// @desc    Get all tasks (filtered by role)
// @route   GET /api/tasks?status=pending&priority=high&page=1&limit=10
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build query based on user role
    let query = {};
    if (req.user.role === 'manager') {
      query.assignedBy = req.user.id;
    } else {
      query.assignedTo = req.user.id;
    }

    // Add filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const totalRecords = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email profileInitial')
      .populate('assignedBy', 'name email profileInitial')
      .populate('comments.user', 'name email profileInitial')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
          hasMore: page * limit < totalRecords,
        },
      },
    });
  } catch (error) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message,
    });
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email profileInitial')
      .populate('assignedBy', 'name email profileInitial')
      .populate('comments.user', 'name email profileInitial')
      .populate('attachments.uploadedBy', 'name email profileInitial');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user has access to this task
    if (
      task.assignedTo._id.toString() !== req.user.id &&
      task.assignedBy._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Get Task By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: error.message,
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check permissions
    const canEdit = task.canEdit(req.user.id);
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task',
      });
    }

    const { title, description, priority, dueDate, status, tags } = req.body;

    // Update fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (tags) task.tags = tags;

    // Only allow status updates from assigned employee or manager
    if (status) {
      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
      }
    }

    await task.save();

    // Populate and return
    await task.populate([
      { path: 'assignedTo', select: 'name email profileInitial' },
      { path: 'assignedBy', select: 'name email profileInitial' },
      { path: 'comments.user', select: 'name email profileInitial' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message,
    });
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status',
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user can update status
    if (
      task.assignedTo.toString() !== req.user.id &&
      task.assignedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task',
      });
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }

    await task.save();

    await task.populate([
      { path: 'assignedTo', select: 'name email profileInitial' },
      { path: 'assignedBy', select: 'name email profileInitial' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      data: task,
    });
  } catch (error) {
    console.error('Update Task Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task status',
      error: error.message,
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide comment text',
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user has access to this task
    if (
      task.assignedTo.toString() !== req.user.id &&
      task.assignedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this task',
      });
    }

    task.comments.push({
      user: req.user.id,
      text: text.trim(),
    });

    await task.save();

    await task.populate([
      { path: 'assignedTo', select: 'name email profileInitial' },
      { path: 'assignedBy', select: 'name email profileInitial' },
      { path: 'comments.user', select: 'name email profileInitial' },
    ]);

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: task,
    });
  } catch (error) {
    console.error('Add Comment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message,
    });
  }
};

// @desc    Upload attachment to task
// @route   POST /api/tasks/:id/attachments
// @access  Private
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    console.log('File upload request:', {
      file: req.file,
      taskId: req.params.id,
      userId: req.user.id,
    });

    const task = await Task.findById(req.params.id);

    if (!task) {
      // Delete uploaded file if task not found
      await fs.unlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user has access to this task
    if (
      task.assignedTo.toString() !== req.user.id &&
      task.assignedBy.toString() !== req.user.id
    ) {
      // Delete uploaded file if not authorized
      await fs.unlink(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload to this task',
      });
    }

    // CRITICAL FIX: Create accessible URL instead of just storing file path
    // Get the protocol and host from the request
    const protocol = req.protocol; // 'http' or 'https'
    const host = req.get('host'); // 'localhost:5000' or your server address
    
    // Construct the full URL - this is what the frontend needs
    // Replace backslashes with forward slashes for Windows compatibility
    const relativePath = req.file.path.replace(/\\/g, '/');
    const fileUrl = `${protocol}://${host}/${relativePath}`;

    console.log('Generated file URL:', fileUrl);

    // Add attachment to task with the accessible URL
    task.attachments.push({
      fileName: req.file.originalname,
      filePath: req.file.path, // Keep local path for deletion
      fileUrl: fileUrl, // Add accessible URL for frontend
      fileSize: req.file.size,
      mimeType: req.file.mimetype, // Add mime type
      uploadedBy: req.user.id,
    });

    await task.save();

    await task.populate([
      { path: 'assignedTo', select: 'name email profileInitial' },
      { path: 'assignedBy', select: 'name email profileInitial' },
      { path: 'attachments.uploadedBy', select: 'name email profileInitial' },
    ]);

    console.log('File uploaded successfully:', {
      fileName: req.file.originalname,
      fileUrl: fileUrl,
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: task,
    });
  } catch (error) {
    console.error('Upload Attachment Error:', error);
    // Try to delete uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message,
    });
  }
};

// @desc    Delete attachment from task
// @route   DELETE /api/tasks/:id/attachments/:attachmentId
// @access  Private
exports.deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const attachment = task.attachments.id(req.params.attachmentId);

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    // Check if user can delete (uploader or manager)
    if (
      attachment.uploadedBy.toString() !== req.user.id &&
      task.assignedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this attachment',
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(attachment.filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Remove attachment from task
    attachment.deleteOne();
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('Delete Attachment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting attachment',
      error: error.message,
    });
  }
};

// @desc    Delete task (Manager only)
// @route   DELETE /api/tasks/:id
// @access  Private (Manager)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Only manager who created the task can delete
    if (task.assignedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task',
      });
    }

    // Delete all attachments from filesystem
    for (const attachment of task.attachments) {
      try {
        await fs.unlink(attachment.filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message,
    });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
exports.getTaskStats = async (req, res) => {
  try {
    const stats = await Task.getTaskStats(req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get Task Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task statistics',
      error: error.message,
    });
  }
};