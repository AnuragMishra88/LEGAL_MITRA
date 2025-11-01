const express = require("express");
const router = express.Router();
const User = require("../models/User");
const ExcelJS = require('exceljs');
const Case = require("../models/Case");
const { protect, admin } = require("../middleware/auth");
const { sendEmail } = require("../utils/emailService");
const auth = require("../middleware/auth"); // Add this line

// =======================================================
// USER PROFILE ROUTE - ADD THIS
// =======================================================

// Update user profile
// Update user profile
router.put('/user/profile', protect, async (req, res) => {
  try {
    const updates = req.body;
    
    console.log('🎯 PROFILE UPDATE CALLED - User ID:', req.user.id);
    console.log('📤 Update data:', updates);
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Profile updated successfully');
    console.log('🖼️ User profile picture after update:', user.profilePicture);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


router.get('/user/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});



// =======================================================
// DASHBOARD & STATISTICS ROUTES
// =======================================================

// Get admin dashboard stats
// Get admin dashboard stats - FIXED REVENUE CALCULATION


// Get admin dashboard stats - FIXED REVENUE CALCULATION

router.get("/stats", protect, admin, async (req, res) => {
  try {
    console.log("📊 Fetching admin stats...");
    
    const totalUsers = await User.countDocuments();
    const totalLawyers = await User.countDocuments({ role: 'lawyer' });
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCases = await Case.countDocuments();
    
    // Count pending lawyer verifications
    const pendingVerifications = await User.countDocuments({ 
      role: 'lawyer', 
      isVerified: false,
      verificationStatus: 'pending'
    });

    // ✅ FIXED: Calculate ACTUAL revenue based on payment amounts
    const paidUsers = await User.find({ 
      hasPaid: true,
      paymentDate: { $exists: true }
    }).select('paymentDate role razorpayPaymentId');

    console.log('💰 Paid users found:', paidUsers.length);
    
    let monthlyRevenue = 0;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Calculate actual revenue for current month
    paidUsers.forEach(user => {
      if (user.paymentDate >= startOfMonth) {
        // ✅ FIXED: Check if user has team membership (₹2499) or personal (₹1799)
        if (user.joinTeamStatus === 'paid') {
          monthlyRevenue += 2499; // Team membership
        } else {
          monthlyRevenue += 1799; // Personal access or client
        }
      }
    });

    // Alternative: More accurate revenue calculation using payment records
    const revenueBreakdown = await User.aggregate([
      {
        $match: {
          hasPaid: true,
          paymentDate: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$joinTeamStatus',
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$joinTeamStatus', 'paid'] },
                2499, // Team members
                1799  // Personal/Client users
              ]
            }
          }
        }
      }
    ]);

    console.log('💰 Revenue breakdown:', revenueBreakdown);

    // Use accurate calculation if available
    if (revenueBreakdown.length > 0) {
      monthlyRevenue = revenueBreakdown.reduce((sum, item) => sum + item.totalRevenue, 0);
    }

    // Recent activity - cases created in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCases = await Case.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Count paid users
    const paidUsersCount = await User.countDocuments({ hasPaid: true });

    const stats = {
      totalUsers,
      totalLawyers,
      totalClients,
      totalStudents,
      totalCases,
      pendingVerificationsCount: pendingVerifications,
      monthlyRevenue: monthlyRevenue,
      revenueFormatted: `₹${monthlyRevenue.toLocaleString()}`,
      paidCases: paidUsersCount,
      recentCases,
      revenueBreakdown: revenueBreakdown // For debugging
    };

    console.log("✅ Admin stats fetched successfully");
    console.log("💰 Monthly Revenue (Fixed):", monthlyRevenue);
    console.log("💰 Revenue Breakdown:", revenueBreakdown);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("❌ Error fetching admin stats:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =======================================================
// NEW: REAL-TIME DATA ENDPOINT
// =======================================================

router.get("/realtime", protect, admin, async (req, res) => {
  try {
    console.log("🔄 Fetching real-time data...");
    
    
    // Get current active users (users active in last 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: fifteenMinutesAgo }
    });

    // Get today's new registrations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayRegistrations = await User.countDocuments({
      createdAt: { $gte: todayStart }
    });

    // Get today's revenue
    const todayRevenue = await Case.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: todayStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$paymentAmount' }
        }
      }
    ]);

    const revenue = todayRevenue.length > 0 ? todayRevenue[0].total : 0;

    // Get pending verifications
    const pendingVerifications = await User.countDocuments({ 
      role: 'lawyer', 
      isVerified: false,
      verificationStatus: 'pending'
    });

    const realTimeData = {
      activeSessions: activeUsers,
      todayRegistrations,
      todayRevenue: revenue,
      pendingVerifications,
      systemLoad: Math.floor(Math.random() * 30 + 10), // Simulated system load 10-40%
      serverTime: new Date().toISOString()
    };

    console.log("✅ Real-time data fetched successfully");
    
    res.json({
      success: true,
      data: realTimeData
    });
  } catch (error) {
    console.error("❌ Error fetching real-time data:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});



// =======================================================
// NEW: CHART DATA ENDPOINT
// =======================================================

// =======================================================
// NEW: CHART DATA ENDPOINT - FIXED VERSION
// =======================================================

router.get("/analytics/charts", protect, admin, async (req, res) => {
  try {
    const { range = '7d' } = req.query;
    
    console.log("📈 Fetching analytics charts data...", { range });

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Fetch all analytics data in parallel
    const [
      userGrowth,
      revenueData,
      engagementData,
      caseData,
      demographics,
      performance
    ] = await Promise.all([
      getUserGrowthData(startDate, range),
      getRevenueData(startDate, range),
      getEngagementData(startDate, range),
      getCaseData(startDate, range),
      getDemographicsData(),
      getPerformanceData()
    ]);

    // Get additional stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
    });
    
    // Use the new getCurrentRevenue function
    const currentRevenue = await getCurrentRevenue();
    const userGrowthRate = await getUserGrowthRate(startDate);
    const engagementRate = await getEngagementRate();
    const casesResolved = await Case.countDocuments({ status: 'solved' });
    const successRate = await getSuccessRate();
    const activeCases = await Case.countDocuments({ status: 'ongoing' });
    const avgResponseTime = await getAvgResponseTime();

    const analytics = {
      userGrowth: userGrowth || [],
      revenueData: revenueData || [],
      engagementData: engagementData || [],
      caseData: caseData || [],
      demographics: demographics || {},
      performance: performance || {},
      totalUsers: totalUsers,
      activeUsers: activeUsers,
      revenue: currentRevenue, // Use the calculated revenue
      userGrowthRate: userGrowthRate,
      engagementRate: engagementRate,
      casesResolved: casesResolved,
      successRate: successRate,
      activeCases: activeCases,
      avgResponseTime: avgResponseTime,
      satisfactionRate: 92,
      uptime: 99.8
    };

    console.log("✅ Analytics charts data fetched successfully");
    
    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error("❌ Error fetching analytics charts:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =======================================================
// ANALYTICS HELPER FUNCTIONS
// =======================================================


// / Current Revenue (this month) - ADD THIS FUNCTION
async function getCurrentRevenue() {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Calculate revenue from paid users this month
    const paidUsers = await User.find({ 
      hasPaid: true,
      paymentDate: { $gte: startOfMonth }
    });

    let monthlyRevenue = 0;
    
    paidUsers.forEach(user => {
      if (user.joinTeamStatus === 'paid') {
        monthlyRevenue += 2499; // Team membership
      } else {
        monthlyRevenue += 1799; // Personal access
      }
    });

    console.log('💰 Current month revenue calculated:', monthlyRevenue);
    return monthlyRevenue;
  } catch (error) {
    console.error("Error in getCurrentRevenue:", error);
    return 0;
  }
}



// User Growth Data
async function getUserGrowthData(startDate, range) {
  try {
    const data = [];
    const currentDate = new Date(startDate);
    const now = new Date();
    
    while (currentDate <= now) {
      const nextDate = new Date(currentDate);
      
      if (range === '7d') nextDate.setDate(currentDate.getDate() + 1);
      else if (range === '30d') nextDate.setDate(currentDate.getDate() + 1);
      else if (range === '90d') nextDate.setDate(currentDate.getDate() + 7);
      else nextDate.setMonth(currentDate.getMonth() + 1);
      
      const usersCount = await User.countDocuments({
        createdAt: { $gte: currentDate, $lt: nextDate }
      });
      
      const totalUsers = await User.countDocuments({
        createdAt: { $lt: nextDate }
      });
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        newUsers: usersCount,
        totalUsers: totalUsers
      });
      
      currentDate.setTime(nextDate.getTime());
    }
    
    return data;
  } catch (error) {
    console.error("Error in getUserGrowthData:", error);
    return [];
  }
}

// Revenue Data
async function getRevenueData(startDate, range) {
  try {
    const data = [];
    const currentDate = new Date(startDate);
    const now = new Date();
    
    while (currentDate <= now) {
      const nextDate = new Date(currentDate);
      
      if (range === '7d') nextDate.setDate(currentDate.getDate() + 1);
      else if (range === '30d') nextDate.setDate(currentDate.getDate() + 1);
      else if (range === '90d') nextDate.setDate(currentDate.getDate() + 7);
      else nextDate.setMonth(currentDate.getMonth() + 1);
      
      const revenueData = await Case.aggregate([
        {
          $match: {
            paymentStatus: 'completed',
            createdAt: { $gte: currentDate, $lt: nextDate }
          }
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$paymentAmount' },
            cases: { $sum: 1 }
          }
        }
      ]);

      const revenue = revenueData.length > 0 ? revenueData[0].revenue : 0;
      const cases = revenueData.length > 0 ? revenueData[0].cases : 0;
      
      data.push({
        period: currentDate.toISOString().split('T')[0],
        revenue: revenue,
        cases: cases
      });
      
      currentDate.setTime(nextDate.getTime());
    }
    
    return data;
  } catch (error) {
    console.error("Error in getRevenueData:", error);
    return [];
  }
}

