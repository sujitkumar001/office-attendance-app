const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
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
    checkInTime: {
      type: Date,
      required: true,
    },
    checkOutTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'late'],
      default: 'present',
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    workHours: {
      type: Number, // in hours
      default: 0,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index to prevent duplicate attendance on same day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Method to calculate work hours
attendanceSchema.methods.calculateWorkHours = function () {
  if (this.checkOutTime && this.checkInTime) {
    const diffMs = this.checkOutTime - this.checkInTime;
    this.workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
  }
  return this.workHours;
};

// Static method to get attendance for a specific month
attendanceSchema.statics.getMonthlyAttendance = async function (
  userId,
  year,
  month
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return await this.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate },
  }).sort({ date: -1 });
};

// Static method to get attendance statistics
attendanceSchema.statics.getAttendanceStats = async function (
  userId,
  days = 30
) {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (days - 1));

  const attendances = await this.find({
    user: userId,
    date: { $gte: startDate },
  });

  const presentDays = attendances.length;

  const lateDays = attendances.filter(
    (a) => a.isLate === true
  ).length;

  const totalWorkHours = attendances.reduce(
    (sum, a) => sum + (a.workHours || 0),
    0
  );

  const absentDays = Math.max(0, days - presentDays);

  const attendancePercentage = Math.round(
    (presentDays / days) * 100
  );

  return {
    periodDays: days,
    presentDays,
    absentDays,
    lateDays,
    totalWorkHours: Math.round(totalWorkHours * 100) / 100,
    averageWorkHours:
      presentDays > 0
        ? Math.round((totalWorkHours / presentDays) * 100) / 100
        : 0,
    attendancePercentage,
  };
};



module.exports = mongoose.model('Attendance', attendanceSchema);