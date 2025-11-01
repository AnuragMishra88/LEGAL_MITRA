const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const Request = require('../models/Request'); // ✅ ADD THIS LINE


// Check for new requests (for polling)
router.get('/check-new-requests', protect, async (req, res) => { // or use protect instead of auth
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lastCheck = req.query.lastCheck;
    let query = { lawyerId: req.user.id, status: 'pending' };

    if (lastCheck) {
      query.createdAt = { $gt: new Date(lastCheck) };
    }

    const requests = await Request.find(query)
      .populate('clientId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error checking new requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Also add this to get all lawyer requests
router.get('/requests', protect, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const requests = await Request.find({ lawyerId: req.user.id })
      .populate('clientId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

// Lawyer verification request
router.post("/request-verification", protect, async (req, res) => {
  try {
    const { userId } = req.body;
    
    console.log('📨 Lawyer verification request received:', { 
      userId,
      authenticatedUserId: req.user.id
    });

    const lawyer = await User.findById(req.user.id);
    console.log('👤 User found:', {
      id: lawyer?._id,
      name: lawyer?.name,
      role: lawyer?.role,
      joinTeamStatus: lawyer?.joinTeamStatus
    });

    if (!lawyer || lawyer.role !== 'lawyer') {
      console.log('❌ User role check failed:', {
        userExists: !!lawyer,
        userRole: lawyer?.role,
        expectedRole: 'lawyer'
      });
      return res.status(403).json({
        success: false,
        error: "Only lawyers can request verification"
      });
    }

    const updatedLawyer = await User.findByIdAndUpdate(
      req.user.id,
      {
        joinTeamStatus: 'pending',
        verificationStatus: 'pending', 
        verificationRequestedAt: new Date()
      },
      { new: true }
    ).select('name email joinTeamStatus verificationStatus');

    console.log('✅ Lawyer verification status updated:', updatedLawyer);

    res.json({
      success: true,
      message: "Verification request submitted successfully",
      lawyer: updatedLawyer
    });

  } catch (error) {
    console.error('❌ Error processing verification request:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get team lawyers specifically - ONLY CHANGED THIS ROUTE
router.get('/team-lawyers', async (req, res) => {
  try {
    console.log('🔍 Fetching team lawyers...');
    const { limit = 50 } = req.query;
    
    const teamLawyers = await User.find({
      role: 'lawyer',
      joinTeamStatus: { $in: ['paid'] }, // CHANGED THIS LINE
      isVerified: true,
      isActive: true
    })
    .select('name email specialization experience barCouncilNumber phone address joinTeamStatus teamJoinDate profilePicture bio')
    .sort({ teamJoinDate: -1 })
    .limit(parseInt(limit));

    console.log(`✅ Found ${teamLawyers.length} approved team lawyers`);

    res.json({
      success: true,
      lawyers: teamLawyers,
      total: teamLawyers.length
    });
  } catch (error) {
    console.error('❌ Error fetching team lawyers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// Enhanced find lawyers endpoint
router.get('/find', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search = '', 
      specialization = ''
    } = req.query;

    let query = {
      role: 'lawyer',
      isActive: true,
      isVerified: true
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } },
        { barCouncilNumber: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    const lawyers = await User.find(query)
      .select('name email specialization experience barCouncilNumber phone address joinTeamStatus teamJoinDate hasPaid')
      .sort({ 
        joinTeamStatus: -1,
        teamJoinDate: -1,
        experience: -1,
        createdAt: -1
      })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      lawyers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get lawyer verification status
router.get("/verification-status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('role joinTeamStatus verificationRequestedAt verificationDeadline paymentDeadline isVerified hasPaid');
    
    if (user.role !== 'lawyer') {
      return res.status(403).json({
        success: false,
        error: "Only lawyers can check verification status"
      });
    }

    res.json({
      success: true,
      status: user.joinTeamStatus,
      hasPaid: user.hasPaid,
      verificationRequestedAt: user.verificationRequestedAt,
      verificationDeadline: user.verificationDeadline,
      paymentDeadline: user.paymentDeadline,
      isVerified: user.isVerified
    });
  } catch (error) {
    console.error("❌ Error fetching verification status:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update team status after payment
router.put('/update-team-status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const lawyer = await User.findById(req.user.id);

    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }

    lawyer.joinTeamStatus = status;
    if (status === 'paid') {
      lawyer.teamJoinDate = new Date();
      lawyer.hasPaid = true;
    }
    
    await lawyer.save();

    res.json({
      success: true,
      message: 'Team status updated successfully',
      status: lawyer.joinTeamStatus,
      hasPaid: lawyer.hasPaid
    });
  } catch (error) {
    console.error('Error updating team status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Add this temporary debug route
router.get("/debug-status", protect, async (req, res) => {
  try {
    const lawyer = await User.findById(req.user.id).select('joinTeamStatus hasPaid isVerified verificationStatus');
    console.log('🔍 Current lawyer status:', lawyer);
    
    res.json({
      success: true,
      status: lawyer
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;