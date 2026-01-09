const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

const attachmentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true, // Add this field for accessible URL
  },
  fileSize: {
    type: Number, // in bytes
  },
  mimeType: {
    type: String, // Add mime type for proper file handling
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide task title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide task description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'review', 'completed', 'cancelled'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    attachments: [attachmentSchema],
    comments: [commentSchema],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ assignedBy: 1 });
taskSchema.index({ dueDate: 1 });

// Virtual for checking if task is overdue
taskSchema.virtual('isOverdue').get(function () {
  return this.dueDate < new Date() && this.status !== 'completed';
});

// Method to check if user can edit task
taskSchema.methods.canEdit = function (userId) {
  return (
    this.assignedTo.toString() === userId.toString() ||
    this.assignedBy.toString() === userId.toString()
  );
};

// Static method to get task statistics for user
taskSchema.statics.getTaskStats = async function (userId, role) {
  const query = role === 'manager' ? { assignedBy: userId } : { assignedTo: userId };

  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const statusCounts = {
    pending: 0,
    'in-progress': 0,
    review: 0,
    completed: 0,
    cancelled: 0,
  };

  stats.forEach((stat) => {
    statusCounts[stat._id] = stat.count;
  });

  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  return {
    ...statusCounts,
    total,
  };
};

module.exports = mongoose.model('Task', taskSchema);