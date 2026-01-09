const DailyReport = require('../models/DailyReport');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { startOfDay, endOfDay, format } = require('date-fns');

// @desc    Create daily report
// @route   POST /api/reports
// @access  Private (Employee/Manager)
exports.createReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      workDone,
      challenges,
      planForTomorrow,
      projectsWorkedOn,
      hoursWorked,
      productivity,
      needsManagerReview,
    } = req.body;

    // Validate required fields
    if (!workDone) {
      return res.status(400).json({
        success: false,
        message: 'Please describe what you did today',
      });
    }

    if (workDone.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Report must be at least 20 characters',
      });
    }

    // Get start and end of today
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    // Check if report already exists for today
    const existingReport = await DailyReport.findOne({
      user: userId,
      date: { $gte: startOfToday, $lte: endOfToday },
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a report for today',
        data: existingReport,
      });
    }

    // Check if user has attendance for today
    const attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: startOfToday, $lte: endOfToday },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'Please mark your attendance first before submitting a report',
      });
    }

    // Create daily report
    const report = await DailyReport.create({
      user: userId,
      date: startOfToday,
      attendance: attendance._id,
      workDone,
      challenges: challenges || '',
      planForTomorrow: planForTomorrow || '',
      projectsWorkedOn: projectsWorkedOn || [],
      hoursWorked: hoursWorked || attendance.workHours || 0,
      productivity: productivity || 'medium',
      needsManagerReview: needsManagerReview || false,
    });

    // Populate user details
    await report.populate('user', 'name email profileInitial');

    res.status(201).json({
      success: true,
      message: 'Daily report submitted successfully',
      data: report,
    });
  } catch (error) {
    console.error('Create Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating daily report',
      error: error.message,
    });
  }
};

// @desc    Get today's report
// @route   GET /api/reports/today
// @access  Private (Employee/Manager)
exports.getTodayReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const report = await DailyReport.findOne({
      user: userId,
      date: { $gte: startOfToday, $lte: endOfToday },
    })
      .populate('user', 'name email profileInitial')
      .populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Get Today Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s report',
      error: error.message,
    });
  }
};

// @desc    Get report history
// @route   GET /api/reports/history?page=1&limit=10
// @access  Private (Employee/Manager)
exports.getReportHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalRecords = await DailyReport.countDocuments({ user: userId });
    const reports = await DailyReport.find({ user: userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email profileInitial')
      .populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalRecords,
          hasMore: page * limit < totalRecords,
        },
      },
    });
  } catch (error) {
    console.error('Get Report History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report history',
      error: error.message,
    });
  }
};

// @desc    Update daily report
// @route   PUT /api/reports/:id
// @access  Private (Employee/Manager)
exports.updateReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const reportId = req.params.id;
    const {
      workDone,
      challenges,
      planForTomorrow,
      projectsWorkedOn,
      hoursWorked,
      productivity,
      needsManagerReview,
    } = req.body;

    // Find report
    const report = await DailyReport.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Check if user owns this report
    if (report.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this report',
      });
    }

    // Check if report is from today (can only edit today's report)
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    if (report.date < startOfToday || report.date > endOfToday) {
      return res.status(400).json({
        success: false,
        message: 'You can only edit today\'s report',
      });
    }

    // Update fields
    if (workDone) report.workDone = workDone;
    if (challenges !== undefined) report.challenges = challenges;
    if (planForTomorrow !== undefined) report.planForTomorrow = planForTomorrow;
    if (projectsWorkedOn) report.projectsWorkedOn = projectsWorkedOn;
    if (hoursWorked !== undefined) report.hoursWorked = hoursWorked;
    if (productivity) report.productivity = productivity;
    if (needsManagerReview !== undefined)
      report.needsManagerReview = needsManagerReview;

    await report.save();
    await report.populate('user', 'name email profileInitial');

    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: report,
    });
  } catch (error) {
    console.error('Update Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message,
    });
  }
};

// @desc    Delete daily report
// @route   DELETE /api/reports/:id
// @access  Private (Employee/Manager)
exports.deleteReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const reportId = req.params.id;

    const report = await DailyReport.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    // Check if user owns this report
    if (report.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this report',
      });
    }

    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Delete Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report',
      error: error.message,
    });
  }
};

// @desc    Get all employee reports (Manager only)
// @route   GET /api/reports/all?date=YYYY-MM-DD&needsReview=true
// @access  Private (Manager only)
exports.getAllEmployeeReports = async (req, res) => {
  try {
    const dateParam = req.query.date;
    const needsReview = req.query.needsReview === 'true';
    let query = {};

    if (dateParam) {
      const targetDate = new Date(dateParam);
      const startOfTargetDay = startOfDay(targetDate);
      const endOfTargetDay = endOfDay(targetDate);
      query.date = { $gte: startOfTargetDay, $lte: endOfTargetDay };
    }

    if (needsReview) {
      query.needsManagerReview = true;
    }

    const reports = await DailyReport.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('user', 'name email profileInitial role')
      .populate('reviewedBy', 'name email');

    // Get summary
    const summary = {
      total: reports.length,
      needsReview: reports.filter((r) => r.needsManagerReview).length,
      reviewed: reports.filter((r) => r.reviewedAt).length,
      date: dateParam ? format(new Date(dateParam), 'yyyy-MM-dd') : 'all',
    };

    res.status(200).json({
      success: true,
      data: {
        summary,
        reports,
      },
    });
  } catch (error) {
    console.error('Get All Employee Reports Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee reports',
      error: error.message,
    });
  }
};

// @desc    Add manager comment to report
// @route   PUT /api/reports/:id/review
// @access  Private (Manager only)
exports.addManagerReview = async (req, res) => {
  try {
    const managerId = req.user.id;
    const reportId = req.params.id;
    const { managerComments } = req.body;

    if (!managerComments) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your comments',
      });
    }

    const report = await DailyReport.findById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found',
      });
    }

    report.managerComments = managerComments;
    report.reviewedBy = managerId;
    report.reviewedAt = new Date();

    await report.save();
    await report.populate('user', 'name email profileInitial');
    await report.populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Review added successfully',
      data: report,
    });
  } catch (error) {
    console.error('Add Manager Review Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message,
    });
  }
};

// @desc    Get monthly report statistics
// @route   GET /api/reports/stats?year=2026&month=1
// @access  Private (Employee/Manager)
exports.getReportStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const reports = await DailyReport.getMonthlyReports(userId, year, month);

    const stats = {
      totalReports: reports.length,
      averageHours:
        reports.length > 0
          ? Math.round(
              (reports.reduce((sum, r) => sum + r.hoursWorked, 0) /
                reports.length) *
                100
            ) / 100
          : 0,
      productivity: {
        low: reports.filter((r) => r.productivity === 'low').length,
        medium: reports.filter((r) => r.productivity === 'medium').length,
        high: reports.filter((r) => r.productivity === 'high').length,
        excellent: reports.filter((r) => r.productivity === 'excellent').length,
      },
      needsReview: reports.filter((r) => r.needsManagerReview).length,
      reviewed: reports.filter((r) => r.reviewedAt).length,
    };

    res.status(200).json({
      success: true,
      data: {
        year,
        month,
        stats,
        reports,
      },
    });
  } catch (error) {
    console.error('Get Report Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report statistics',
      error: error.message,
    });
  }
};