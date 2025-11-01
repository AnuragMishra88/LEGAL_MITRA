const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Initialize Razorpay with environment validation
console.log('🔑 Initializing Razorpay...');
console.log('📝 Key ID present:', !!process.env.RAZORPAY_KEY_ID);
console.log('📝 Key Secret present:', !!process.env.RAZORPAY_KEY_SECRET);

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ MISSING RAZORPAY CREDENTIALS IN .env FILE');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'test_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_key_secret'
});

// Test Razorpay connection
router.get('/test-connection', async (req, res) => {
  try {
    console.log('🧪 Testing Razorpay connection...');
    const payments = await razorpay.payments.all({ count: 1 });
    console.log('✅ Razorpay connection successful');
    res.json({ success: true, message: 'Razorpay connection working' });
  } catch (error) {
    console.error('❌ Razorpay connection failed:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Razorpay connection failed: ' + error.message 
    });
  }
});

// Create Razorpay order
router.post('/create-order', protect, async (req, res) => {
  try {
    console.log('💰 CREATE ORDER REQUEST');
    console.log('👤 User:', req.user.id);
    console.log('📦 Request body:', req.body);

    const { amount, currency = 'INR' } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        error: 'Amount is required'
      });
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency: currency,
      notes: {
        userId: req.user.id,
        userEmail: req.user.email
      }
    };

    console.log('📋 Order options:', options);

    const order = await razorpay.orders.create(options);
    
    console.log('✅ Order created successfully:', order.id);
    console.log('🎯 Order details:', {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    console.error('❌ Error details:', error.error ? error.error.description : error.message);
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create payment order: ' + (error.error?.description || error.message) 
    });
  }
});

// Client payment status check
router.get('/client-payment-status', protect, async (req, res) => {
  try {
    console.log('🔍 Checking client payment status for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('📊 Client payment status:', {
      hasPaid: user.hasPaid,
      paymentDate: user.paymentDate,
      userId: user._id
    });

    res.json({
      success: true,
      hasPaid: user.hasPaid || false,
      paymentDate: user.paymentDate,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Error checking client payment status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check payment status: ' + error.message 
    });
  }
});

// Client payment verification
router.post('/verify-client-payment', protect, async (req, res) => {
  try {
    console.log('=== 🚀 CLIENT PAYMENT VERIFICATION STARTED ===');
    console.log('👤 Verifying client payment for user:', req.user.id);
    console.log('📦 Full request body:', JSON.stringify(req.body, null, 2));

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate input data
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.log('❌ Missing payment verification data');
      return res.status(400).json({
        success: false,
        error: 'Missing payment verification data'
      });
    }

    console.log('🔐 Starting client signature verification...');
    
    // Generate expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    console.log('🔍 CLIENT SIGNATURE COMPARISON:');
    console.log('✅ Expected:', expectedSignature);
    console.log('📨 Received:', razorpay_signature);
    console.log('🔗 Match:', expectedSignature === razorpay_signature);

    if (expectedSignature === razorpay_signature) {
      console.log('🎉 CLIENT SIGNATURE VERIFICATION SUCCESSFUL!');
      
      // MARK USER AS PAID
      const updatedUser = await User.findByIdAndUpdate(
        req.user.id, 
        {
          hasPaid: true,
          paymentDate: new Date(),
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id
        },
        { new: true }
      );

      console.log(`✅ Client ${req.user.id} successfully marked as paid`);

      res.json({ 
        success: true, 
        message: 'Client payment verified successfully',
        paymentId: razorpay_payment_id
      });
    } else {
      console.log('❌ CLIENT SIGNATURE VERIFICATION FAILED!');
      res.status(400).json({ 
        success: false, 
        error: 'Client payment verification failed - signature mismatch'
      });
    }
  } catch (error) {
    console.error('💥 CRITICAL ERROR in client payment verification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Client payment verification failed: ' + error.message 
    });
  }
});

// Verify payment - COMPREHENSIVE DEBUGGING
router.post("/verify-payment", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    
    console.log('🔍 Payment verification request:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      amount: amount,
      user_id: req.user.id
    });

    // 1. Basic validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing payment verification data"
      });
    }

    // 2. Determine payment type based on amount
    let paymentType = 'personal';
    let updateData = {
      hasPaid: true,
      paymentDate: new Date(),
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id
    };

    if (amount === 1799) {
      // Personal access payment (Lawyer Personal or Client)
      paymentType = 'personal';
      console.log('✅ Personal access payment (₹1799)');
      
    } else if (amount === 2499) {
      // Team membership payment  
      paymentType = 'team';
      updateData.joinTeamStatus = 'paid';
      console.log('✅ Team membership payment (₹2499)');
      
    } 
    else if (amount === 700) {
  // This is an upgrade payment
  paymentType = 'upgrade';
  updateData.joinTeamStatus = 'paid';
  console.log('✅ Team upgrade payment (₹700)');
}

    
    
    else {
      console.error('❌ Unknown payment amount:', amount);
      return res.status(400).json({
        success: false,
        error: "Unknown payment amount"
      });
    }

    // 3. Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('name email hasPaid joinTeamStatus');

    console.log('✅ User updated:', updatedUser.name, 'Payment type:', paymentType);

    res.json({
      success: true,
      message: "Payment verified successfully",
      paymentType: paymentType,
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    console.error('💥 Error in verify-payment:', error);
    res.status(500).json({
      success: false,
      error: "Payment verification failed"
    });
  }
});

// Check payment status endpoint
router.get('/payment-status', protect, async (req, res) => {
  try {
    console.log('🔍 Checking payment status for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('📊 User payment status:', {
      hasPaid: user.hasPaid,
      paymentDate: user.paymentDate,
      userId: user._id
    });

    res.json({
      success: true,
      hasPaid: user.hasPaid || false,
      paymentDate: user.paymentDate,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check payment status: ' + error.message 
    });
  }
});

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  console.log('🧪 Payment routes test endpoint hit');
  res.json({ 
    success: true, 
    message: 'Payment routes are working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;