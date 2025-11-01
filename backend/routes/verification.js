

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, admin } = require("../middleware/auth");
const { sendEmail } = require("../utils/emailService");

// Get all pending verifications
router.get("/pending", protect, admin, async (req, res) => {
  try {
    const pendingLawyers = await User.find({
      role: 'lawyer',
      joinTeamStatus: 'pending' // ✅ Use joinTeamStatus to match your model
    }).select('name email specialization experience barCouncilNumber documents createdAt verificationRequestedAt');

    res.json({
      success: true,
      lawyers: pendingLawyers,
      count: pendingLawyers.length
    });
  } catch (error) {
    console.error("❌ Error fetching pending verifications:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve lawyer verification
router.put("/approve/:id", protect, admin, async (req, res) => {
  try {
    const { reason } = req.body; // Optional approval reason
    const lawyer = await User.findById(req.params.id);
    
    if (!lawyer) {
      return res.status(404).json({ success: false, error: "Lawyer not found" });
    }

    if (lawyer.joinTeamStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: "Lawyer is not in pending status" 
      });
    }

    // ✅ Update all status fields to be consistent
    lawyer.joinTeamStatus = 'approved';
    lawyer.verificationStatus = 'approved';
    lawyer.isVerified = true;
    lawyer.verifiedAt = new Date();
    lawyer.paymentDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days payment deadline
    
    await lawyer.save();

    console.log(`✅ Lawyer approved: ${lawyer.name} (${lawyer.email})`);

    // ✅ SEND APPROVAL EMAIL
    try {
      const emailResult = await sendEmail(
        lawyer.email,
        'verificationApproved',
        {
          name: lawyer.name,
          email: lawyer.email,
          deadline: lawyer.paymentDeadline
        }
      );

      if (emailResult.success) {
        console.log(`✅ Approval email sent to: ${lawyer.email}`);
      } else {
        console.warn(`⚠️ Email sending failed for ${lawyer.email}:`, emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Email service error:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: "Lawyer approved successfully. Notification email sent.",
      lawyer: {
        id: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        status: lawyer.joinTeamStatus,
        paymentDeadline: lawyer.paymentDeadline
      }
    });
  } catch (error) {
    console.error("❌ Error approving lawyer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject lawyer verification
router.put("/reject/:id", protect, admin, async (req, res) => {
  try {
    const { reason = "Please review your documents and information, then re-apply." } = req.body;
    const lawyer = await User.findById(req.params.id);
    
    if (!lawyer) {
      return res.status(404).json({ success: false, error: "Lawyer not found" });
    }

    if (lawyer.joinTeamStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: "Lawyer is not in pending status" 
      });
    }

    // ✅ Update status
    lawyer.joinTeamStatus = 'rejected';
    lawyer.verificationStatus = 'rejected';
    lawyer.rejectionReason = reason;
    
    await lawyer.save();

    console.log(`❌ Lawyer rejected: ${lawyer.name} (${lawyer.email})`);

    // ✅ SEND REJECTION EMAIL
    try {
      const emailResult = await sendEmail(
        lawyer.email,
        'verificationRejected',
        {
          name: lawyer.name,
          email: lawyer.email,
          reason: reason
        }
      );

      if (emailResult.success) {
        console.log(`✅ Rejection email sent to: ${lawyer.email}`);
      } else {
        console.warn(`⚠️ Email sending failed for ${lawyer.email}:`, emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Email service error:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: "Lawyer verification rejected. Notification sent.",
      lawyer: {
        id: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        status: lawyer.joinTeamStatus,
        rejectionReason: reason
      }
    });
  } catch (error) {
    console.error("❌ Error rejecting lawyer:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get verification statistics
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { role: 'lawyer' } },
      {
        $group: {
          _id: '$joinTeamStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await User.countDocuments({ role: 'lawyer' });
    
    res.json({
      success: true,
      stats: stats,
      total: total
    });
  } catch (error) {
    console.error("❌ Error fetching verification stats:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;