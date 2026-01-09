const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { startOfDay, endOfDay, format } = require('date-fns');

// @desc    Mark attendance (check-in)
// @route   POST /api/attendance/checkin
// @access  Private (Employee/Manager)
exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notes } = req.body;

    // Get start and end of today
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // Check if attendance already marked for today
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: { $gte: startOfToday, $lte: endOfToday },
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for today',
        data: existingAttendance,
      });
    }

    // Check if late (after 10:00 AM)
    const checkInTime = new Date();
    const lateThreshold = new Date(today);
    lateThreshold.setHours(10, 0, 0, 0); // 10:00 AM

    const isLate = checkInTime > lateThreshold;

    // Create attendance record
    const attendance = await Attendance.create({
      user: userId,
      date: startOfToday,
      checkInTime: checkInTime,
      status: isLate ? 'late' : 'present',
      isLate,
      notes: notes || '',
    });

    // Populate user details
    await attendance.populate('user', 'name email profileInitial');

    res.status(201).json({
      success: true,
      message: isLate
        ? 'Attendance marked (Late arrival)'
        : 'Attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Check-in Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message,
    });
  }
};

// @desc    Check-out
// @route   PUT /api/attendance/checkout
// @access  Private (Employee/Manager)
exports.checkOut = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get today's attendance
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: startOfToday, $lte: endOfToday },
    }).populate('user', 'name email profileInitial');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No attendance record found for today. Please check-in first.',
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out for today',
        data: attendance,
      });
    }

    // Update check-out time
    attendance.checkOutTime = new Date();
    attendance.calculateWorkHours();
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Check-out successful',
      data: attendance,
    });
  } catch (error) {
    console.error('Check-out Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during check-out',
      error: error.message,
    });
  }
};

// @desc    Get today's attendance status
// @route   GET /api/attendance/today
// @access  Private (Employee/Manager)
exports.getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: startOfToday, $lte: endOfToday },
    }).populate('user', 'name email profileInitial');

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get Today Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s attendance',
      error: error.message,
    });
  }
};

// @desc    Get attendance history
// @route   GET /api/attendance/history?page=1&limit=10
// @access  Private (Employee/Manager)
exports.getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalRecords = await Attendance.countDocuments({ user: userId });
    const attendances = await Attendance.find({ user: userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email profileInitial');

    res.status(200).json({
      success: true,
      data: {
        attendances,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
          hasMore: page * limit < totalRecords,
        },
      },
    });
  } catch (error) {
    console.error('Get Attendance History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance history',
      error: error.message,
    });
  }
};

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats?days=30
// @access  Private (Employee/Manager)
exports.getAttendanceStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const stats = await Attendance.getAttendanceStats(userId, days);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get Attendance Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance statistics',
      error: error.message,
    });
  }
};

// @desc    Get all employees attendance (Manager only)
// @route   GET /api/attendance/all?date=YYYY-MM-DD
// @access  Private (Manager only)
exports.getAllEmployeesAttendance = async (req, res) => {
  try {
    const dateParam = req.query.date;
    let targetDate;

    if (dateParam) {
      targetDate = new Date(dateParam);
    } else {
      targetDate = new Date();
    }

    const startOfTargetDay = startOfDay(targetDate);
    const endOfTargetDay = endOfDay(targetDate);

    // Get all employees
    const employees = await User.find({ role: 'employee', isActive: true });

    // Get attendance for the target date
    const attendances = await Attendance.find({
      date: { $gte: startOfTargetDay, $lte: endOfTargetDay },
    }).populate('user', 'name email profileInitial');

    // Create a map of user IDs to attendance records
    const attendanceMap = {};
    attendances.forEach((att) => {
      attendanceMap[att.user._id.toString()] = att;
    });

    // Build response with all employees
    const employeeAttendance = employees.map((emp) => {
      const attendance = attendanceMap[emp._id.toString()];
      return {
        employee: {
          id: emp._id,
          name: emp.name,
          email: emp.email,
          profileInitial: emp.profileInitial,
        },
        attendance: attendance || null,
        status: attendance ? attendance.status : 'absent',
      };
    });

    // Calculate summary
    const summary = {
      total: employees.length,
      present: attendances.filter((a) => a.status === 'present').length,
      late: attendances.filter((a) => a.isLate).length,
      absent: employees.length - attendances.length,
      date: format(targetDate, 'yyyy-MM-dd'),
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        employees: employeeAttendance,
      },
    });
  } catch (error) {
    console.error('Get All Employees Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees attendance',
      error: error.message,
    });
  }
};

// @desc    Get monthly attendance report
// @route   GET /api/attendance/monthly?year=2026&month=1
// @access  Private (Employee/Manager)
exports.getMonthlyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const attendances = await Attendance.getMonthlyAttendance(
      userId,
      year,
      month
    );

    // Calculate monthly stats
    const totalDays = attendances.length;
    const presentDays = attendances.filter((a) => a.status === 'present')
      .length;
    const lateDays = attendances.filter((a) => a.isLate).length;
    const totalWorkHours = attendances.reduce((sum, a) => sum + a.workHours, 0);

    res.status(200).json({
      success: true,
      data: {
        year,
        month,
        attendances,
        summary: {
          totalDays,
          presentDays,
          lateDays,
          totalWorkHours: Math.round(totalWorkHours * 100) / 100,
          averageWorkHours:
            totalDays > 0
              ? Math.round((totalWorkHours / totalDays) * 100) / 100
              : 0,
        },
      },
    });
  } catch (error) {
    console.error('Get Monthly Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly attendance',
      error: error.message,
    });
  }
};