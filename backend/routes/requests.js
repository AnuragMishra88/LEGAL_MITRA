const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // ✅ Change this line
const Request = require('../models/Request');
const User = require('../models/User');


// Get all requests for lawyers (team members only)
router.get('/lawyer-requests', protect, async (req, res) => {
  try {
    console.log('🔍 Fetching lawyer requests for user:', req.user._id);
    
    // Check if user is a lawyer
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ 
        error: 'Access denied. Lawyer role required.' 
      });
    }

    // Get all pending requests (not assigned to any specific lawyer yet)
     const requests = await Request.find({ 
      $or: [
        { status: 'pending' }, // Pending requests not assigned to any lawyer
        { lawyerId: req.user._id } // Requests assigned to this lawyer (all statuses)
      ]
    })
    .populate('clientId', 'name email phone address')
    .populate('lawyerId', 'name email')
    .sort({ createdAt: -1 });

    console.log('📨 Found requests:', requests.length);

    res.json({ 
      success: true, 
      requests: requests || []
    });
  } catch (error) {
    console.error('Error fetching lawyer requests:', error);
    res.status(500).json({ error: 'Server error fetching requests' });
  }
});




// Get requests for specific lawyer (assigned to them)
router.get('/my-lawyer-requests', protect, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const requests = await Request.find({ 
      lawyerId: req.user._id 
    })
    .populate('clientId', 'name email phone address')
    .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      requests: requests || []
    });
  } catch (error) {
    console.error('Error fetching my lawyer requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept a request
router.put('/:requestId/accept', protect, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update request status and assign to lawyer
    request.status = 'accepted';
    request.lawyerId = req.user._id;
    request.lawyerResponse = req.body.lawyerResponse || 'Case accepted. I will contact you shortly.';
    request.responseDate = new Date();

    await request.save();
    
    // Populate the updated request
    await request.populate('clientId', 'name email phone address');

    res.json({ 
      success: true, 
      message: 'Request accepted successfully',
      request 
    });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ error: 'Server error accepting request' });
  }
});

// Decline a request
router.put('/:requestId/decline', protect, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    request.status = 'declined';
    request.lawyerResponse = reason || 'Unfortunately, I cannot take this case at the moment.';
    request.responseDate = new Date();

    await request.save();
    
    await request.populate('clientId', 'name email phone address');

    res.json({ 
      success: true, 
      message: 'Request declined successfully',
      request 
    });
  } catch (error) {
    console.error('Error declining request:', error);
    res.status(500).json({ error: 'Server error declining request' });
  }
});

module.exports = router;

// Get client's request updates
router.get('/client/updates', protect, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find requests that were updated recently (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const updatedRequests = await Request.find({
      clientId: req.user.id,
      status: { $in: ['accepted', 'declined'] },
      responseDate: { $gte: fiveMinutesAgo }
    }).populate('lawyerId', 'name email');

    res.json({ 
      success: true, 
      updatedRequests 
    });
  } catch (error) {
    console.error('Error fetching client updates:', error);
    res.status(500).json({ error: error.message });
  }
});


// Add to routes/requests.js
// Get client's own requests
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await Request.find({ clientId: req.user.id })
      .populate('lawyerId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching client requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send request to lawyer - use protect instead of auth
router.post('/send', protect, async (req, res) => { // ✅ Change auth to protect
  try {
    console.log('📨 Received request to send:', req.body);
    console.log('👤 User making request:', req.user);

    const { lawyerId, caseSummary, caseType } = req.body;
    
    // Validate required fields
    if (!lawyerId || !caseSummary || !caseType) {
      return res.status(400).json({ 
        error: 'Missing required fields: lawyerId, caseSummary, caseType' 
      });
    }

    // Check if lawyer exists and is actually a lawyer
    const lawyer = await User.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ error: 'Lawyer not found' });
    }
    
    if (lawyer.role !== 'lawyer') {
      return res.status(400).json({ error: 'Selected user is not a lawyer' });
    }

    const request = new Request({
      lawyerId,
      clientId: req.user.id,
      clientName: req.user.name,
      caseSummary,
      caseType,
      contactInfo: {
        email: req.user.email,
        phone: req.user.phone
      }
    });

    console.log('💾 Saving request to database...');
    await request.save();
    console.log('✅ Request saved with ID:', request._id);
    
    // Populate the response for frontend
    const populatedRequest = await Request.findById(request._id)
      .populate('clientId', 'name email phone')
      .populate('lawyerId', 'name email');
      
    console.log('📤 Sending response to client');
    res.json({ 
      success: true, 
      request: populatedRequest,
      message: 'Request sent successfully'
    });
    
  } catch (error) {
    console.error('❌ Error in send request:', error);
    res.status(500).json({ 
      error: 'Internal server error: ' + error.message 
    });
  }
});

// Get lawyer's incoming requests - also use protect
router.get('/lawyer/requests', protect, async (req, res) => { // ✅ Change auth to protect
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

// Check for new requests (for polling) - use protect
router.get('/lawyer/check-new-requests', protect, async (req, res) => { // ✅ Change auth to protect
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

// // Accept/Decline request - use protect
// router.put('/:requestId/respond', protect, async (req, res) => { // ✅ Change auth to protect
//   try {
//     const { status, response } = req.body;
//     const request = await Request.findById(req.params.requestId);

//     if (!request) {
//       return res.status(404).json({ error: 'Request not found' });
//     }

//     if (request.lawyerId.toString() !== req.user.id) {
//       return res.status(403).json({ error: 'Access denied' });
//     }

//     request.status = status;
//     request.lawyerResponse = response;
//     request.responseDate = new Date();

//     await request.save();
    
//     // Populate before sending response
//     const updatedRequest = await Request.findById(request._id)
//       .populate('clientId', 'name email phone');
      
//     res.json({ success: true, request: updatedRequest });
//   } catch (error) {
//     console.error('Error responding to request:', error);
//     res.status(500).json({ error: error.message });
//   }
// });


router.put('/:requestId/respond', protect, async (req, res) => {
  try {
    console.log('🔐 User from token:', req.user.id);
    console.log('🔐 User role:', req.user.role);
    
    const request = await Request.findById(req.params.requestId);
    console.log('📦 Request found:', request);
    console.log('🔐 Request lawyerId:', request.lawyerId);
    console.log('🔐 Comparison:', request.lawyerId.toString(), '===', req.user.id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.lawyerId.toString() !== req.user.id) {
      console.log('❌ Access denied - Lawyer ID mismatch');
      return res.status(403).json({ error: 'Access denied' });
    }

    // Rest of your code...
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;