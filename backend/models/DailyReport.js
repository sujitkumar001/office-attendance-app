const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
    },
    workDone: {
      type: String,
      required: [true, 'Please describe what you did today'],
      minlength: [20, 'Report must be at least 20 characters'],
      maxlength: [2000, 'Report cannot exceed 2000 characters'],
    },
    challenges: {
      type: String,
      maxlength: [1000, 'Challenges section cannot exceed 1000 characters'],
    },
    planForTomorrow: {
      type: String,
      maxlength: [1000, 'Plan for tomorrow cannot exceed 1000 characters'],
    },
    projectsWorkedOn: [
      {
        type: String,
        trim: true,
      },
    ],
    hoursWorked: {
      type: Number,
      min: 0,
      max: 24,
    },
    productivity: {
      type: String,
      enum: ['low', 'medium', 'high', 'excellent'],
      default: 'medium',
    },
    needsManagerReview: {
      type: Boolean,
      default: false,
    },
    managerComments: {
      type: String,
      maxlength: [500, 'Manager comments cannot exceed 500 characters'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to prevent duplicate reports on same day
dailyReportSchema.index({ user: 1, date: 1 }, { unique: true });

// Static method to get reports for a specific month
dailyReportSchema.statics.getMonthlyReports = async function (
  userId,
  year,
  month
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return await this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate },
  })
    .sort({ date: -1 })
    .populate('user', 'name email profileInitial');
};

// Static method to check if report exists for today
dailyReportSchema.statics.hasReportForToday = async function (userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const report = await this.findOne({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  return !!report;
};

module.exports = mongoose.model('DailyReport', dailyReportSchema);