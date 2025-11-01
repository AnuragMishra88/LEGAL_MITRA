const express = require("express");
const router = express.Router();
const Case = require("../models/Case");
const User = require("../models/User");
const { protect } = require("../middleware/auth");



// In routes/cases.js - Add this route
// Update client payment status - ENHANCED ERROR HANDLING
router.put('/:id/client-payment', protect, async (req, res) => {
  try {
    console.log('📥 Received client payment update:', {
      caseId: req.params.id,
      body: req.body,
      user: req.user.id
    });

    const { status, amountPaid, agreedAmount, dueDate, paymentNotes } = req.body;
    
    // Validate required fields
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        error: "Payment status is required" 
      });
    }

    // Validate status enum
    const validStatuses = ['unpaid', 'partially_paid', 'paid', 'overdue', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Build update object
    const updateData = {
      $set: {
        'clientPayment.status': status,
        'clientPayment.amountPaid': amountPaid || 0,
        'clientPayment.lastPaymentDate': (status === 'paid' || status === 'partially_paid') ? new Date() : undefined
      }
    };

    // Add optional fields if provided
    if (agreedAmount !== undefined) {
      updateData.$set['clientPayment.agreedAmount'] = agreedAmount;
    }
    if (dueDate) {
      updateData.$set['clientPayment.dueDate'] = dueDate;
    }

    // Add payment history if payment was made
    if ((status === 'paid' || status === 'partially_paid') && amountPaid > 0) {
      updateData.$push = {
        'clientPayment.paymentHistory': {
          amount: amountPaid,
          date: new Date(),
          method: 'manual',
          notes: paymentNotes || `Payment updated to ${status}`
        }
      };
    }

    console.log('🔄 Update data:', updateData);

    const caseDoc = await Case.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!caseDoc) {
      return res.status(404).json({ 
        success: false, 
        error: "Case not found" 
      });
    }

    console.log('✅ Client payment updated successfully:', caseDoc._id);

    res.json({ 
      success: true, 
      case: caseDoc,
      message: "Client payment status updated successfully"
    });

  } catch (error) {
    console.error('💥 Error updating client payment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Database update failed. Please check the data format.'
    });
  }
});