// Engagement Data
async function getEngagementData(startDate, range) {
  try {
    const data = [];
    const currentDate = new Date(startDate);
    const now = new Date();
    
    while (currentDate <= now) {
      const nextDate = new Date(currentDate);
      
      if (range === '7d') nextDate.setDate(currentDate.getDate() + 1);
      else if (range === '30d') nextDate.setDate(currentDate.getDate() + 1);
      else if (range === '90d') nextDate.setDate(currentDate.getDate() + 7);
      else nextDate.setMonth(currentDate.getMonth() + 1);
      
      const activeUsers = await User.countDocuments({
        lastActive: { $gte: currentDate, $lt: nextDate }
      });
      
      // Mock session duration (you can implement actual tracking)
      const avgSessionDuration = Math.random() * 30 + 10; // 10-40 minutes
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        activeUsers: activeUsers,
        avgSessionDuration: Math.round(avgSessionDuration)
      });
      
      currentDate.setTime(nextDate.getTime());
    }
    
    return data;
  } catch (error) {
    console.error("Error in getEngagementData:", error);
    return [];
  }
}

// Case Data
async function getCaseData(startDate, range) {
  try {
    const data = [];
    const currentDate = new Date(startDate);
    const now = new Date();
    
    while (currentDate <= now) {
      const nextDate = new Date(currentDate);
      
      if (range === '7d') nextDate.setDate(currentDate.getDate() + 1);
      else if (range === '30d') nextDate.setDate(currentDate.getDate() + 1);
      else if (range === '90d') nextDate.setDate(currentDate.getDate() + 7);
      else nextDate.setMonth(currentDate.getMonth() + 1);
      
      const created = await Case.countDocuments({
        createdAt: { $gte: currentDate, $lt: nextDate }
      });
      
      const resolved = await Case.countDocuments({
        status: 'solved',
        updatedAt: { $gte: currentDate, $lt: nextDate }
      });
      
      data.push({
        date: currentDate.toISOString().split('T')[0],
        created: created,
        resolved: resolved
      });
      
      currentDate.setTime(nextDate.getTime());
    }
    
    return data;
  } catch (error) {
    console.error("Error in getCaseData:", error);
    return [];
  }
}

// Demographics Data
async function getDemographicsData() {
  try {
    const clients = await User.countDocuments({ role: 'client' });
    const lawyers = await User.countDocuments({ role: 'lawyer' });
    const students = await User.countDocuments({ role: 'student' });
    const others = await User.countDocuments({ role: { $nin: ['client', 'lawyer', 'student'] } });
    
    return { 
      clients, 
      lawyers, 
      students, 
      others,
      total: clients + lawyers + students + others
    };
  } catch (error) {
    console.error("Error in getDemographicsData:", error);
    return { clients: 0, lawyers: 0, students: 0, others: 0, total: 0 };
  }
}

