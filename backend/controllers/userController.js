const User = require('../models/User');
const Attendance = require('../models/Attendance');
const DailyReport = require('../models/DailyReport');
const { startOfDay, endOfDay, subDays } = require('date-fns');

// @desc    Get today's birthdays
// @route   GET /api/users/birthdays/today
// @access  Private
exports.getTodaysBirthdays = async (req, res) => {
  try {
    const birthdays = await User.getTodaysBirthdays();
    
    res.status(200).json({
      success: true,
      data: birthdays,
      count: birthdays.length,
    });
  } catch (error) {
    console.error('Get Todays Birthdays Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching birthdays',
      error: error.message,
    });
  }
};

// @desc    Get upcoming birthdays (next 7 days)
// @route   GET /api/users/birthdays/upcoming
// @access  Private
exports.getUpcomingBirthdays = async (req, res) => {
  try {
    const today = new Date();
    const allUsers = await User.find({ isActive: true }).select('name email role dateOfBirth profileInitial');
    
    const upcomingBirthdays = [];
    
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      
      const month = checkDate.getMonth() + 1;
      const day = checkDate.getDate();
      
      allUsers.forEach(user => {
        if (!user.dateOfBirth) return;
        const dob = new Date(user.dateOfBirth);
        
        if ((dob.getMonth() + 1) === month && dob.getDate() === day) {
          upcomingBirthdays.push({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileInitial: user.profileInitial,
            dateOfBirth: user.dateOfBirth,
            daysUntil: i,
            date: checkDate,
          });
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: upcomingBirthdays,
      count: upcomingBirthdays.length,
    });
  } catch (error) {
    console.error('Get Upcoming Birthdays Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming birthdays',
      error: error.message,
    });
  }
};

// @desc    Get all employees (Manager only)
// @route   GET /api/users/employees
// @access  Private (Manager only)
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const employeesWithStatus = await Promise.all(
      employees.map(async (employee) => {
        const todayAttendance = await Attendance.findOne({
          user: employee._id,
          date: { $gte: startOfToday, $lte: endOfToday },
        });

        const todayReport = await DailyReport.findOne({
          user: employee._id,
          date: { $gte: startOfToday, $lte: endOfToday },
        });

        return {
          ...employee.toObject(),
          isBirthdayToday: employee.isBirthdayToday(),
          age: employee.getAge(),
          todayStatus: {
            hasAttendance: !!todayAttendance,
            hasReport: !!todayReport,
            checkInTime: todayAttendance?.checkInTime || null,
            checkOutTime: todayAttendance?.checkOutTime || null,
            isLate: todayAttendance?.isLate || false,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: employeesWithStatus,
    });
  } catch (error) {
    console.error('Get All Employees Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message,
    });
  }
};

// @desc    Get employee details with stats
// @route   GET /api/users/employees/:id
// @access  Private (Manager only)
exports.getEmployeeDetails = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const employee = await User.findById(employeeId).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const thirtyDaysAgo = subDays(new Date(), 30);

    const [attendanceCount, reportCount, avgWorkHours] = await Promise.all([
      Attendance.countDocuments({
        user: employeeId,
        date: { $gte: thirtyDaysAgo },
      }),
      DailyReport.countDocuments({
        user: employeeId,
        date: { $gte: thirtyDaysAgo },
      }),
      Attendance.aggregate([
        {
          $match: {
            user: employee._id,
            date: { $gte: thirtyDaysAgo },
            workHours: { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            avgHours: { $avg: '$workHours' },
          },
        },
      ]),
    ]);

    const stats = {
      attendanceDays: attendanceCount,
      reportsSubmitted: reportCount,
      averageWorkHours:
        avgWorkHours.length > 0
          ? Math.round(avgWorkHours[0].avgHours * 100) / 100
          : 0,
      attendancePercentage: Math.round((attendanceCount / 30) * 100),
    };

    res.status(200).json({
      success: true,
      data: {
        employee: {
          ...employee.toObject(),
          isBirthdayToday: employee.isBirthdayToday(),
          age: employee.getAge(),
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Get Employee Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee details',
      error: error.message,
    });
  }
};

// @desc    Get team statistics
// @route   GET /api/users/team-stats
// @access  Private (Manager only)
exports.getTeamStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const thirtyDaysAgo = subDays(today, 30);

    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: startOfToday, $lte: endOfToday },
    });
    const todayReports = await DailyReport.countDocuments({
      date: { $gte: startOfToday, $lte: endOfToday },
    });
    const lateToday = await Attendance.countDocuments({
      date: { $gte: startOfToday, $lte: endOfToday },
      isLate: true,
    });
    const reportsNeedingReview = await DailyReport.countDocuments({
      needsManagerReview: true,
      reviewedAt: null,
    });

    // Get today's birthdays
    const todaysBirthdays = await User.getTodaysBirthdays();

    const avgAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const avgAttendancePercentage =
      totalEmployees > 0
        ? Math.round(
            (avgAttendance.reduce((sum, day) => sum + day.count, 0) /
              (avgAttendance.length * totalEmployees)) *
              100
          )
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        todayAttendance,
        todayReports,
        lateToday,
        reportsNeedingReview,
        avgAttendancePercentage,
        attendanceRate: totalEmployees > 0 
          ? Math.round((todayAttendance / totalEmployees) * 100) 
          : 0,
        reportSubmissionRate: totalEmployees > 0
          ? Math.round((todayReports / totalEmployees) * 100)
          : 0,
        todaysBirthdays: todaysBirthdays.length,
        birthdayPeople: todaysBirthdays,
      },
    });
  } catch (error) {
    console.error('Get Team Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team statistics',
      error: error.message,
    });
  }
};

// @desc    Get attendance overview for all employees
// @route   GET /api/users/attendance-overview?date=YYYY-MM-DD
// @access  Private (Manager only)
exports.getAttendanceOverview = async (req, res) => {
  try {
    const dateParam = req.query.date;
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfTargetDay = startOfDay(targetDate);
    const endOfTargetDay = endOfDay(targetDate);

    const employees = await User.find({ role: 'employee' }).select(
      'name email profileInitial dateOfBirth'
    );

    const attendanceRecords = await Attendance.find({
      date: { $gte: startOfTargetDay, $lte: endOfTargetDay },
    }).populate('user', 'name email profileInitial dateOfBirth');

    const overview = employees.map((employee) => {
      const attendance = attendanceRecords.find(
        (record) => record.user._id.toString() === employee._id.toString()
      );

      return {
        employee: {
          _id: employee._id,
          name: employee.name,
          email: employee.email,
          profileInitial: employee.profileInitial,
          isBirthdayToday: employee.isBirthdayToday(),
        },
        attendance: attendance || null,
        status: attendance
          ? attendance.checkOutTime
            ? 'completed'
            : 'present'
          : 'absent',
      };
    });

    res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        overview,
        summary: {
          total: employees.length,
          present: overview.filter((o) => o.status !== 'absent').length,
          absent: overview.filter((o) => o.status === 'absent').length,
          late: attendanceRecords.filter((a) => a.isLate).length,
          birthdays: overview.filter((o) => o.employee.isBirthdayToday).length,
        },
      },
    });
  } catch (error) {
    console.error('Get Attendance Overview Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance overview',
      error: error.message,
    });
  }
};