// Get all cases for current user (both lawyer and client)
router.get("/my-cases", protect, async (req, res) => {
  try {
    let cases;
    
    if (req.user.role === 'lawyer') {
      cases = await Case.find({ lawyer: req.user.id }).sort({ createdAt: -1 });
    } else if (req.user.role === 'client') {
      cases = await Case.find({ client: req.user.id }).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ success: true, cases });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new case (Lawyer) - WITH PAYMENT CHECK
router.post("/create", protect, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: "Only lawyers can create cases" });
    }

    // Check if user has paid
    const user = await User.findById(req.user.id);
    if (!user.hasPaid) {
      return res.status(402).json({ 
        success: false,
        error: "Payment required",
        message: "Please complete the one-time payment to add cases" 
      });
    }

    const caseData = {
      ...req.body,
      lawyer: req.user.id,
      // No payment fields needed for subsequent cases
    };

    const newCase = new Case(caseData);
    await newCase.save();

    res.status(201).json({ success: true, case: newCase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create case after payment verification
router.post("/create-after-payment", protect, async (req, res) => {
  try {
    console.log("=== CREATE AFTER PAYMENT ===");
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: "User not authenticated" 
      });
    }

    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ 
        success: false,
        error: "Only lawyers can create cases" 
      });
    }

    // Verify payment data is present
    if (!req.body.paymentId || !req.body.razorpayOrderId) {
      return res.status(400).json({
        success: false,
        error: "Payment verification data is missing"
      });
    }

    const { caseData, paymentId, razorpayOrderId } = req.body;

    const caseWithPayment = {
      ...caseData,
      lawyer: req.user.id,
      lawyerName: req.user.name,
      lawyerEmail: req.user.email,
      paymentId: paymentId,
      paymentStatus: 'completed',
      paymentAmount: 500,
      razorpayOrderId: razorpayOrderId,
      status: 'ongoing'
    };

    console.log("Creating case with data:", caseWithPayment);

    const newCase = new Case(caseWithPayment);
    await newCase.save();

    console.log("Case created successfully:", newCase._id);

    res.status(201).json({ 
      success: true, 
      message: "Case created successfully after payment",
      case: newCase 
    });
  } catch (error) {
    console.error('Error creating case after payment:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Create new case (Client)
router.post("/client/create", protect, async (req, res) => {
  try {
    console.log("Client case creation request:", req.body);
    console.log("User role:", req.user.role);
    
    if (req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false, 
        error: "Only clients can create client cases" 
      });
    }

    // Map the form data to match your Case model
    const caseData = {
      caseName: req.body.caseName,
      caseType: req.body.caseType,
      caseNumber: req.body.caseNumber,
      courtName: req.body.courtName,
      filingDate: req.body.filingDate,
      nextHearing: req.body.nextHearing,
      caseDescription: req.body.caseDescription || req.body.description,
      lawyerName: req.body.lawyerName,
      lawyerEmail: req.body.lawyerEmail,
      lawyerPhone: req.body.lawyerPhone,
      client: req.user.id,
      clientName: req.user.name,
      clientEmail: req.user.email,
      status: 'ongoing',
      priority: 'medium'
    };

    console.log("Case data to save:", caseData);

    const newCase = new Case(caseData);
    await newCase.save();

    res.status(201).json({ 
      success: true, 
      message: "Case created successfully",
      case: newCase 
    });
  } catch (error) {
    console.error("Error creating client case:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Update case status (Both lawyer and client)
router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    let updatedCase;

    if (req.user.role === 'lawyer') {
      updatedCase = await Case.findOneAndUpdate(
        { _id: req.params.id, lawyer: req.user.id },
        { status },
        { new: true }
      );
    } else if (req.user.role === 'client') {
      updatedCase = await Case.findOneAndUpdate(
        { _id: req.params.id, client: req.user.id },
        { status },
        { new: true }
      );
    }

    if (!updatedCase) return res.status(404).json({ msg: "Case not found" });
    res.json({ success: true, case: updatedCase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update case notes (Both lawyer and client)
router.put("/:id/notes", protect, async (req, res) => {
  try {
    const { notes } = req.body;
    let updatedCase;

    if (req.user.role === 'lawyer') {
      updatedCase = await Case.findOneAndUpdate(
        { _id: req.params.id, lawyer: req.user.id },
        { notes },
        { new: true }
      );
    } else if (req.user.role === 'client') {
      updatedCase = await Case.findOneAndUpdate(
        { _id: req.params.id, client: req.user.id },
        { notes },
        { new: true }
      );
    }

    if (!updatedCase) return res.status(404).json({ msg: "Case not found" });
    res.json({ success: true, case: updatedCase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update case details (Edit functionality)
router.put("/:id", protect, async (req, res) => {
  try {
    let updatedCase;

    if (req.user.role === 'lawyer') {
      updatedCase = await Case.findOneAndUpdate(
        { _id: req.params.id, lawyer: req.user.id },
        { ...req.body },
        { new: true }
      );
    } else if (req.user.role === 'client') {
      // Clients can only update specific fields for their cases
      const allowedFields = {
        caseName: req.body.caseName,
        caseType: req.body.caseType,
        caseNumber: req.body.caseNumber,
        courtName: req.body.courtName,
        filingDate: req.body.filingDate,
        nextHearing: req.body.nextHearing,
        caseDescription: req.body.caseDescription,
        lawyerName: req.body.lawyerName,
        lawyerEmail: req.body.lawyerEmail,
        lawyerPhone: req.body.lawyerPhone
      };

      updatedCase = await Case.findOneAndUpdate(
        { _id: req.params.id, client: req.user.id },
        { ...allowedFields },
        { new: true }
      );
    }

    if (!updatedCase) return res.status(404).json({ msg: "Case not found" });
    res.json({ success: true, case: updatedCase });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get solved cases
router.get("/solved-cases", protect, async (req, res) => {
  try {
    let solvedCases;
    
    if (req.user.role === 'lawyer') {
      solvedCases = await Case.find({ 
        lawyer: req.user.id, 
        status: 'solved' 
      }).sort({ updatedAt: -1 });
    } else if (req.user.role === 'client') {
      solvedCases = await Case.find({ 
        client: req.user.id, 
        status: 'solved' 
      }).sort({ updatedAt: -1 });
    } else {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ success: true, cases: solvedCases });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ongoing cases
router.get("/ongoing-cases", protect, async (req, res) => {
  try {
    let ongoingCases;
    
    if (req.user.role === 'lawyer') {
      ongoingCases = await Case.find({ 
        lawyer: req.user.id, 
        status: 'ongoing' 
      }).sort({ createdAt: -1 });
    } else if (req.user.role === 'client') {
      ongoingCases = await Case.find({ 
        client: req.user.id, 
        status: 'ongoing' 
      }).sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ success: true, cases: ongoingCases });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete case
router.delete("/:id", protect, async (req, res) => {
  try {
    let deletedCase;

    if (req.user.role === 'lawyer') {
      deletedCase = await Case.findOneAndDelete({
        _id: req.params.id,
        lawyer: req.user.id
      });
    } else if (req.user.role === 'client') {
      deletedCase = await Case.findOneAndDelete({
        _id: req.params.id,
        client: req.user.id
      });
    }

    if (!deletedCase) return res.status(404).json({ msg: "Case not found" });
    res.json({ success: true, message: "Case deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create client case after payment
router.post('/client/create-after-payment', protect, async (req, res) => {
  try {
    const { caseData, paymentId, razorpayOrderId } = req.body;
    
    console.log('📦 Creating client case after payment:', {
      caseName: caseData.caseName,
      paymentId: paymentId,
      userId: req.user.id
    });

    const newCase = new Case({
      ...caseData,
      userId: req.user.id,
      paymentId: paymentId,
      razorpayOrderId: razorpayOrderId,
      createdBy: req.user.id
    });

    const savedCase = await newCase.save();
    
    console.log('✅ Client case created after payment:', savedCase._id);

    res.status(201).json({
      success: true,
      case: savedCase
    });
  } catch (error) {
    console.error('❌ Error creating client case after payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create case: ' + error.message
    });
  }
});

// Create client case (direct - for already paid users)
router.post('/client/create', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check if client has paid
    if (!user.hasPaid) {
      return res.status(402).json({
        success: false,
        error: 'Payment required to add cases'
      });
    }

    console.log('📦 Creating client case for paid user:', req.user.id);

    const newCase = new Case({
      ...req.body,
      userId: req.user.id,
      createdBy: req.user.id
    });

    const savedCase = await newCase.save();
    
    console.log('✅ Client case created:', savedCase._id);

    res.status(201).json({
      success: true,
      case: savedCase
    });
  } catch (error) {
    console.error('❌ Error creating client case:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create case: ' + error.message
    });
  }
});

// Get case by ID
router.get("/:id", protect, async (req, res) => {
  try {
    let caseItem;

    if (req.user.role === 'lawyer') {
      caseItem = await Case.findOne({ _id: req.params.id, lawyer: req.user.id });
    } else if (req.user.role === 'client') {
      caseItem = await Case.findOne({ _id: req.params.id, client: req.user.id });
    }

    if (!caseItem) return res.status(404).json({ msg: "Case not found" });
    res.json({ success: true, case: caseItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;