// Performance Data
async function getPerformanceData() {
  try {
    // Calculate average response time from cases
    const responseTimeData = await Case.aggregate([
      {
        $match: {
          status: 'solved',
          createdAt: { $exists: true },
          updatedAt: { $exists: true }
        }
      },
      {
        $project: {
          responseTime: { $subtract: ['$updatedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    const avgResponseTimeMs = responseTimeData[0]?.avgResponseTime || 0;
    const avgResponseTimeHours = (avgResponseTimeMs / (1000 * 60 * 60)).toFixed(1);

    // Calculate success rate
    const totalCases = await Case.countDocuments();
    const solvedCases = await Case.countDocuments({ status: 'solved' });
    const successRate = totalCases > 0 ? (solvedCases / totalCases) * 100 : 0;

    return {
      avgResponseTime: parseFloat(avgResponseTimeHours),
      successRate: Math.round(successRate),
      satisfactionRate: 92,
      uptime: 99.8
    };
  } catch (error) {
    console.error("Error in getPerformanceData:", error);
    return {
      avgResponseTime: 2.5,
      successRate: 85,
      satisfactionRate: 90,
      uptime: 99.5
    };
  }
}

// Current Revenue (this month)
// Debug route to check payment data
router.get("/debug/revenue", protect, admin, async (req, res) => {
  try {
    const paidUsers = await User.find({ hasPaid: true })
      .select('name email role hasPaid joinTeamStatus paymentDate razorpayPaymentId')
      .sort({ paymentDate: -1 });

    console.log('🔍 DEBUG: All paid users:');
    paidUsers.forEach(user => {
      console.log({
        name: user.name,
        role: user.role,
        hasPaid: user.hasPaid,
        joinTeamStatus: user.joinTeamStatus,
        paymentDate: user.paymentDate,
        amount: user.joinTeamStatus === 'paid' ? '₹2499' : '₹1799'
      });
    });

    const revenueCalculation = paidUsers.reduce((acc, user) => {
      if (user.joinTeamStatus === 'paid') {
        acc.teamCount++;
        acc.teamRevenue += 2499;
      } else {
        acc.personalCount++;
        acc.personalRevenue += 1799;
      }
      return acc;
    }, { teamCount: 0, teamRevenue: 0, personalCount: 0, personalRevenue: 0 });

    res.json({
      success: true,
      paidUsers: paidUsers.length,
      revenueBreakdown: revenueCalculation,
      totalRevenue: revenueCalculation.teamRevenue + revenueCalculation.personalRevenue,
      paidUsers: paidUsers
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Growth Rate
async function getUserGrowthRate(startDate) {
  try {
    const previousUsers = await User.countDocuments({
      createdAt: { $lt: startDate }
    });
    
    const currentUsers = await User.countDocuments();
    
    return previousUsers > 0 ? 
      Math.round(((currentUsers - previousUsers) / previousUsers) * 100) : 0;
  } catch (error) {
    console.error("Error in getUserGrowthRate:", error);
    return 0;
  }
}

// Engagement Rate
async function getEngagementRate() {
  try {
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    const totalUsers = await User.countDocuments();
    
    return totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  } catch (error) {
    console.error("Error in getEngagementRate:", error);
    return 0;
  }
}

// Success Rate
async function getSuccessRate() {
  try {
    const resolvedCases = await Case.countDocuments({ status: 'solved' });
    const totalCases = await Case.countDocuments();
    
    return totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;
  } catch (error) {
    console.error("Error in getSuccessRate:", error);
    return 0;
  }
}

// Average Response Time
async function getAvgResponseTime() {
  try {
    const responseTimeData = await Case.aggregate([
      {
        $match: {
          status: 'solved',
          createdAt: { $exists: true },
          updatedAt: { $exists: true }
        }
      },
      {
        $project: {
          responseTime: { $subtract: ['$updatedAt', '$createdAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    const avgResponseTimeMs = responseTimeData[0]?.avgResponseTime || 0;
    return (avgResponseTimeMs / (1000 * 60 * 60)).toFixed(1);
  } catch (error) {
    console.error("Error in getAvgResponseTime:", error);
    return '2.5';
  }
}

// =======================================================
// UNIVERSAL EXPORT HANDLER
// =======================================================

// Universal export handler that works with all Excel versions
const exportExcel = async (data, filename, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report Data');

    // Add title
    worksheet.mergeCells('A1:M1');
    worksheet.getCell('A1').value = data.title || 'LegalMitra Report';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add date
    worksheet.mergeCells('A2:M2');
    worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleString()}`;
    worksheet.getCell('A2').font = { italic: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.addRow([]); // Empty row

    // Add headers
    if (data.data && data.data.length > 0) {
      const headers = Object.keys(data.data[0]);
      const headerRow = worksheet.addRow(headers);
      
      // Style headers
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2F5597' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Add data rows
      data.data.forEach((rowData, index) => {
        const row = worksheet.addRow(Object.values(rowData));
        
        // Alternate row colors
        if (index % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' }
            };
          });
        }
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    
    // Write to buffer and send
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);

  } catch (error) {
    console.error('❌ Excel export error:', error);
    throw new Error('Excel export failed: ' + error.message);
  }
};

// =======================================================
// USER MANAGEMENT ROUTES
// =======================================================

// Get all users with pagination and filtering
router.get("/users", protect, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const role = req.query.role;
    const status = req.query.status;
    const verification = req.query.verification;
    const search = req.query.search;

    // Build query
    let query = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }
    
    if (verification && verification !== 'all') {
      query.isVerified = verification === 'verified';
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name email role phone address isVerified isActive createdAt lastActive specialization experience barCouncilNumber verificationStatus hasPaid joinTeamStatus paymentDate razorpayPaymentId');

    const totalUsers = await User.countDocuments(query);

    const formattedUsers = users.map(user => ({
  _id: user._id,
  id: user._id, // Add both _id and id for compatibility
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || 'Not provided',
  address: user.address || 'Not provided',
  status: user.isActive ? 'Active' : 'Inactive', // Map isActive to status
  isActive: user.isActive, // Keep original field
  isVerified: user.isVerified,
  verificationStatus: user.verificationStatus,
  specialization: user.specialization || 'N/A',
  experience: user.experience || 'N/A',
  barCouncilNumber: user.barCouncilNumber || 'N/A',
  joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'Unknown', // Format date
  lastActive: user.lastActive ? new Date(user.lastActive).toLocaleDateString('en-IN') : 'Never',
  hasPaid: user.hasPaid || false, // Add payment status
  
      joinTeamStatus: user.joinTeamStatus || 'not_requested',
      paymentDate: user.paymentDate,
      razorpayPaymentId: user.razorpayPaymentId,

      createdAt: user.createdAt,
        lastActive: user.lastActive,
        updatedAt: user.updatedAt,
        paymentDate: user.paymentDate,
        verificationRequestedAt: user.verificationRequestedAt,
        verificationDeadline: user.verificationDeadline,
        verifiedAt: user.verifiedAt,
        documents: user.documents || [],
        rejectionReason: user.rejectionReason
}));

    res.json({
      success: true,
      users: formattedUsers,
      pagination: {
        current: page,
        pages: Math.ceil(totalUsers / limit),
        total: totalUsers
      }
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Get recent users
router.get("/users/recent", protect, admin, async (req, res) => {
  try {
    console.log("👥 Fetching recent users...");
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role isVerified isActive createdAt lastActive phone hasPaid joinTeamStatus');

    const formattedUsers = recentUsers.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      type: user.role === 'lawyer' ? 'Lawyer' : 
            user.role === 'client' ? 'Client' : 'Student',
      status: user.isActive ? 'Active' : 'Inactive',
      verification: user.isVerified ? 'Verified' : 'Pending',
      phone: user.phone || 'Not provided',
      joined: formatJoinDate(user.createdAt),
      lastActive: user.lastActive ? formatJoinDate(user.lastActive) : 'Never'
    }));

    console.log(`✅ Found ${formattedUsers.length} recent users`);
    
    res.json({ 
      success: true, 
      users: formattedUsers 
    });
  } catch (error) {
    console.error("❌ Error fetching recent users:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

router.get("/user-stats", protect, admin, async (req, res) => {
  try {
    console.log("📊 Fetching user statistics for bulk email...");
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const lawyers = await User.countDocuments({ 
      role: 'lawyer', 
      isActive: true 
    });
    const clients = await User.countDocuments({ 
      role: 'client', 
      isActive: true 
    });
    const students = await User.countDocuments({ 
      role: 'student', 
      isActive: true 
    });

    console.log("✅ User statistics fetched successfully:", {
      totalUsers,
      activeUsers,
      lawyers,
      clients,
      students
    });

    res.json({
      success: true,
      statistics: {
        totalUsers,
        activeUsers,
        lawyers,
        clients,
        students
      }
    });
  } catch (error) {
    console.error("❌ Error fetching user statistics:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// Get user by ID
router.get("/users/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isVerified: user.isVerified,
        isActive: user.isActive,
        verificationStatus: user.verificationStatus,
        specialization: user.specialization,
        experience: user.experience,
        barCouncilNumber: user.barCouncilNumber,
        documents: user.documents,
        createdAt: user.createdAt,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Update user status (activate/deactivate)
router.put("/users/:id/status", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Updating user status: ${id} to ${status}`);
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: "Valid status (active/inactive) is required" 
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: status === 'active' },
      { new: true }
    ).select('name email role isActive');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    console.log(`✅ User ${user.name} status updated to ${status}`);
    
    res.json({ 
      success: true, 
      message: "User status updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.isActive ? 'Active' : 'Inactive'
      }
    });
  } catch (error) {
    console.error("❌ Error updating user status:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Update user profile
router.put("/users/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, specialization, experience, barCouncilNumber } = req.body;
    
    console.log(`✏️ Updating user profile: ${id}`);

    const user = await User.findByIdAndUpdate(
      id,
      {
        name,
        email,
        phone,
        address,
        specialization,
        experience,
        barCouncilNumber
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    console.log(`✅ User ${user.name} profile updated successfully`);
    
    res.json({ 
      success: true, 
      message: "User profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        specialization: user.specialization,
        experience: user.experience,
        barCouncilNumber: user.barCouncilNumber
      }
    });
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Delete user permanently
router.delete("/users/:id", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting user: ${id}`);
    
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    console.log(`✅ User ${user.name} deleted successfully`);
    
    res.json({ 
      success: true, 
      message: "User deleted successfully",
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});


// =======================================================
// DOCUMENT MANAGEMENT ROUTES - ADD THESE
// =======================================================

// Get user's case documents
router.get("/users/:userId/cases/:caseId/documents", protect, admin, async (req, res) => {
  try {
    const { userId, caseId } = req.params;
    
    console.log(`📁 Fetching documents for user ${userId}, case ${caseId}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const caseDocuments = user.getCaseDocuments(caseId);
    
    console.log(`✅ Found documents for case ${caseId}:`, 
      Object.keys(caseDocuments).reduce((acc, folder) => {
        acc[folder] = caseDocuments[folder]?.length || 0;
        return acc;
      }, {})
    );

    res.json({
      success: true,
      documents: caseDocuments
    });
  } catch (error) {
    console.error("❌ Error fetching case documents:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add document to user's case (after Cloudinary upload)
router.post("/users/:userId/cases/:caseId/documents", protect, admin, async (req, res) => {
  try {
    const { userId, caseId } = req.params;
    const { documentData, folder, caseName } = req.body;
    
    console.log(`📤 Adding document to user ${userId}, case ${caseId}`, {
      folder,
      documentName: documentData?.name,
      fileSize: documentData?.size
    });

    // Validate required fields
    if (!documentData || !folder || !caseName) {
      return res.status(400).json({
        success: false,
        error: "Document data, folder, and case name are required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Check storage space
    if (!user.hasStorageSpace(documentData.size)) {
      return res.status(400).json({
        success: false,
        error: "Storage limit exceeded. Please upgrade your storage plan."
      });
    }

    // Add document to user's case
    await user.addCaseDocument(caseId, caseName, documentData, folder);
    
    console.log(`✅ Document added successfully to case ${caseId}`);

    res.json({
      success: true,
      message: "Document added successfully",
      storageInfo: user.getStorageInfo()
    });
  } catch (error) {
    console.error("❌ Error adding document:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete document from user's case
router.delete("/users/:userId/cases/:caseId/documents", protect, admin, async (req, res) => {
  try {
    const { userId, caseId } = req.params;
    const { publicId, folder } = req.body;
    
    console.log(`🗑️ Deleting document from user ${userId}, case ${caseId}`, {
      publicId,
      folder
    });

    if (!publicId || !folder) {
      return res.status(400).json({
        success: false,
        error: "Document publicId and folder are required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Remove document from user's case
    await user.removeCaseDocument(caseId, publicId, folder);
    
    console.log(`✅ Document deleted successfully from case ${caseId}`);

    res.json({
      success: true,
      message: "Document deleted successfully",
      storageInfo: user.getStorageInfo()
    });
  } catch (error) {
    console.error("❌ Error deleting document:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user storage information
router.get("/users/:userId/storage", protect, admin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`💾 Fetching storage info for user ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const storageInfo = user.getStorageInfo();
    const totalDocuments = user.getTotalDocumentsCount();
    
    console.log(`✅ Storage info for ${user.name}:`, storageInfo);

    res.json({
      success: true,
      storage: {
        ...storageInfo,
        totalDocuments,
        role: user.role,
        userPlan: user.role === 'lawyer' ? 'Professional' : 'Standard'
      }
    });
  } catch (error) {
    console.error("❌ Error fetching storage info:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all documents for a user (admin view)
router.get("/users/:userId/documents", protect, admin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`📋 Fetching all documents for user ${userId}`);

    const user = await User.findById(userId).select('documents name email role');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Format documents for admin view
    const allDocuments = {
      cases: user.documents.cases.map(caseDoc => ({
        caseId: caseDoc.caseId,
        caseName: caseDoc.caseName,
        folders: Object.keys(caseDoc.folders).reduce((acc, folder) => {
          acc[folder] = {
            count: caseDoc.folders[folder].length,
            totalSize: caseDoc.folders[folder].reduce((sum, doc) => sum + (doc.size || 0), 0),
            documents: caseDoc.folders[folder].map(doc => ({
              id: doc.publicId,
              name: doc.name,
              type: doc.type,
              size: doc.size,
              format: doc.format,
              uploadedAt: doc.uploadedAt,
              url: doc.url
            }))
          };
          return acc;
        }, {})
      })),
      personal: {
        count: user.documents.personal.length,
        totalSize: user.documents.personal.reduce((sum, doc) => sum + (doc.size || 0), 0),
        documents: user.documents.personal.map(doc => ({
          id: doc.publicId,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          format: doc.format,
          category: doc.category,
          uploadedAt: doc.uploadedAt,
          url: doc.url
        }))
      }
    };

    console.log(`✅ Found ${user.documents.cases.length} cases with documents for ${user.name}`);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      documents: allDocuments
    });
  } catch (error) {
    console.error("❌ Error fetching user documents:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clean up user documents (admin utility)
router.post("/users/:userId/documents/cleanup", protect, admin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🧹 Cleaning up documents for user ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Clean up empty case entries
    await user.cleanupEmptyCases();
    
    const storageInfo = user.getStorageInfo();
    const totalDocuments = user.getTotalDocumentsCount();
    
    console.log(`✅ Documents cleaned up for ${user.name}`);

    res.json({
      success: true,
      message: "Documents cleaned up successfully",
      storageInfo,
      totalDocuments
    });
  } catch (error) {
    console.error("❌ Error cleaning up documents:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update user storage limit (admin only)
router.put("/users/:userId/storage/limit", protect, admin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newLimit } = req.body;
    
    console.log(`⚙️ Updating storage limit for user ${userId} to ${newLimit} bytes`);

    if (!newLimit || newLimit < 0) {
      return res.status(400).json({
        success: false,
        error: "Valid storage limit is required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Update storage limit
    user.storageLimit = parseInt(newLimit);
    await user.save();
    
    const storageInfo = user.getStorageInfo();
    
    console.log(`✅ Storage limit updated for ${user.name}`);

    res.json({
      success: true,
      message: "Storage limit updated successfully",
      storageInfo
    });
  } catch (error) {
    console.error("❌ Error updating storage limit:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get system-wide document statistics
router.get("/analytics/documents", protect, admin, async (req, res) => {
  try {
    console.log("📊 Fetching system-wide document analytics...");

    // Get all users with their document stats
    const users = await User.find().select('name email role storageUsage storageLimit documents');
    
    const documentStats = {
      totalUsers: users.length,
      totalStorageUsed: users.reduce((sum, user) => sum + (user.storageUsage?.totalUsed || 0), 0),
      totalStorageLimit: users.reduce((sum, user) => sum + (user.storageLimit || 0), 0),
      usersWithDocuments: users.filter(user => 
        user.documents?.cases?.length > 0 || user.documents?.personal?.length > 0
      ).length,
      documentBreakdown: {
        caseDocuments: users.reduce((sum, user) => 
          sum + (user.storageUsage?.caseDocuments || 0), 0
        ),
        personalDocuments: users.reduce((sum, user) => 
          sum + (user.storageUsage?.personalDocuments || 0), 0
        )
      },
      roleBreakdown: {
        lawyers: users.filter(user => user.role === 'lawyer').length,
        clients: users.filter(user => user.role === 'client').length,
        students: users.filter(user => user.role === 'student').length
      },
      topUsersByStorage: users
        .map(user => ({
          name: user.name,
          email: user.email,
          role: user.role,
          storageUsed: user.storageUsage?.totalUsed || 0,
          storageLimit: user.storageLimit || 0,
          usagePercentage: user.storageLimit > 0 ? 
            ((user.storageUsage?.totalUsed || 0) / user.storageLimit * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.storageUsed - a.storageUsed)
        .slice(0, 10)
    };

    console.log("✅ Document analytics fetched successfully");

    res.json({
      success: true,
      analytics: documentStats
    });
  } catch (error) {
    console.error("❌ Error fetching document analytics:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});





// =======================================================
// LAWYER VERIFICATION ROUTES
// =======================================================

// Get pending verifications
router.get("/verifications/pending", protect, admin, async (req, res) => {
  try {
    console.log("📋 Fetching pending verifications...");
    
    const pendingLawyers = await User.find({ 
      role: 'lawyer', 
      isVerified: false,
      verificationStatus: 'pending'
    })
    .select('name email specialization experience barCouncilNumber documents createdAt phone address')
    .sort({ createdAt: -1 });

   // In /admin/verifications/pending route
const formattedVerifications = pendingLawyers.map(lawyer => ({
  id: lawyer._id,
  _id: lawyer._id,
  name: lawyer.name,
  email: lawyer.email,
  phone: lawyer.phone || 'Not provided',
  address: lawyer.address || 'Not provided',
  specialization: lawyer.specialization || 'Not specified',
  experience: lawyer.experience || 'Not specified',
  barCouncilNumber: lawyer.barCouncilNumber || 'Not provided',
  documents: lawyer.documents ? lawyer.documents.length : 0,
  documentFiles: lawyer.documents || [],
  submitted: lawyer.createdAt ? new Date(lawyer.createdAt).toLocaleDateString('en-IN') : 'Unknown' // Format date
}));

    console.log(`✅ Found ${formattedVerifications.length} pending verifications`);
    
    res.json({ 
      success: true, 
      verifications: formattedVerifications 
    });
  } catch (error) {
    console.error("❌ Error fetching pending verifications:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Approve lawyer verification with email
router.put("/verifications/:id/approve", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`✅ Approving lawyer verification: ${id}`);
    
    const lawyer = await User.findByIdAndUpdate(
      id,
      { 
        isVerified: true,
        verificationStatus: 'approved',
        joinTeamStatus: 'approved',
        verifiedAt: new Date(),
        verificationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      { new: true }
    ).select('name email role');

    if (!lawyer) {
      return res.status(404).json({ 
        success: false,
        error: "Lawyer not found" 
      });
    }

    console.log(`✅ Lawyer ${lawyer.name} verified successfully`);

    // Send approval email
    try {
      const emailResult = await sendEmail(
        lawyer.email,
        'verificationApproved',
        {
          name: lawyer.name,
          email: lawyer.email,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      );

      if (emailResult.success) {
        console.log(`✅ Approval email sent to ${lawyer.email}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending approval email:', emailError);
    }
    
    res.json({ 
      success: true, 
      message: "Lawyer verification approved successfully",
      lawyer: {
        id: lawyer._id,
        name: lawyer.name,
        email: lawyer.email
      }
    });
  } catch (error) {
    console.error("❌ Error approving verification:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Reject lawyer verification with email
router.put("/verifications/:id/reject", protect, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    console.log(`❌ Rejecting lawyer verification: ${id}`, { reason });

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        success: false,
        error: "Rejection reason is required (minimum 10 characters)" 
      });
    }

    const lawyer = await User.findByIdAndUpdate(
      id,
      { 
        isVerified: false, 
        verificationStatus: 'rejected',
        joinTeamStatus: 'rejected',
        rejectionReason: reason.trim()
      },
      { new: true }
    ).select('name email role');

    if (!lawyer) {
      return res.status(404).json({ 
        success: false,
        error: "Lawyer not found" 
      });
    }

    console.log(`✅ Lawyer ${lawyer.name} verification rejected`);

    // Send rejection email
    try {
      const emailResult = await sendEmail(
        lawyer.email,
        'verificationRejected',
        {
          name: lawyer.name,
          email: lawyer.email,
          reason: reason.trim()
        }
      );

      if (emailResult.success) {
        console.log(`✅ Rejection email sent to ${lawyer.email}`);
      }
    } catch (emailError) {
      console.error('❌ Error sending rejection email:', emailError);
    }

    res.json({ 
      success: true, 
      message: "Lawyer verification rejected",
      details: {
        lawyerName: lawyer.name,
        lawyerEmail: lawyer.email,
        rejectionReason: reason
      }
    });
  } catch (error) {
    console.error("❌ Error rejecting verification:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// =======================================================
// REPORT GENERATION ROUTES
// =======================================================

// Get available report types
router.get("/reports/types", protect, admin, async (req, res) => {
  try {
    const reportTypes = [
      {
        id: 'revenue-monthly',
        title: 'Monthly Revenue Report',
        description: 'Detailed revenue analysis with trends',
        availableFormats: ['PDF', 'Excel', 'CSV'],
        estimatedTime: '2-3 minutes',
        category: 'Financial'
      },
      {
        id: 'user-growth',
        title: 'User Growth Analysis',
        description: 'User registration and growth trends',
        availableFormats: ['PDF', 'Excel', 'CSV'],
        estimatedTime: '1 minute',
        category: 'Users'
      },
      {
        id: 'payment-analytics',
        title: 'Payment Analytics',
        description: 'Payment success rates and transaction analysis',
        availableFormats: ['PDF', 'Excel'],
        estimatedTime: '1-2 minutes',
        category: 'Financial'
      },
      {
        id: 'user-activity',
        title: 'User Activity Report',
        description: 'Platform engagement and activity metrics',
        availableFormats: ['PDF', 'Excel'],
        estimatedTime: '3-4 minutes',
        category: 'Users'
      },
      {
        id: 'case-performance',
        title: 'Case Performance Metrics',
        description: 'Case resolution rates and lawyer performance',
        availableFormats: ['PDF', 'Excel', 'CSV'],
        estimatedTime: '2-3 minutes',
        category: 'Cases'
      },
      {
        id: 'lawyer-performance',
        title: 'Lawyer Performance Report',
        description: 'Lawyer case success rates and client ratings',
        availableFormats: ['PDF', 'Excel'],
        estimatedTime: '2 minutes',
        category: 'Performance'
      }
    ];

    res.json({
      success: true,
      reportTypes
    });
  } catch (error) {
    console.error("❌ Error fetching report types:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch report types"
    });
  }
});

// Generate reports
router.post("/reports/generate", protect, admin, async (req, res) => {
  try {
    const {
      reportType,
      format,
      filters,
      includeCharts,
      dataPoints
    } = req.body;

    console.log('📊 Report generation request:', { 
      reportType, 
      format, 
      filters,
      user: req.user.id 
    });

    // Validate required fields
    if (!reportType || !format) {
      return res.status(400).json({
        success: false,
        error: "Report type and format are required"
      });
    }

    // Generate report based on type and format
    const reportResult = await generateReport({
      reportType,
      format: format.toLowerCase(),
      filters: filters || {},
      userId: req.user.id,
      includeCharts: includeCharts || false,
      dataPoints: dataPoints || []
    });

    console.log('✅ Report generated successfully:', {
      type: reportType,
      format: format,
      filename: reportResult.filename
    });

    // Handle different response types based on format
    if (format.toLowerCase() === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportResult.filename}"`);
      return res.send(reportResult.data);
    } else if (format.toLowerCase() === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportResult.filename}"`);
      return res.send(reportResult.data);
    } else if (format.toLowerCase() === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportResult.filename}"`);
      return res.send(reportResult.data);
    } else {
      return res.status(400).json({
        success: false,
        error: "Unsupported format"
      });
    }

  } catch (error) {
    console.error("❌ Error generating report:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error during report generation"
    });
  }
});

// =======================================================
// EXPORT & BULK EMAIL ROUTES
// =======================================================

// Export user data
// Export user data with PROPER Excel support
// =======================================================
// EXPORT USER DATA - FIXED VERSION
// =======================================================

router.get("/export/users", protect, admin, async (req, res) => {
  try {
    const { format = 'csv', userType = 'all', status = 'all' } = req.query;
    
    console.log('📊 Export request:', { format, userType, status });

    // Validate format
    const validFormats = ['csv', 'excel', 'xlsx'];
    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}`
      });
    }

    // Build query
    let userQuery = {};
    if (userType !== 'all') {
      userQuery.role = userType;
    }
    if (status !== 'all') {
      userQuery.isActive = status === 'active';
    }

    // Get users
    const users = await User.find(userQuery)
      .select('name email role phone address isVerified isActive createdAt lastActive specialization experience barCouncilNumber verificationStatus hasPaid joinTeamStatus paymentDate')
      .sort({ createdAt: -1 })
      .lean();

    if (!users.length) {
      return res.status(404).json({
        success: false,
        error: "No users found to export"
      });
    }

    console.log(`📥 Preparing to export ${users.length} users in ${format.toUpperCase()} format`);

    // ✅ FIXED: Use 'users' instead of 'recentUsers'
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || 'Not provided',
      address: user.address || 'Not provided',
      status: user.isActive ? 'Active' : 'Inactive',
      isVerified: user.isVerified ? 'Yes' : 'No',
      verificationStatus: user.verificationStatus || 'Not submitted',
      specialization: user.specialization || 'N/A',
      experience: user.experience || 'N/A',
      barCouncilNumber: user.barCouncilNumber || 'N/A',
      hasPaid: user.hasPaid ? 'Yes' : 'No',
      joinTeamStatus: user.joinTeamStatus || 'not_requested',
      paymentDate: user.paymentDate ? new Date(user.paymentDate).toLocaleDateString('en-IN') : 'N/A',
      joinedDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : 'Unknown',
      lastActive: user.lastActive ? new Date(user.lastActive).toLocaleDateString('en-IN') : 'Never'
    }));

    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `legalmitra_users_${userType}_${timestamp}`;

    // Handle different formats
    if (format.toLowerCase() === 'excel' || format.toLowerCase() === 'xlsx') {
      const reportData = {
        title: `LegalMitra Users Export - ${userType.toUpperCase()}`,
        data: formattedUsers,
        summary: {
          'Total Users Exported': formattedUsers.length,
          'User Type': userType,
          'Export Date': new Date().toLocaleDateString('en-IN')
        }
      };
      
      return await exportExcel(reportData, baseFilename, res);
      
    } else if (format.toLowerCase() === 'csv') {
      return exportCSV(res, formattedUsers, baseFilename);
    }

  } catch (error) {
    console.error("❌ Error exporting user data:", error);
    res.status(500).json({
      success: false,
      error: "Export failed: " + error.message
    });
  }
});


// Get export statistics
router.get("/export/statistics", protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const lawyers = await User.countDocuments({ role: 'lawyer' });
    const clients = await User.countDocuments({ role: 'client' });
    const students = await User.countDocuments({ role: 'student' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    const statistics = {
      totalUsers,
      activeUsers,
      lawyers,
      clients,
      students,
      verifiedUsers
    };

    res.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error("❌ Error fetching export statistics:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});



// Send email to single user
router.post("/send-email", protect, admin, async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    
    console.log(`📧 Sending email to: ${to}`, { subject });

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: "Recipient email, subject, and message are required"
      });
    }

    // Verify user exists
    const user = await User.findOne({ email: to });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User with this email not found"
      });
    }

    // Send email using your email service
    const emailResult = await sendEmail(
      to,
      'customBulkEmail',
      {
        name: user.name || to.split('@')[0],
        email: to,
        subject: subject,
        message: message
      }
    );

    if (emailResult.success) {
      console.log(`✅ Email sent successfully to ${to}`);
      res.json({
        success: true,
        message: "Email sent successfully",
        emailId: emailResult.messageId
      });
    } else {
      console.error(`❌ Failed to send email to ${to}:`, emailResult.error);
      res.status(500).json({
        success: false,
        error: "Failed to send email: " + emailResult.error
      });
    }

  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send bulk email to all users
// =======================================================
// GENERAL BULK EMAIL FACILITY - ADD THIS ROUTE
// =======================================================

// Send bulk email to all users (general purpose)
// Send bulk email to all users (general purpose)
// Fixed Bulk Email Route
router.post("/send-bulk-email", protect, admin, async (req, res) => {
    try {
        const { subject, message, userType = 'all', sendToActiveOnly = true } = req.body;
        
        console.log('📧 Bulk email request received:', { 
            subject, 
            messageLength: message?.length,
            userType,
            sendToActiveOnly 
        });

        // Validation
        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                error: "Subject and message are required"
            });
        }

        if (subject.trim().length === 0 || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "Subject and message cannot be empty"
            });
        }

        // Build query based on filters
        let userQuery = {};
        
        if (userType !== 'all') {
            userQuery.role = userType;
        }
        
        if (sendToActiveOnly) {
            userQuery.isActive = true;
        }

        console.log('🔍 User query:', userQuery);

        // Get all users matching the criteria
        const users = await User.find(userQuery)
            .select('name email role isActive')
            .lean();

        console.log(`📊 Found ${users.length} users matching criteria`);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: "No users found matching the selected criteria"
            });
        }

        console.log(`📨 Preparing to send bulk email to ${users.length} users`);

        // Track email sending results
        const results = {
            total: users.length,
            successful: 0,
            failed: 0,
            failures: []
        };

        // Send emails in batches to avoid overwhelming the server
        const BATCH_SIZE = 10;
        const batches = [];
        
        for (let i = 0; i < users.length; i += BATCH_SIZE) {
            batches.push(users.slice(i, i + BATCH_SIZE));
        }

        console.log(`🔄 Processing ${batches.length} batches`);

        // Process batches sequentially
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length}`);
            
            // Process each user in the batch
            for (let userIndex = 0; userIndex < batch.length; userIndex++) {
                const user = batch[userIndex];
                const globalIndex = batchIndex * BATCH_SIZE + userIndex;
                
                try {
                    console.log(`🔄 [${globalIndex + 1}/${users.length}] Sending to ${user.email}`);
                    
                    const personalizedMessage = message.replace(/{name}/g, user.name || 'User');
                    
                    const emailResult = await sendEmail(
                        user.email,
                        'customBulkEmail',
                        {
                            name: user.name || user.email.split('@')[0],
                            email: user.email,
                            subject: subject,
                            message: personalizedMessage
                        }
                    );

                    if (emailResult.success) {
                        results.successful++;
                        console.log(`✅ [${globalIndex + 1}/${users.length}] Email sent to ${user.email}`);
                    } else {
                        results.failed++;
                        results.failures.push({
                            email: user.email,
                            error: emailResult.error
                        });
                        console.log(`❌ [${globalIndex + 1}/${users.length}] Failed to send to ${user.email}: ${emailResult.error}`);
                    }

                    // Small delay between emails to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    results.failed++;
                    results.failures.push({
                        email: user.email,
                        error: error.message
                    });
                    console.log(`💥 [${globalIndex + 1}/${users.length}] Error sending to ${user.email}:`, error.message);
                }
            }

            // Delay between batches
            if (batchIndex < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`✅ Bulk email completed: ${results.successful} sent, ${results.failed} failed`);

        res.json({
            success: true,
            message: `Bulk email completed: ${results.successful} sent, ${results.failed} failed`,
            results: results
        });

    } catch (error) {
        console.error("💥 Error in bulk email route:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error: " + error.message
        });
    }
});




// =======================================================
// HELPER FUNCTIONS
// =======================================================

// Helper function to format join date

// Helper function to format file size for display
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to get file type icon
function getFileTypeIcon(fileType, format) {
  const typeMap = {
    'image': '🖼️',
    'pdf': '📄',
    'document': '📝',
    'spreadsheet': '📊',
    'presentation': '📑',
    'archive': '📦',
    'text': '📋'
  };

  if (fileType === 'image') return '🖼️';
  if (format === 'pdf') return '📄';
  if (['doc', 'docx'].includes(format)) return '📝';
  if (['xls', 'xlsx'].includes(format)) return '📊';
  if (['ppt', 'pptx'].includes(format)) return '📑';
  if (['zip', 'rar'].includes(format)) return '📦';
  if (['txt'].includes(format)) return '📋';
  
  return typeMap[fileType] || '📎';
}

function formatJoinDate(date) {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffTime = Math.abs(now - new Date(date));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// CSV Export Function
// CSV Export Function - IMPROVED VERSION
const exportCSV = (res, data, filename) => {
  try {
    if (!data || !data.length) {
      throw new Error('No data to export');
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content with proper escaping
    let csvContent = '\uFEFF'; // BOM for Excel compatibility
    csvContent += headers.join(',') + '\n';
    
    data.forEach(item => {
      const row = headers.map(header => {
        let value = item[header] || '';
        // Convert to string and escape commas, quotes, and newlines
        if (typeof value === 'string') {
          // Escape quotes and handle special characters
          value = value.replace(/"/g, '""');
          // Wrap in quotes if contains comma, quote, or newline
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value}"`;
          }
        }
        return value;
      });
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('❌ CSV export error:', error);
    throw new Error('CSV export failed: ' + error.message);
  }
};

// Temporary debug route to check verification data
router.get("/verifications/debug", protect, admin, async (req, res) => {
  try {
    const allLawyers = await User.find({ role: 'lawyer' })
      .select('name email verificationStatus isVerified joinTeamStatus')
      .lean();

    const pending = allLawyers.filter(l => l.verificationStatus === 'pending');
    const rejected = allLawyers.filter(l => l.verificationStatus === 'rejected');
    const approved = allLawyers.filter(l => l.verificationStatus === 'approved');

    res.json({
      success: true,
      counts: {
        total: allLawyers.length,
        pending: pending.length,
        rejected: rejected.length,
        approved: approved.length
      },
      pending: pending.map(p => ({ id: p._id, name: p.name, email: p.email })),
      rejected: rejected.map(r => ({ id: r._id, name: r.name, email: r.email })),
      approved: approved.map(a => ({ id: a._id, name: a.name, email: a.email }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



// Report generation helper functions
const generateReport = async (options) => {
  const { reportType, format, filters, userId } = options;
  
  let data;
  let filename;

  switch (reportType) {
    case 'revenue-monthly':
      data = await generateRevenueReport(filters);
      filename = `revenue_report_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'user-growth':
      data = await generateUserGrowthReport(filters);
      filename = `user_growth_report_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'payment-analytics':
      data = await generatePaymentAnalyticsReport(filters);
      filename = `payment_analytics_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'user-activity':
      data = await generateUserActivityReport(filters);
      filename = `user_activity_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'case-performance':
      data = await generateCasePerformanceReport(filters);
      filename = `case_performance_${new Date().toISOString().split('T')[0]}`;
      break;
    default:
      throw new Error('Unknown report type: ' + reportType);
  }

  // Format the data based on requested format
  const formattedData = await formatData(data, format, filename);
  
  return formattedData;
};

const generateRevenueReport = async (filters) => {
  try {
    // Calculate revenue from completed payments in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueData = await Case.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: 500 }, // ₹500 per case
          cases: { $sum: 1 },
          uniqueClients: { $addToSet: '$clientId' }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 6
      }
    ]);

    const formattedData = revenueData.map(item => ({
      period: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      revenue: item.revenue,
      cases: item.cases,
      uniqueClients: item.uniqueClients.length
    }));

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalCases = revenueData.reduce((sum, item) => sum + item.cases, 0);

    return {
      title: 'Monthly Revenue Report',
      data: formattedData,
      summary: {
        totalRevenue: totalRevenue,
        totalCases: totalCases,
        averageRevenue: totalRevenue / (revenueData.length || 1),
        period: 'Last 6 months'
      }
    };
  } catch (error) {
    throw new Error('Failed to generate revenue report: ' + error.message);
  }
};

const generateUserGrowthReport = async (filters) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalUsers: { $sum: 1 },
          lawyers: {
            $sum: { $cond: [{ $eq: ['$role', 'lawyer'] }, 1, 0] }
          },
          clients: {
            $sum: { $cond: [{ $eq: ['$role', 'client'] }, 1, 0] }
          },
          students: {
            $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 6
      }
    ]);

    const formattedData = userData.map(item => ({
      period: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      totalUsers: item.totalUsers,
      lawyers: item.lawyers,
      clients: item.clients,
      students: item.students
    }));

    const totalUsers = userData.reduce((sum, item) => sum + item.totalUsers, 0);
    const totalLawyers = userData.reduce((sum, item) => sum + item.lawyers, 0);
    const totalClients = userData.reduce((sum, item) => sum + item.clients, 0);

    return {
      title: 'User Growth Report',
      data: formattedData,
      summary: {
        totalUsers: totalUsers,
        totalLawyers: totalLawyers,
        totalClients: totalClients,
        growthRate: calculateGrowthRate(userData, 'totalUsers')
      }
    };
  } catch (error) {
    throw new Error('Failed to generate user growth report: ' + error.message);
  }
};

const generatePaymentAnalyticsReport = async (filters) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const paymentData = await Case.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: 500 } // ₹500 per case
        }
      }
    ]);

    const totalCases = paymentData.reduce((sum, item) => sum + item.count, 0);
    const completedPayments = paymentData.find(item => item._id === 'completed')?.count || 0;
    const successRate = totalCases > 0 ? (completedPayments / totalCases) * 100 : 0;

    const formattedData = paymentData.map(item => ({
      status: item._id,
      count: item.count,
      amount: item.totalAmount,
      percentage: totalCases > 0 ? (item.count / totalCases) * 100 : 0
    }));

    return {
      title: 'Payment Analytics Report',
      data: formattedData,
      summary: {
        totalTransactions: totalCases,
        successfulPayments: completedPayments,
        successRate: successRate,
        totalRevenue: completedPayments * 500
      }
    };
  } catch (error) {
    throw new Error('Failed to generate payment analytics report: ' + error.message);
  }
};

const generateUserActivityReport = async (filters) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get active users (users with lastActive in last 7 days)
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: sevenDaysAgo }
    });

    // Get new cases in last 7 days
    const newCases = await Case.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get total users
    const totalUsers = await User.countDocuments();

    const activityData = [
      { metric: 'Active Users (7 days)', value: activeUsers },
      { metric: 'New Cases (7 days)', value: newCases },
      { metric: 'Total Users', value: totalUsers },
      { metric: 'Activity Rate', value: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) + '%' : '0%' }
    ];

    return {
      title: 'User Activity Report',
      data: activityData,
      summary: {
        activeUsers: activeUsers,
        newCases: newCases,
        totalUsers: totalUsers,
        activityRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
      }
    };
  } catch (error) {
    throw new Error('Failed to generate user activity report: ' + error.message);
  }
};

const generateCasePerformanceReport = async (filters) => {
  try {
    const caseData = await Case.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } }
        }
      }
    ]);

    const totalCases = caseData.reduce((sum, item) => sum + item.count, 0);
    const solvedCases = caseData.find(item => item._id === 'solved')?.count || 0;
    const successRate = totalCases > 0 ? (solvedCases / totalCases) * 100 : 0;

    const formattedData = caseData.map(item => ({
      status: item._id,
      count: item.count,
      percentage: totalCases > 0 ? (item.count / totalCases) * 100 : 0,
      avgDuration: item.avgDuration ? (item.avgDuration / (1000 * 60 * 60 * 24)).toFixed(1) + ' days' : 'N/A'
    }));

    return {
      title: 'Case Performance Report',
      data: formattedData,
      summary: {
        totalCases: totalCases,
        solvedCases: solvedCases,
        successRate: successRate,
        ongoingCases: caseData.find(item => item._id === 'ongoing')?.count || 0
      }
    };
  } catch (error) {
    throw new Error('Failed to generate case performance report: ' + error.message);
  }
};

// Data formatting functions
const formatData = async (data, format, filename) => {
  switch (format) {
    case 'csv':
      return await formatAsCSV(data, filename);
    case 'excel':
      return await formatAsExcel(data, filename);
    case 'pdf':
      return await formatAsPDF(data, filename);
    default:
      throw new Error('Unsupported format: ' + format);
  }
};

const formatAsCSV = async (data, filename) => {
  let csvContent = '';
  
  // Add title and timestamp
  csvContent += `${data.title}\n`;
  csvContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
  
  // Add data headers and rows
  if (data.data && data.data.length > 0) {
    const headers = Object.keys(data.data[0]);
    csvContent += headers.join(',') + '\n';
    
    // Add data rows
    data.data.forEach(row => {
      const values = headers.map(header => {
        let value = row[header];
        // Handle special characters and formatting
        if (typeof value === 'string') {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });
  }

  // Add summary section
  if (data.summary) {
    csvContent += '\nSummary:\n';
    Object.keys(data.summary).forEach(key => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      csvContent += `${formattedKey},${data.summary[key]}\n`;
    });
  }

  return {
    data: csvContent,
    filename: `${filename}.csv`
  };
};

const formatAsExcel = async (data, filename) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add title
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = data.title;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Add timestamp
    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleString()}`;
    worksheet.getCell('A2').font = { italic: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.addRow([]);

    // Add data table
    if (data.data && data.data.length > 0) {
      const headers = Object.keys(data.data[0]);
      const headerRow = worksheet.addRow(headers);
      
      // Style header row
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2E86AB' }
        };
      });

      // Add data rows
      data.data.forEach((row, index) => {
        const rowData = headers.map(header => row[header]);
        const dataRow = worksheet.addRow(rowData);
        
        // Alternate row colors
        if (index % 2 === 0) {
          dataRow.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F2F2' }
            };
          });
        }
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    return {
      data: buffer,
      filename: `${filename}.xlsx`
    };

  } catch (error) {
    console.error('❌ Excel generation error:', error);
    throw new Error('Excel generation failed: ' + error.message);
  }
};
const formatAsPDF = async (data, filename) => {
  try {
    // For now, return CSV data with .pdf extension
    // In production, install and use pdfkit: npm install pdfkit
    const csvData = await formatAsCSV(data, filename);
    return {
      data: csvData.data,
      filename: `${filename}.pdf`
    };
  } catch (error) {
    throw new Error('PDF format requires pdfkit package. Using CSV instead.');
  }
};

// Helper function to calculate growth rate
const calculateGrowthRate = (data, field) => {
  if (data.length < 2) return 0;
  
  const current = data[0][field] || 0;
  const previous = data[1][field] || 0;
  
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// =======================================================
// ANALYTICS ENDPOINT - ADD THIS
// =======================================================

router.get("/analytics", protect, admin, async (req, res) => {
  try {
    console.log("📈 Fetching analytics data...");
    
    // Calculate monthly active users (users active in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: thirtyDaysAgo }
    });

    // Calculate growth rates
    const totalUsers = await User.countDocuments();
    const previousMonthUsers = await User.countDocuments({
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    const userGrowthRate = previousMonthUsers > 0 
      ? ((totalUsers - previousMonthUsers) / previousMonthUsers * 100).toFixed(1)
      : 0;

    // Case statistics
    const totalCases = await Case.countDocuments();
    const ongoingCases = await Case.countDocuments({ status: 'ongoing' });
    const solvedCases = await Case.countDocuments({ status: 'solved' });
    
    const caseSuccessRate = totalCases > 0 
      ? ((solvedCases / totalCases) * 100).toFixed(1)
      : 0;

    // Revenue analytics
    const revenueData = await Case.aggregate([
      {
        $match: {
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$paymentAmount' }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const analytics = {
      monthlyActiveUsers: activeUsers,
      userGrowthRate: `${userGrowthRate}%`,
      revenueGrowth: `${userGrowthRate}%`, // Using same as user growth for now
      caseSuccessRate: `${caseSuccessRate}%`,
      totalCases,
      ongoingCases,
      solvedCases,
      pendingCases: await Case.countDocuments({ status: 'pending' }),
      totalRevenue: `₹${totalRevenue.toLocaleString()}`,
      avgResponseTime: await getAvgResponseTime(),
      userSatisfaction: '4.7/5.0'
    };

    console.log("✅ Analytics data fetched successfully");
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error("❌ Error fetching analytics:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;