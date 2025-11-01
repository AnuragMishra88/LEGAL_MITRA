// MyCollection.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import './MyCollection.css';
import userAvatar from '../../../assets/default-avatar.png';
import { PRICING } from '../../../config/pricing';
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Add this import for routing
import { useNavigate, useLocation } from 'react-router-dom';






// Enhanced Payment Badge with More Information
const getClientPaymentBadge = (clientPayment) => {
  if (!clientPayment) return null;
  
  const statusConfig = {
    unpaid: { 
      color: 'red', 
      text: 'Unpaid', 
      icon: '❌',
      details: 'No payments received'
    },
    partially_paid: { 
      color: 'orange', 
      text: `₹${clientPayment.amountPaid || 0}/${clientPayment.agreedAmount || 0}`, 
      icon: '⚠️',
      details: `Partially paid (${Math.round(((clientPayment.amountPaid || 0) / (clientPayment.agreedAmount || 1)) * 100)}%)`
    },
    paid: { 
      color: 'green', 
      text: `Paid ₹${clientPayment.amountPaid || 0}`, 
      icon: '✅',
      details: 'Fully paid'
    },
    overdue: { 
      color: 'darkred', 
      text: 'Overdue', 
      icon: '🚨',
      details: 'Payment past due date'
    },
    refunded: { 
      color: 'blue', 
      text: 'Refunded', 
      icon: '↩️',
      details: 'Payment refunded'
    }
  };
  
  const config = statusConfig[clientPayment.status] || statusConfig.unpaid;
  
  return (
    <span 
    className={`payment-badge ${config.color}`}
    title={config.details}
    >
      {config.icon} {config.text}
    </span>
  );
};

// Add this temporary test function to your MyCollection.jsx
const testLawyerAPI = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/lawyer/verification-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🔍 API Response Status:', response.status);
    const data = await response.json();
    console.log('🔍 API Response Data:', data);
    
    return data;
  } catch (error) {
    console.error('❌ API Test Error:', error);
  }
};

// Cloudinary Configuration - Updated with your preset
const CLOUDINARY_CONFIG = {
  cloudName: 'dwua2kvwe', // You'll need to replace this with your actual cloud name
  uploadPreset: 'legalmitra_documents'
};

// Document Settings
const DOCUMENT_SETTINGS = {
  allowedFormats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt'],
  maxFileSize: 5000000, // 5MB in bytes
  resourceType: 'auto' // This is crucial for PDFs
};

const MyCollection = () => {
  const { user } = useAuth();

   // Add routing functionality here
  const navigate = useNavigate();
  const location = useLocation();
  

  const [showForm, setShowForm] = useState(false);
  const [expandedCase, setExpandedCase] = useState(null);
  const [caseNotes, setCaseNotes] = useState({});
  const [requestNotifications, setRequestNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // FIXED: Enhanced payment status with localStorage backup
  const [hasPaid, setHasPaid] = useState(() => {
    const savedPaymentStatus = localStorage.getItem('userHasPaid');
    const savedTeamStatus = localStorage.getItem('joinTeamStatus');
    return savedPaymentStatus === 'true' || savedTeamStatus === 'paid';
  });
  
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [showSolvedCases, setShowSolvedCases] = useState(false);
  const [showClientCaseForm, setShowClientCaseForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [caseDataBeforePayment, setCaseDataBeforePayment] = useState(null);
  const [lawyerCases, setLawyerCases] = useState([]);
  const [clientCases, setClientCases] = useState([]);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [hasPaidClient, setHasPaidClient] = useState(() => {
    const savedPaymentStatus = localStorage.getItem('userHasPaidClient');
    return savedPaymentStatus === 'true';
  });
  const [clientPaymentLoading, setClientPaymentLoading] = useState(false);
  const [showClientPayment, setShowClientPayment] = useState(false);
  const [clientCaseDataBeforePayment, setClientCaseDataBeforePayment] = useState(null);
  const [callLogs, setCallLogs] = useState({});
  const [showCallModal, setShowCallModal] = useState(false);
  const [selectedCaseForCall, setSelectedCaseForCall] = useState(null);
   const [myRequests, setMyRequests] = useState([]); // <-- ADD THIS LINE

  // FIXED: Enhanced team status with localStorage backup
  const [joinTeamStatus, setJoinTeamStatus] = useState(() => {
    const savedTeamStatus = localStorage.getItem('joinTeamStatus');
    return savedTeamStatus || 'not_requested';
  });
  
  const [showJoinTeamPopup, setShowJoinTeamPopup] = useState(false);
  const [teamPaymentLoading, setTeamPaymentLoading] = useState(false);
  const [showTeamPayment, setShowTeamPayment] = useState(false);
  const [verificationDeadline, setVerificationDeadline] = useState(null);
  const [paymentDeadline, setPaymentDeadline] = useState(null);
  
  // Legal Expense Calculator State
  const [showExpenseCalculator, setShowExpenseCalculator] = useState(false);
  const [selectedCaseForExpense, setSelectedCaseForExpense] = useState(null);
  const [expenseData, setExpenseData] = useState(() => {
    const saved = localStorage.getItem('legalExpenses');
    return saved ? JSON.parse(saved) : {};
  });


  const [selectedCaseForVault, setSelectedCaseForVault] = useState(null);
const [showDocumentVault, setShowDocumentVault] = useState(false);
const [documents, setDocuments] = useState(() => {
  const saved = localStorage.getItem('caseDocuments');
  return saved ? JSON.parse(saved) : {};
});
const [uploading, setUploading] = useState(false);
const [selectedFolder, setSelectedFolder] = useState('general');

// Add to your existing state
const [incomingRequests, setIncomingRequests] = useState([]);
const [isPolling, setIsPolling] = useState(false);
const [lastRequestCheck, setLastRequestCheck] = useState(null);


// Add to your existing state
const [clientRequests, setClientRequests] = useState([]);
const [selectedRequest, setSelectedRequest] = useState(null);
const [showRequestDetails, setShowRequestDetails] = useState(false);
const [requestsFilter, setRequestsFilter] = useState('all'); // 'all', 'pending', 'accepted', 'declined'


// Add this state to your existing state variables
const [showClientDetailsModal, setShowClientDetailsModal] = useState(false);
const [selectedClientForDetails, setSelectedClientForDetails] = useState(null);


 // Add routing effect for navigation
  useEffect(() => {
    // Handle route-based actions if needed
    const handleRouteActions = () => {
      const searchParams = new URLSearchParams(location.search);
      const action = searchParams.get('action');
      
      if (action === 'add-case' && user?.role === 'lawyer') {
        setShowForm(true);
      } else if (action === 'add-client-case' && user?.role === 'client') {
        setShowClientCaseForm(true);
      } else if (action === 'view-profile') {
        setShowProfileCard(true);
      }
    };

    handleRouteActions();
  }, [location, user]);

  // Add navigation functions
  const navigateToCaseDetails = (caseId) => {
    navigate(`/case/${caseId}`);
  };

  const navigateToPayment = (type) => {
    if (type === 'client') {
      setShowClientPayment(true);
    } else if (type === 'team') {
      setShowTeamPayment(true);
    } else {
      setShowPayment(true);
    }
  };

  const navigateToDocumentVault = (caseItem) => {
    setSelectedCaseForVault(caseItem);
    setShowDocumentVault(true);
  };

  const navigateToExpenseCalculator = (caseItem) => {
    setSelectedCaseForExpense(caseItem);
    setShowExpenseCalculator(true);
  };

  

  const [newClientCase, setNewClientCase] = useState({
    caseName: '',
    caseType: '',
    caseNumber: '',
    courtName: '',
    filingDate: '',
    nextHearing: '',
    caseDescription: '',
    lawyerName: '',
    lawyerEmail: '',
    lawyerPhone: '',
    status: 'ongoing'
  });

  const [newCase, setNewCase] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    caseName: '',
    caseType: '',
    caseNumber: '',
    courtName: '',
    filingDate: '',
    nextHearing: '',
    caseValue: '',
    opponentName: '',
    opponentLawyer: '',
    description: '',
    priority: 'medium',
    status: 'ongoing'
  });

  // Legal Expense Calculator State
  const [expenseForm, setExpenseForm] = useState({
    lawyerFees: '',
    courtFees: '',
    travelExpenses: '',
    documentFees: '',
    miscellaneous: '',
    estimatedDuration: '6'
  });

  // FIXED: Enhanced localStorage sync
  useEffect(() => {
    // Sync localStorage with state on component mount
    const savedTeamStatus = localStorage.getItem('joinTeamStatus');
    const savedPaymentStatus = localStorage.getItem('userHasPaid');
    
    if (savedTeamStatus && savedTeamStatus !== joinTeamStatus) {
      setJoinTeamStatus(savedTeamStatus);
    }
    
    if (savedPaymentStatus === 'true' && !hasPaid) {
      setHasPaid(true);
    }
  }, []);

  useEffect(() => {
  let isMounted = true;

  const initializeData = async () => {
    if (user && isMounted) {
      console.log('🔄 Initializing data for user:', user.role);
      
      if (user.role === 'lawyer') {
        await checkPaymentStatus();
        if (isMounted) await fetchLawyerCases();
        if (isMounted) await checkLawyerVerificationStatus();
      } else if (user.role === 'client') {
        await checkClientPaymentStatus();
        if (isMounted) await fetchClientCases();
        if (isMounted) setCheckingPayment(false);
      }
    }
  };

  initializeData();

  // ✅ Cleanup function - prevents state updates after unmount
  return () => {
    isMounted = false;
  };
}, [user?._id]); // Keep your existing dependency

// Add this function to handle viewing client details
const viewClientDetails = (request) => {
  setSelectedClientForDetails(request);
  setShowClientDetailsModal(true);
};

// Add this modal component function
const renderClientDetailsModal = () => {
  if (!selectedClientForDetails) return null;

  const client = selectedClientForDetails.clientId;
  const request = selectedClientForDetails;

  return (
    <div className="modal-overlay">
      <div className="modal client-details-modal">
        <div className="modal-header">
          <h3>👤 Client Details</h3>
          <button 
            className="close-btn"
            onClick={() => {
              setShowClientDetailsModal(false);
              setSelectedClientForDetails(null);
            }}
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          {/* Client Basic Information */}
          <div className="client-info-section">
            <div className="client-avatar-large">
              {client?.name?.charAt(0) || 'C'}
            </div>
            <div className="client-basic-info">
              <h4>{client?.name || 'Not provided'}</h4>
              <div className="client-contact-info">
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <span>{client?.email || 'Not provided'}</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <span>{client?.phone || 'Not provided'}</span>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🏠</span>
                  <span>{client?.address || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Case Information */}
          <div className="details-section">
            <h5>📋 Case Information</h5>
            <div className="details-grid">
              <div className="detail-item">
                <strong>Case Type:</strong>
                <span>{request.caseType}</span>
              </div>
              <div className="detail-item">
                <strong>Priority:</strong>
                <span className={`priority-badge ${request.priority}`}>
                  {request.priority || 'Normal'}
                </span>
              </div>
              <div className="detail-item">
                <strong>Urgency:</strong>
                <span>{request.urgency || 'Standard'}</span>
              </div>
              
              
              <div className="detail-item">
                <strong>Submitted:</strong>
                <span>{new Date(request.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Case Summary */}
          <div className="details-section">
            <h5>📝 Case Summary</h5>
            <div className="case-summary-content">
              <p>{request.caseSummary}</p>
            </div>
          </div>

          {/* Additional Notes */}
          {request.additionalNotes && (
            <div className="details-section">
              <h5>📌 Additional Notes</h5>
              <div className="additional-notes-content">
                <p>{request.additionalNotes}</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="details-section">
            <h5>⚡ Quick Actions</h5>
            <div className="quick-actions-grid">
              {client?.phone && (
                <button 
                  className="action-btn call-btn"
                  onClick={() => {
                    window.open(`tel:${client.phone}`, '_self');
                    setShowClientDetailsModal(false);
                  }}
                >
                  <span className="action-icon">📞</span>
                  Call Client
                </button>
              )}
              {client?.email && (
                <button 
                  className="action-btn email-btn"
                  onClick={() => {
                    window.open(`mailto:${client.email}?subject=Regarding your case: ${request.caseType}`, '_self');
                    setShowClientDetailsModal(false);
                  }}
                >
                  <span className="action-icon">📧</span>
                  Email Client
                </button>
              )}
              <button 
                className="action-btn copy-btn"
                onClick={() => {
                  const clientInfo = `
Client: ${client?.name}
Email: ${client?.email}
Phone: ${client?.phone}
Address: ${client?.address}

Case: ${request.caseType}
Priority: ${request.priority}
Budget: ${request.budgetRange}
                  `.trim();
                  navigator.clipboard.writeText(clientInfo);
                  alert('Client information copied to clipboard!');
                }}
              >
                <span className="action-icon">📋</span>
                Copy Details
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          
          {request.status === 'pending' && (
            <div className="footer-actions">
              <button 
                className="btn primary-btn accept-btn"
                onClick={() => {
                  handleAcceptRequest(request);
                  setShowClientDetailsModal(false);
                }}
              >
                ✅ Accept Case
              </button>
              <button 
                className="btn danger-btn"
                onClick={() => {
                  const reason = prompt('Please provide a reason for declining:');
                  if (reason !== null) {
                    handleDeclineRequest(request, reason);
                    setShowClientDetailsModal(false);
                  }
                }}
              >
                ❌ Decline
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


  // Initialize expense data for cases
  useEffect(() => {
    if (user?.role === 'client' && clientCases.length > 0) {
      const updatedExpenseData = { ...expenseData };
      let needsUpdate = false;
      
      clientCases.forEach(caseItem => {
        if (!updatedExpenseData[caseItem._id]) {
          updatedExpenseData[caseItem._id] = {
            lawyerFees: '0',
            courtFees: '0',
            travelExpenses: '0',
            documentFees: '0',
            miscellaneous: '0',
            estimatedDuration: '6',
            payments: []
          };
          needsUpdate = true;
        }
      });
      
      if (needsUpdate) {
        setExpenseData(updatedExpenseData);
        localStorage.setItem('legalExpenses', JSON.stringify(updatedExpenseData));
      }
    }
  }, [clientCases, user?.role]);
  // Add this useEffect for notification permission
useEffect(() => {
  // Request notification permission when component mounts
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }
}, []);


// Poll for request updates
const checkRequestUpdates = async () => {
  if (user?.role !== 'client') return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/requests/client/updates`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.updatedRequests && data.updatedRequests.length > 0) {
        data.updatedRequests.forEach(request => {
          showClientNotification(request);
        });
      }
    }
  } catch (error) {
    console.error('Error checking request updates:', error);
  }
};

// Show notification to client
const showClientNotification = (request) => {
  // Create a unique key for this notification
  const notificationKey = `notified_${request._id}_${request.status}`;
  
  // Check if we've already shown this notification
  if (localStorage.getItem(notificationKey)) {
    return; // Already shown, don't show again
  }

  
  // Mark this notification as shown
  localStorage.setItem(notificationKey, 'true');
  
  // Optional: Clean up old notifications after some time (e.g., 1 hour)
  setTimeout(() => {
    localStorage.removeItem(notificationKey);
  }, 60 * 60 * 1000); // 1 hour
};

// Start polling for clients
useEffect(() => {
  if (user?.role === 'client') {
    const interval = setInterval(checkRequestUpdates, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }
}, [user?.role]);


// Add this function anywhere in your MyCollection component (before checkForNewRequests)
const showRequestNotification = (request) => {
  console.log('🔔 New request notification:', request.clientName);
  
  // Show browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`📨 New Case Request from ${request.clientName}`, {
      body: `Case Type: ${request.caseType}\nSummary: ${request.caseSummary.substring(0, 100)}...`,
      icon: '/favicon.ico'
    });
  }
  
  // Fallback: Show alert if notifications not supported
  if (!('Notification' in window)) {
    alert(`📨 New request from ${request.clientName}\nCase: ${request.caseType}`);
  }
};

  // Update the checkForNewRequests function to use the correct endpoint
const checkForNewRequests = async () => {
  if (user?.role !== 'lawyer' || !hasPaid) return;
  
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (lastRequestCheck) {
      params.append('lastCheck', lastRequestCheck.toISOString());
    }

    console.log('🔄 Checking for new requests...');
    
    const response = await fetch(`${API_BASE_URL}/api/lawyer/check-new-requests?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Polling response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('📨 Polling found requests:', data.requests?.length || 0);
      
      if (data.requests && data.requests.length > 0) {
        // Enhanced duplicate filtering - check both ID and notification status
        const newRequests = data.requests.filter(newReq => {
          const isDuplicate = incomingRequests.some(existingReq => existingReq._id === newReq._id);
          const alreadyNotified = localStorage.getItem(`lawyer_notified_${newReq._id}`);
          
          return !isDuplicate && !alreadyNotified;
        });
        
        if (newRequests.length > 0) {
          console.log('🎯 Adding new requests:', newRequests.length);
          // Add new requests to state
          setIncomingRequests(prev => [...newRequests, ...prev]);
          
          // Show notifications for new requests and mark as notified
          newRequests.forEach(request => {
            showRequestNotification(request);
            // Mark this request as notified to prevent duplicates
            localStorage.setItem(`lawyer_notified_${request._id}`, 'true');
          });
        }
      }
      
      setLastRequestCheck(new Date());
    } else {
      console.error('❌ Polling failed with status:', response.status);
    }
  } catch (error) {
    console.error('💥 Error checking requests:', error);
  }
};
// Add this useEffect for polling
useEffect(() => {
  if (user?.role === 'lawyer' && hasPaid) {
    setIsPolling(true);
    
    // Start polling immediately
    checkForNewRequests();
    
    // Then poll every 10 seconds
    const pollInterval = setInterval(checkForNewRequests, 10000);
    
    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }
}, [user?.role, hasPaid]);


// Update handleAcceptRequest for dynamic status change
const handleAcceptRequest = async (request) => {
  try {
    console.log('✅ Accepting request:', request._id);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/requests/${request._id}/respond`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'accepted',
        response: `I accept your case request. I will contact you at ${request.contactInfo?.email || request.clientId?.email}`
      })
    });

    if (response.ok) {
      // Remove from incoming requests immediately
      setIncomingRequests(prev => prev.filter(req => req._id !== request._id));
      
      // Update clientRequests to show the accepted status
      setClientRequests(prev => prev.map(req => 
        req._id === request._id 
          ? { ...req, status: 'accepted' }
          : req
      ));
      
      console.log('✅ Request accepted successfully');
      alert(`✅ Accepted request from ${request.clientName}. They have been notified.`);
    } else {
      throw new Error('Failed to accept request');
    }
  } catch (error) {
    console.error('Error accepting request:', error);
    alert('❌ Failed to accept request. Please try again.');
  }
};

// Update handleDeclineRequest for dynamic status change
const handleDeclineRequest = async (request, reason = '') => {
  try {
    console.log('❌ Declining request:', request._id);
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/requests/${request._id}/respond`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'declined',
        response: reason || 'Unfortunately, I cannot take this case at the moment due to workload/specialization constraints.'
      })
    });

    if (response.ok) {
      // Remove from incoming requests immediately
      setIncomingRequests(prev => prev.filter(req => req._id !== request._id));
      
      // Update clientRequests to show the declined status
      setClientRequests(prev => prev.map(req => 
        req._id === request._id 
          ? { ...req, status: 'declined' }
          : req
      ));
      
      console.log('❌ Request declined successfully');
      alert(`❌ Declined request from ${request.clientName}. They have been notified.`);
    } else {
      throw new Error('Failed to decline request');
    }
  } catch (error) {
    console.error('Error declining request:', error);
    alert('❌ Failed to decline request. Please try again.');
  }
};
// Update the renderRequestNotifications function to include close buttons
const renderRequestNotifications = () => {
  if (incomingRequests.length === 0) return null;

  return (
    <div className="request-notifications">
      <div className="notifications-header">
        <h3>📨 New Client Requests</h3>
        <button 
          className="close-all-btn"
          onClick={() => setIncomingRequests([])}
        >
          Close All
        </button>
      </div>
      <div className="requests-list">
        {incomingRequests.map((request, index) => (
          <div key={request.id || index} className="request-notification">
            <div className="notification-header">
              <div className="request-header">
                <strong>{request.clientName}</strong>
                <span className="request-time">
                  {new Date(request.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <button 
                className="close-notification-btn"
                onClick={() => {
                  // Remove this specific notification
                  setIncomingRequests(prev => 
                    prev.filter(req => req._id !== request._id)
                  );
                }}
              >
                ✕
              </button>
            </div>
            <div className="request-summary">
              {request.caseSummary}
            </div>
            <div className="request-actions">
              <button 
                className="accept-btn"
                onClick={() => handleAcceptRequest(request)}
              >
                ✅ Accept
              </button>
              <button 
                className="decline-btn"
                onClick={() => handleDeclineRequest(request)}
              >
                ❌ Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
// Update your existing fetchMyRequests function
const fetchMyRequests = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/requests/my-requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      setMyRequests(data.requests || []);
      
      // Check for new responses
      const newResponses = data.requests.filter(req => 
        (req.status === 'accepted' || req.status === 'declined') && 
        !req.notificationShown
      );
      
      newResponses.forEach(request => {
        showClientNotification(request);
      });
    }
  } catch (error) {
    console.error('Error fetching my requests:', error);
  }
};

  // CLIENT PAYMENT FUNCTIONS - Add to your MyCollection.jsx

// Update client payment status
// FIXED: Update client payment status function
// FIXED: Update client payment status function
const updateClientPaymentStatus = async (caseId, paymentData) => {
  try {
    const token = localStorage.getItem('token');
    console.log('💰 Updating client payment:', { caseId, paymentData });
    
    const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/client-payment`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    console.log('📡 Client payment update response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update payment status');
    }

    const data = await response.json();
    console.log('✅ Client payment update successful:', data);
    
    // Update local state - FIXED: Use the correct state setter
    if (user?.role === 'lawyer') {
      setLawyerCases(prev => prev.map(caseItem => 
        caseItem._id === caseId ? { ...caseItem, clientPayment: data.case.clientPayment } : caseItem
      ));
    }
    
    // alert('✅ Client payment status updated!');
    return data;
  } catch (error) {
    console.error('❌ Error updating client payment:', error);
    alert(`❌ Failed to update payment status: ${error.message}`);
    throw error;
  }
};

  // Calculate total expenses for a case
  const calculateTotalExpenses = (caseId) => {
    const expenses = expenseData[caseId];
    if (!expenses) return 0;
    
    return (
      parseInt(expenses.lawyerFees || 0) +
      parseInt(expenses.courtFees || 0) +
      parseInt(expenses.travelExpenses || 0) +
      parseInt(expenses.documentFees || 0) +
      parseInt(expenses.miscellaneous || 0)
    );
  };

  // Calculate amount paid
  const calculateAmountPaid = (caseId) => {
    const expenses = expenseData[caseId];
    if (!expenses || !expenses.payments) return 0;
    
    return expenses.payments.reduce((total, payment) => total + parseInt(payment.amount || 0), 0);
  };

  // Calculate balance due
  const calculateBalanceDue = (caseId) => {
    const totalExpenses = calculateTotalExpenses(caseId);
    const amountPaid = calculateAmountPaid(caseId);
    return totalExpenses - amountPaid;
  };

  // Open expense calculator for a case
  const openExpenseCalculator = (caseItem) => {
    setSelectedCaseForExpense(caseItem);
    
    // Load existing expense data for this case
    const existingExpenses = expenseData[caseItem._id] || {
      lawyerFees: '0',
      courtFees: '0',
      travelExpenses: '0',
      documentFees: '0',
      miscellaneous: '0',
      estimatedDuration: '6',
      payments: []
    };
    
    setExpenseForm({
      lawyerFees: existingExpenses.lawyerFees || '0',
      courtFees: existingExpenses.courtFees || '0',
      travelExpenses: existingExpenses.travelExpenses || '0',
      documentFees: existingExpenses.documentFees || '0',
      miscellaneous: existingExpenses.miscellaneous || '0',
      estimatedDuration: existingExpenses.estimatedDuration || '6'
    });
    
    setShowExpenseCalculator(true);
  };

  // FIXED: Enhanced lawyer verification status check
  const checkLawyerVerificationStatus = async () => {
  try {
    if (user?.role !== 'lawyer') return;
    
    const token = localStorage.getItem('token');
    console.log('🔍 Checking lawyer verification status...');
    
    const response = await fetch(`${API_BASE_URL}/api/lawyer/verification-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🔍 Status API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('🔍 RAW API DATA:', data);
      
      // ✅ CRITICAL FIX: Set status EXACTLY as received
      setJoinTeamStatus(data.status);
      setVerificationDeadline(data.verificationDeadline);
      setPaymentDeadline(data.paymentDeadline);
      
      // ✅ Update localStorage to match API data
      localStorage.setItem('joinTeamStatus', data.status);
      
      console.log('✅ Updated joinTeamStatus to:', data.status);
      console.log('✅ Updated localStorage joinTeamStatus to:', data.status);
      
    } else {
      console.error('❌ Status API failed:', response.status);
      // Fallback to localStorage
      const savedStatus = localStorage.getItem('joinTeamStatus');
      if (savedStatus) {
        setJoinTeamStatus(savedStatus);
        console.log('🔄 Using localStorage status:', savedStatus);
      }
    }
  } catch (error) {
    console.error('❌ Error checking verification status:', error);
    // Fallback to localStorage on error
    const savedStatus = localStorage.getItem('joinTeamStatus');
    if (savedStatus) {
      setJoinTeamStatus(savedStatus);
      console.log('🔄 Using localStorage status after error:', savedStatus);
    }
  }
};


  // Request verification
  // FIXED: Enhanced verification request with proper error handling
const requestVerification = async () => {
  try {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    console.log('📨 Sending verification request to admin...');
    
    const response = await fetch(`${API_BASE_URL}/api/lawyer/request-verification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // body: JSON.stringify({
      //   userId: user?._id,
      //   userName: user?.name,
      //   userEmail: user?.email,
      //   timestamp: new Date().toISOString()
      // })
    });

    console.log('📡 Verification request response status:', response.status);
    
    const data = await response.json();
    console.log('📨 Verification request response:', data);

    if (response.ok) {
      setJoinTeamStatus('pending');
      localStorage.setItem('joinTeamStatus', 'pending');
      setShowJoinTeamPopup(false);
      
      // Show success message
      alert('✅ Verification request submitted successfully! Admin will review your profile within 2-3 business days.');
      
      // Refresh verification status
      await checkLawyerVerificationStatus();
    } else {
      console.error('❌ Verification request failed:', data.error);
      alert('❌ ' + (data.error || 'Failed to submit verification request. Please try again.'));
    }
  } catch (error) {
    console.error('💥 Error requesting verification:', error);
    
    // Check if it's a network error
    if (error.message.includes('Failed to fetch')) {
      alert('❌ Network error: Cannot connect to server. Please check if the backend is running on localhost:5000');
    } else {
      alert('❌ Network error. Please check your connection and try again.');
    }
  } finally {
    setIsLoading(false);
  }
};


// Open document vault for a case
const openDocumentVault = (caseItem) => {
  console.log('📁 Opening document vault for case:', caseItem.caseName);
  setSelectedCaseForVault(caseItem);
  setShowDocumentVault(true);
  
  // Initialize documents structure if it doesn't exist
  const updatedDocuments = { ...documents };
  if (!updatedDocuments[caseItem._id]) {
    updatedDocuments[caseItem._id] = {
      general: [],
      court_documents: [],
      evidence: [],
      contracts: []
    };
    setDocuments(updatedDocuments);
    localStorage.setItem('caseDocuments', JSON.stringify(updatedDocuments));
  }
};







  // FIXED: Enhanced team payment verification
  const verifyTeamPayment = async (paymentData) => {
  try {
    const token = localStorage.getItem('token');
    console.log('🔍 Verifying team payment...', paymentData);
    
    const response = await fetch(`${API_BASE_URL}/api/payment/verify-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...paymentData,
        payment_type: paymentData.isUpgrade ? 'team_upgrade' : 'team_join'
      })
    });

    const data = await response.json();
    console.log('💰 Team payment verification response:', data);

    if (data.success) {
      // ✅ Update local state immediately
      setJoinTeamStatus('paid');
      
      // ✅ Only set hasPaid to true if it's a direct join OR if upgrading from personal
      // For upgrade, user already has personal access (hasPaid is already true)
      // For direct join, this is their first payment
      if (!paymentData.isUpgrade) {
        setHasPaid(true);
        localStorage.setItem('userHasPaid', 'true');
      }
      
      // ✅ Update team status
      localStorage.setItem('joinTeamStatus', 'paid');
      
      console.log('✅ Team payment verified and status updated');
      console.log('📊 Updated status - hasPaid:', hasPaid, 'joinTeamStatus: paid');
      return data;
    } else {
      console.error('❌ Team payment verification failed:', data.error);
      return data;
    }
  } catch (error) {
    console.error('💥 Error verifying team payment:', error);
    return { success: false, error: 'Payment verification failed' };
  }
};

  // FIXED: Enhanced team payment initiation
  const initiateTeamPayment = async () => {
  try {
    setTeamPaymentLoading(true);
    
    // ✅ CHECK: If user already paid for personal space
    const hasPersonalAccess = hasPaid;
   let paymentAmount, plan;
    
    if (hasPersonalAccess) {
      // Upgrade: Charge only the difference
      paymentAmount = PRICING.LAWYER.TEAM_UPGRADE.price; // ₹700
      plan = PRICING.LAWYER.TEAM_UPGRADE;
    } else {
      // Direct team join: Full amount
      paymentAmount = PRICING.LAWYER.TEAM.price; // ₹2499
      plan = PRICING.LAWYER.TEAM;
    }
    
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    // Create Razorpay order for team join (or upgrade)
    const orderResponse = await createRazorpayOrder(paymentAmount);
    
    if (!orderResponse.success) {
      console.error('❌ Team order creation failed:', orderResponse.error);
      alert(`Failed to create payment order: ${orderResponse.error}. Please try again.`);
      return;
    }

    const razorpayKey = 'rzp_test_RTOZnKCegnEMZB';
    
    const options = {
      key: razorpayKey,
      amount: orderResponse.order.amount,
      currency: orderResponse.order.currency || 'INR',
      name: hasPersonalAccess ? 'LegalMitra Team Upgrade' : 'LegalMitra Team Join',
      description: plan.description,
      order_id: orderResponse.order.id,
      handler: async function (response) {
        console.log('🎯 Team payment handler called:', response);
        
        const verificationResponse = await verifyTeamPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          amount: paymentAmount,
          isUpgrade: hasPersonalAccess // Tell backend this is an upgrade
        });

        if (verificationResponse.success) {
          await checkLawyerVerificationStatus();
          setShowTeamPayment(false);
          alert('🎉 Welcome to LegalMitra Team! You now have full team access.');
          await fetchLawyerCases();
        } else {
          alert('Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      notes: {
        payment_type: hasPersonalAccess ? 'team_upgrade' : 'team_join',
        user_id: user?._id,
        user_role: 'lawyer',
        is_upgrade: hasPersonalAccess
      },
      theme: {
        color: '#4CAF50'
      }
    };

    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.failed', function (response) {
      console.error('❌ Team payment failed:', response.error);
      alert(`Payment failed: ${response.error.description}`);
      setTeamPaymentLoading(false);
    });

    rzp.open();
    
  } catch (error) {
    console.error('💥 Error in initiateTeamPayment:', error);
    alert('Error initiating payment. Please try again.');
  } finally {
    setTeamPaymentLoading(false);
  }
};

  // Save expense data
  const saveExpenseData = () => {
    if (!selectedCaseForExpense) return;
    
    const updatedExpenseData = {
      ...expenseData,
      [selectedCaseForExpense._id]: {
        ...expenseForm,
        payments: expenseData[selectedCaseForExpense._id]?.payments || []
      }
    };
    
    setExpenseData(updatedExpenseData);
    localStorage.setItem('legalExpenses', JSON.stringify(updatedExpenseData));
    setShowExpenseCalculator(false);
    alert('✅ Expense data saved successfully!');
  };

  // Add payment record
  const addPayment = (caseId, amount, date, description) => {
    const updatedExpenseData = { ...expenseData };
    
    if (!updatedExpenseData[caseId]) {
      updatedExpenseData[caseId] = {
        lawyerFees: '0',
        courtFees: '0',
        travelExpenses: '0',
        documentFees: '0',
        miscellaneous: '0',
        estimatedDuration: '6',
        payments: []
      };
    }
    
    updatedExpenseData[caseId].payments = [
      ...(updatedExpenseData[caseId].payments || []),
      {
        amount: amount.toString(),
        date: date || new Date().toISOString().split('T')[0],
        description: description || 'Payment',
        id: Date.now().toString()
      }
    ];
    
    setExpenseData(updatedExpenseData);
    localStorage.setItem('legalExpenses', JSON.stringify(updatedExpenseData));
  };

  // After successful payment callback
  const updatePaymentStatus = async () => {
    try {
      const response = await testAPI('/api/lawyer/update-payment-status', 'POST');
      if (response.success) {
        // Update localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        user.hasPaid = true;
        localStorage.setItem('user', JSON.stringify(user));
        alert('✅ Successfully connected with LegalMitra!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Payment status update failed:', error);
    }
  };

  // Legal Expense Calculator Modal
  const renderExpenseCalculator = () => {
    if (!selectedCaseForExpense) return null;
    
    const caseExpenses = expenseData[selectedCaseForExpense._id] || {};
    const totalExpenses = calculateTotalExpenses(selectedCaseForExpense._id);
    const amountPaid = calculateAmountPaid(selectedCaseForExpense._id);
    const balanceDue = calculateBalanceDue(selectedCaseForExpense._id);

    return (
      <div className="expense-calculator-overlay">
        <div className="expense-calculator-modal">
          <div className="expense-calculator-header">
            <h3>Legal Expense Calculator - {selectedCaseForExpense.caseName}</h3>
            <button 
              className="close-btn"
              onClick={() => setShowExpenseCalculator(false)}
            >
              ✕
            </button>
          </div>

          <div className="expense-calculator-content">
            {/* Expense Summary */}
            <div className="expense-summary-card">
              <h4>💰 Expense Summary</h4>
              <div className="expense-summary-grid">
                <div className="expense-summary-item">
                  <span className="expense-label">Total Estimated Cost:</span>
                  <span className="expense-amount">₹{totalExpenses.toLocaleString()}</span>
                </div>
                <div className="expense-summary-item">
                  <span className="expense-label">Amount Paid:</span>
                  <span className="expense-amount paid">₹{amountPaid.toLocaleString()}</span>
                </div>
                <div className="expense-summary-item">
                  <span className="expense-label">Balance Due:</span>
                  <span className={`expense-amount ${balanceDue > 0 ? 'due' : 'paid'}`}>
                    ₹{balanceDue.toLocaleString()}
                  </span>
                </div>
                <div className="expense-summary-item">
                  <span className="expense-label">Estimated Duration:</span>
                  <span className="expense-duration">{caseExpenses.estimatedDuration || '6'} months</span>
                </div>
              </div>
            </div>

            {/* Expense Breakdown Form */}
            <div className="expense-form-section">
              <h4>📊 Update Expense Breakdown</h4>
              <div className="expense-form-grid">
                <div className="expense-form-group">
                  <label>Lawyer Fees (₹)</label>
                  <input
                    type="number"
                    value={expenseForm.lawyerFees}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, lawyerFees: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="expense-form-group">
                  <label>Court Fees (₹)</label>
                  <input
                    type="number"
                    value={expenseForm.courtFees}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, courtFees: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="expense-form-group">
                  <label>Travel Expenses (₹)</label>
                  <input
                    type="number"
                    value={expenseForm.travelExpenses}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, travelExpenses: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="expense-form-group">
                  <label>Document Fees (₹)</label>
                  <input
                    type="number"
                    value={expenseForm.documentFees}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, documentFees: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="expense-form-group">
                  <label>Miscellaneous (₹)</label>
                  <input
                    type="number"
                    value={expenseForm.miscellaneous}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, miscellaneous: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="expense-form-group">
                  <label>Estimated Duration (months)</label>
                  <select
                    value={expenseForm.estimatedDuration}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                  >
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">1 year</option>
                    <option value="24">2 years</option>
                    <option value="36">3+ years</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="payment-history-section">
              <h4>💳 Payment History</h4>
              <div className="payment-history">
                {caseExpenses.payments && caseExpenses.payments.length > 0 ? (
                  <div className="payment-list">
                    {caseExpenses.payments.map((payment, index) => (
                      <div key={payment.id || index} className="payment-item">
                        <span className="payment-amount">₹{parseInt(payment.amount).toLocaleString()}</span>
                        <span className="payment-date">{payment.date}</span>
                        <span className="payment-desc">{payment.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-payments">No payments recorded yet</p>
                )}
                
                {/* Add Payment Form */}
                <div className="add-payment-form">
                  <h5>Add New Payment</h5>
                  <div className="payment-form-grid">
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      className="payment-amount-input"
                      id={`payment-amount-${selectedCaseForExpense._id}`}
                    />
                    <input
                      type="date"
                      className="payment-date-input"
                      id={`payment-date-${selectedCaseForExpense._id}`}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      className="payment-desc-input"
                      id={`payment-desc-${selectedCaseForExpense._id}`}
                    />
                    <button
                      className="add-payment-btn"
                      onClick={() => {
                        const amountInput = document.getElementById(`payment-amount-${selectedCaseForExpense._id}`);
                        const dateInput = document.getElementById(`payment-date-${selectedCaseForExpense._id}`);
                        const descInput = document.getElementById(`payment-desc-${selectedCaseForExpense._id}`);
                        
                        if (amountInput.value) {
                          addPayment(
                            selectedCaseForExpense._id,
                            amountInput.value,
                            dateInput.value,
                            descInput.value
                          );
                          
                          amountInput.value = '';
                          dateInput.value = '';
                          descInput.value = '';
                          alert('✅ Payment recorded successfully!');
                        }
                      }}
                    >
                      Add Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="expense-actions">
              <button className="save-expenses-btn" onClick={saveExpenseData}>
                💾 Save Expenses
              </button>
              <button 
                className="close-expenses-btn"
                onClick={() => setShowExpenseCalculator(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };



  const openDocumentVaultForLawyer = (caseItem) => {
  setSelectedCaseForVault(caseItem);
  setShowDocumentVault(true);
  
  // Initialize with lawyer-specific folders
  const updatedDocuments = { ...documents };
  if (!updatedDocuments[caseItem._id]) {
    updatedDocuments[caseItem._id] = {
      general: [],
      court_documents: [],
      evidence: [],
      contracts: []
        
    };
    setDocuments(updatedDocuments);
    localStorage.setItem('caseDocuments', JSON.stringify(updatedDocuments));
  }
};

  // Check payment status for lawyers - FIXED VERSION
  // useEffect(() => {
  //   const initializeData = async () => {
  //     if (user) {
  //       console.log('🔄 Initializing data for user:', user.role);
        
  //       if (user.role === 'lawyer') {
  //         await checkPaymentStatus();
  //         await fetchLawyerCases();
  //       } else if (user.role === 'client') {
  //         await checkClientPaymentStatus();
  //         await fetchClientCases();
  //         setCheckingPayment(false);
  //       }
  //     }
  //   };

  //   initializeData();
  // }, [user]);

  // Add this useEffect after your existing useEffects
  useEffect(() => {
    const handleAutoPaymentRedirect = async () => {
      // Check if we have the autoPayment parameter
      const urlParams = new URLSearchParams(window.location.search);
      const autoPayment = urlParams.get('autoPayment');
      
      if (autoPayment === 'true' && user && !checkingPayment) {
        console.log('🔄 Processing auto-payment redirect for user:', user.role);
        
        // For lawyers
        if (user.role === 'lawyer' && !hasPaid) {
          console.log('💰 Showing payment modal for lawyer');
          setShowPayment(true);
          // Clean up URL
          window.history.replaceState({}, '', '/my-collection');
        }
        // For clients
        else if (user.role === 'client' && !hasPaidClient) {
          console.log('💰 Showing client payment modal');
          setShowClientPayment(true);
          window.history.replaceState({}, '', '/my-collection');
        }
      }
    };

    // Only run when we have user data and payment status is checked
    if (user && !checkingPayment) {
      handleAutoPaymentRedirect();
    }
  }, [user, hasPaid, hasPaidClient, checkingPayment]);

  const checkClientPaymentStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found');
      return;
    }

    console.log('🔍 Checking client payment status from server...');
    const response = await fetch(`${API_BASE_URL}/api/payment/client-payment-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Client payment status response status:', response.status);
    
    const data = await response.json();
    console.log('💰 Client payment status data:', data);
    
    if (response.ok) {
      // ✅ FIX: Only update if value actually changed
      if (data.hasPaid !== hasPaidClient) {
        setHasPaidClient(data.hasPaid);
        localStorage.setItem('userHasPaidClient', data.hasPaid.toString());
      }
      console.log('✅ Client payment status updated to:', data.hasPaid);
    } else {
      console.error('❌ Failed to check client payment status:', data.error);
      // Don't set false on error to avoid conflicts
    }
  } catch (error) {
    console.error('💥 Error checking client payment status:', error);
    // Don't automatically set to false on error
  }
};


// Fetch client requests for lawyers - UPDATED with proper data mapping
// Update fetchClientRequests to get requests with all statuses
const fetchClientRequests = async () => {
  try {
    if (user?.role !== 'lawyer' || joinTeamStatus !== 'paid') return;
    
    const token = localStorage.getItem('token');
    console.log('🔍 Fetching all client requests for lawyer...');
    
    const response = await fetch(`${API_BASE_URL}/api/requests/lawyer-requests`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Client requests response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📨 All client requests data:', data);
      
      // Transform the data to include all statuses
      const transformedRequests = data.requests.map(request => ({
        _id: request._id,
        clientId: {
          _id: request.clientId?._id,
          name: request.clientId?.name || 'Unknown Client',
          email: request.clientId?.email || 'No email',
          phone: request.clientId?.phone || 'Not provided',
          address: request.clientId?.address || 'Not provided'
        },
        lawyerId: {
          _id: request.lawyerId?._id,
          name: request.lawyerId?.name || 'Unknown Lawyer',
          email: request.lawyerId?.email,
          specialization: request.lawyerId?.specialization
        },
        caseType: request.caseType || 'General Case',
        caseSummary: request.caseSummary || request.description || 'No summary provided',
        status: request.status || 'pending',
        priority: request.priority || 'medium',
        urgency: request.urgency || 'standard',
        budgetRange: request.budgetRange,
        preferredLanguage: request.preferredLanguage,
        caseComplexity: request.caseComplexity,
        additionalNotes: request.additionalNotes,
        contactInfo: {
          phone: request.clientId?.phone || request.contactPhone,
          email: request.clientId?.email
        },
        documents: request.documents || [],
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        lawyerResponse: request.lawyerResponse,
        responseDate: request.responseDate
      }));
      
      console.log('🔄 Transformed all requests:', transformedRequests);
      setClientRequests(transformedRequests);
    } else {
      console.error('❌ Failed to fetch client requests');
      const errorData = await response.json();
      console.error('Error details:', errorData);
    }
  } catch (error) {
    console.error('💥 Error fetching client requests:', error);
  }
};

// Accept a client request - UPDATED with proper API call
const acceptClientRequest = async (requestId) => {
  try {
    const token = localStorage.getItem('token');
    console.log('✅ Accepting request:', requestId);
    
    const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/respond`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'accepted',
        lawyerResponse: `I accept your case request. I will contact you shortly to discuss the details.`
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Request accepted successfully:', data);
      
      // Update local state
      setClientRequests(prev => prev.map(req => 
        req._id === requestId ? { ...req, status: 'accepted', lawyerResponse: data.request.lawyerResponse } : req
      ));
      setShowRequestDetails(false);
      
      alert('✅ Request accepted successfully! The client has been notified.');
      
      // Refresh requests
      await fetchClientRequests();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to accept request');
    }
  } catch (error) {
    console.error('Error accepting request:', error);
    alert(`❌ Failed to accept request: ${error.message}`);
  }
};

// Decline a client request - UPDATED with proper API call
const declineClientRequest = async (requestId, reason = '') => {
  try {
    const token = localStorage.getItem('token');
    console.log('❌ Declining request:', requestId);
    
    const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/respond`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'declined',
        lawyerResponse: reason || 'Unfortunately, I cannot take this case at the moment due to workload constraints.'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('❌ Request declined successfully:', data);
      
      // Update local state
      setClientRequests(prev => prev.map(req => 
        req._id === requestId ? { ...req, status: 'declined', lawyerResponse: data.request.lawyerResponse } : req
      ));
      setShowRequestDetails(false);
      
      alert('✅ Request declined successfully. The client has been notified.');
      
      // Refresh requests
      await fetchClientRequests();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to decline request');
    }
  } catch (error) {
    console.error('Error declining request:', error);
    alert(`❌ Failed to decline request: ${error.message}`);
  }
};

// View request details
const viewRequestDetails = (request) => {
  setSelectedRequest(request);
  setShowRequestDetails(true);
};

// Add to your existing useEffects
// Update your useEffect for client requests
useEffect(() => {
  if (user?.role === 'lawyer' && joinTeamStatus === 'paid') {
    console.log('🔄 Fetching client requests for team member lawyer...');
    fetchClientRequests();
    
    // Poll for new requests every 30 seconds
    const interval = setInterval(fetchClientRequests, 30000);
    return () => clearInterval(interval);
  }
}, [user?.role, joinTeamStatus]);

  const checkPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found');
        setCheckingPayment(false);
        return;
      }

      console.log('🔍 Checking payment status from server...');
      const response = await fetch(`${API_BASE_URL}/api/payment/payment-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Payment status response status:', response.status);
      
      const data = await response.json();
      console.log('💰 Payment status data:', data);
      
      if (response.ok) {
        // ✅ SYNC localStorage with server state
        setHasPaid(data.hasPaid);
        localStorage.setItem('userHasPaid', data.hasPaid.toString());
        console.log('✅ Payment status updated to:', data.hasPaid, '(localStorage synced)');
      } else {
        console.error('❌ Failed to check payment status:', data.error);
        setHasPaid(false);
        localStorage.setItem('userHasPaid', 'false');
      }
    } catch (error) {
      console.error('💥 Error checking payment status:', error);
      setHasPaid(false);
      localStorage.setItem('userHasPaid', 'false');
    } finally {
      setCheckingPayment(false);
    }
  };

  const fetchLawyerCases = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 Fetching lawyer cases...');
      const response = await fetch(`${API_BASE_URL}/api/cases/my-cases`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📦 Lawyer cases response:', data);

      if (response.ok) {
        setLawyerCases(data.cases || []);
        console.log('✅ Lawyer cases loaded:', data.cases?.length || 0);
      } else {
        console.error('❌ Failed to fetch cases:', data.error);
        setLawyerCases([]);
      }
    } catch (error) {
      console.error('💥 Error fetching cases:', error);
      setLawyerCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Call client directly
  const callClient = (caseItem) => {
    const phoneNumber = caseItem.clientPhone;
    
    if (!phoneNumber) {
      alert('❌ No phone number available for this client');
      return;
    }

    // Format phone number
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    
    // Create call log
    const callLog = {
      caseId: caseItem._id,
      clientName: caseItem.clientName,
      phoneNumber: formattedNumber,
      timestamp: new Date().toISOString(),
      type: 'outgoing'
    };

    // Save call log
    saveCallLog(callLog);
    
    // Open phone app
    window.open(`tel:${formattedNumber}`, '_self');
  };

  // Open call options modal
  const openCallOptions = (caseItem) => {
    setSelectedCaseForCall(caseItem);
    setShowCallModal(true);
  };

  const initiateClientPayment = async (caseData) => {
  try {
    setClientPaymentLoading(true);
    
    // Define the plan here - client access for ₹1799
    const plan = PRICING.CLIENT.BASIC;
    
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    const orderResponse = await createRazorpayOrder(plan.price);
    
    if (!orderResponse.success) {
      console.error('❌ Client order creation failed:', orderResponse.error);
      alert(`Failed to create payment order: ${orderResponse.error}. Please try again.`);
      return;
    }

    const razorpayKey = 'rzp_test_RTOZnKCegnEMZB';
    
    const options = {
      key: razorpayKey,
      amount: orderResponse.order.amount,
      currency: orderResponse.order.currency || 'INR',
      name: 'LegalMitra Client Services',
      description: plan.description,
      order_id: orderResponse.order.id,
      handler: async function (response) {
        console.log('🎯 Client payment handler called:', response);
        
        const verificationResponse = await verifyClientPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          amount: plan.price // Send amount to backend
        });

        if (verificationResponse.success) {
          await submitClientCaseAfterPayment(clientCaseDataBeforePayment, verificationResponse.paymentId, response.razorpay_order_id);
        } else {
          alert('Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      notes: {
        case_name: caseData.caseName,
        user_id: user?._id,
        user_role: 'client'
      },
      theme: {
        color: '#4CAF50'
      }
    };

    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.failed', function (response) {
      console.error('❌ Client payment failed:', response.error);
      alert(`Payment failed: ${response.error.description}`);
      setClientPaymentLoading(false);
    });

    rzp.open();
    
  } catch (error) {
    console.error('💥 Error in initiateClientPayment:', error);
    alert('Error initiating payment. Please try again.');
  } finally {
    setClientPaymentLoading(false);
  }
};

  const verifyClientPayment = async (paymentData) => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Verifying client payment...');
      
      const response = await fetch(`${API_BASE_URL}/api/payment/verify-client-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      console.log('💰 Client payment verification response:', data);

      if (data.success) {
        localStorage.setItem('userHasPaid', 'true');
        setHasPaidClient(true);
        localStorage.setItem('userHasPaidClient', 'true');
        console.log('✅ Client payment verified - localStorage updated');
        await checkClientPaymentStatus();
        return data;
      } else {
        return data;
      }
    } catch (error) {
      console.error('💥 Error verifying client payment:', error);
      return { success: false, error: 'Payment verification failed' };
    }
  };


 const renderClientRequestsSection = () => {
  if (user?.role !== 'lawyer' || joinTeamStatus !== 'paid') return null;

  const filteredRequests = clientRequests.filter(request => {
    if (requestsFilter === 'all') return true;
    return request.status === requestsFilter;
  });

  const stats = {
    total: clientRequests.length,
    pending: clientRequests.filter(req => req.status === 'pending').length,
    accepted: clientRequests.filter(req => req.status === 'accepted').length,
    declined: clientRequests.filter(req => req.status === 'declined').length
  };

  
  return (
    <div className="requests-section enhanced-requests">
      <div className="section-header">
        <h2>📨 Client Case Requests</h2>
        <div className="requests-stats">
          <span className="stat total">
            Total: {stats.total}
          </span>
          <span className="stat pending">
            Pending: {stats.pending}
          </span>
          <span className="stat accepted">
            Accepted: {stats.accepted}
          </span>
          <span className="stat declined">
            Declined: {stats.declined}
          </span>
        </div>
      </div>

     

      {/* Requests List */}
      <div className="requests-container">
        {filteredRequests.length > 0 ? (
          <div className="requests-grid">
            {filteredRequests.map(request => (
              <div key={request._id} className={`request-card enhanced ${request.status}`}>
                <div className="request-header">
                  <div className="client-info">
                    <div className="client-avatar">
                      {request.clientId?.name?.charAt(0) || 'C'}
                    </div>
                    <div className="client-details">
                      <h4>From: {request.clientId?.name || 'Client'}</h4>
                      <p className="client-contact">
                        📧 {request.clientId?.email || 'No email'} 
                        
                      </p>
                    </div>
                  </div>
                  <span className={`status-badge enhanced ${request.status}`}>
                    {request.status === 'pending' && '⏳ Pending'}
                    {request.status === 'accepted' && '✅  Accepted'}
                    {request.status === 'declined' && '❌ Declined'}
                  </span>
                </div>
                
                <div className="request-body">
                  <div className="case-info">
                    <div className="info-item">
                      <span className="info-label">Case Type:</span>
                      <span className="info-value">{request.caseType}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Priority:</span>
                      <span className="info-value priority">{request.priority || 'Normal'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Submitted:</span>
                      <span className="info-value">
                        {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Budget Range:</span>
                      <span className="info-value">{request.budgetRange || 'Not specified'}</span>
                    </div>
                  </div>
                  
                  <div className="case-summary">
                    <strong>Case Summary:</strong>
                    <p>{request.caseSummary}</p>
                  </div>
                  
                  {request.additionalNotes && (
                    <div className="additional-notes">
                      <strong>Additional Notes:</strong>
                      <p>{request.additionalNotes}</p>
                    </div>
                  )}
                  
                  {request.lawyerResponse && (
                    <div className={`lawyer-response ${request.status}`}>
                      <strong>Your Response:</strong>
                      <p>{request.lawyerResponse}</p>
                      {request.responseDate && (
                        <small>Responded on: {new Date(request.responseDate).toLocaleString()}</small>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="request-actions">
                  {/* View Client Details Button - Always visible */}
                  <button 
                    className="action-btn view-client-btn"
                    onClick={() => viewClientDetails(request)}
                    title="View complete client information"
                  >
                    👤 View Client Details
                  </button>

                  {/* Decision Buttons for Pending Requests */}
                  {request.status === 'pending' && (
                    <div className="decision-buttons">
                      <button 
                        className="action-btn accept-btn"
                        onClick={() => handleAcceptRequest(request)}
                      >
                        ✅ Accept Case
                      </button>
                      <button 
                        className="action-btn decline-btn"
                        onClick={() => {
                          const reason = prompt('Please provide a reason for declining:');
                          if (reason !== null) {
                            handleDeclineRequest(request, reason);
                          }
                        }}
                      >
                        ❌ Decline
                      </button>
                    </div>
                  )}
                  
                  {/* Contact Button for Accepted Requests */}
                  {request.status === 'accepted' && (
                    <button 
                      className="action-btn contact-btn"
                      onClick={() => {
                        if (request.clientId?.phone) {
                          window.open(`tel:${request.clientId.phone}`, '_self');
                        } else if (request.clientId?.email) {
                          window.open(`mailto:${request.clientId.email}`, '_self');
                        } else {
                          alert('No contact information available for this client.');
                        }
                      }}
                    >
                      📞 Contact Client
                    </button>
                  )}

                  {/* Status Message for Declined Requests */}
                  {request.status === 'declined' && (
                    <button className="action-btn declined" disabled>
                      ❌ Request Declined
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-requests-state">
            <div className="empty-icon">📨</div>
            <h3>
              {requestsFilter === 'all' 
                ? "No Client Requests"
                : `No ${requestsFilter} requests`
              }
            </h3>
            <p>
              {requestsFilter === 'all' 
                ? "You haven't received any case requests from clients yet."
                : `No ${requestsFilter} requests found.`
              }
            </p>
            <div className="empty-actions">
              <button className="secondary-btn" onClick={fetchClientRequests}>
                🔄 Refresh Requests
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
  const submitClientCaseAfterPayment = async (caseData, paymentId, razorpayOrderId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const caseSubmissionData = {
        caseData: {
          caseName: caseData.caseName,
          caseType: caseData.caseType,
          caseNumber: caseData.caseNumber,
          courtName: caseData.courtName,
          filingDate: caseData.filingDate,
          nextHearing: caseData.nextHearing,
          caseDescription: caseData.caseDescription,
          lawyerName: caseData.lawyerName,
          lawyerEmail: caseData.lawyerEmail,
          lawyerPhone: caseData.lawyerPhone,
          status: caseData.status
        },
        paymentId: paymentId,
        razorpayOrderId: razorpayOrderId
      };

      const response = await fetch(`${API_BASE_URL}/api/cases/client/create-after-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(caseSubmissionData)
      });

      const data = await response.json();

      if (response.ok) {
        setClientCases(prev => [data.case, ...prev]);
        setNewClientCase({
          caseName: '', caseType: '', caseNumber: '', courtName: '',
          filingDate: '', nextHearing: '', caseDescription: '',
          lawyerName: '', lawyerEmail: '', lawyerPhone: '', status: 'ongoing'
        });
        setShowClientCaseForm(false);
        setShowClientPayment(false);
        setClientCaseDataBeforePayment(null);
        alert('✅ Case created successfully! Payment verified.');
      } else {
        alert('Failed to create case after payment: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error creating case after payment.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send SMS to client
  const sendSMS = (caseItem) => {
    const phoneNumber = caseItem.clientPhone;
    
    if (!phoneNumber) {
      alert('❌ No phone number available for this client');
      return;
    }

    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const message = `Hello ${caseItem.clientName}, this is ${user?.name} from LegalMitra regarding your case: ${caseItem.caseName}.`;
    
    // Create call log for SMS
    const callLog = {
      caseId: caseItem._id,
      clientName: caseItem.clientName,
      phoneNumber: formattedNumber,
      timestamp: new Date().toISOString(),
      type: 'sms'
    };

    // Save call log
    saveCallLog(callLog);
    
    // Open SMS app
    window.open(`sms:${formattedNumber}?body=${encodeURIComponent(message)}`, '_self');
  };

  // Save call log to localStorage
  const saveCallLog = (callLog) => {
    const existingLogs = JSON.parse(localStorage.getItem('callLogs') || '{}');
    const caseLogs = existingLogs[callLog.caseId] || [];
    
    const updatedLogs = {
      ...existingLogs,
      [callLog.caseId]: [...caseLogs, callLog]
    };
    
    localStorage.setItem('callLogs', JSON.stringify(updatedLogs));
    setCallLogs(updatedLogs);
  };

  // Get call logs for a case
  const getCallLogs = (caseId) => {
    const allLogs = JSON.parse(localStorage.getItem('callLogs') || '{}');
    return allLogs[caseId] || [];
  };

  const fetchClientCases = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 Fetching client cases...');
      const response = await fetch(`${API_BASE_URL}/api/cases/my-cases`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📦 Client cases response:', data);

      if (response.ok) {
        setClientCases(data.cases || []);
        console.log('✅ Client cases loaded:', data.cases?.length || 0);
      } else {
        console.error('❌ Failed to fetch cases:', data.error);
        setClientCases([]);
      }
    } catch (error) {
      console.error('💥 Error fetching cases:', error);
      setClientCases([]);
    } finally {
      setIsLoading(false);
    }
  };

// Delete document from Cloudinary and local state
const deleteDocument = async (caseId, folder, documentIndex) => {
  if (!window.confirm('Are you sure you want to delete this document?')) {
    return;
  }

  try {
    const documentToDelete = documents[caseId][folder][documentIndex];
    
    // For now, just remove from local state since we don't have backend deletion
    // In production, you'd call your backend to delete from Cloudinary
    const updatedDocuments = { ...documents };
    updatedDocuments[caseId][folder].splice(documentIndex, 1);
    setDocuments(updatedDocuments);
    localStorage.setItem('caseDocuments', JSON.stringify(updatedDocuments));
    
    alert('✅ Document deleted successfully!');
    
    // Optional: Backend deletion would go here
    /*
    const response = await fetch(``${API_BASE_URL}/api/documents/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        publicId: documentToDelete.publicId
      })
    });
    */
  } catch (error) {
    console.error('Error deleting document:', error);
    alert('❌ Failed to delete document. Please try again.');
  }
};

// Download document
// Actual download function - FIXED
const downloadDocument = async (doc) => {
  if (!doc || !doc.url) {
    console.error('❌ Invalid document or URL:', doc);
    alert('❌ Cannot download document: Invalid file');
    return;
  }

  try {
    // Show loading state
    const downloadBtn = event.target.closest('.download-btn');
    if (downloadBtn) {
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = '⏳';
    }

    console.log('📥 Starting download for:', doc.name);
    
    // Fetch the file
    const response = await fetch(doc.url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = doc.name || `document_${Date.now()}`;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(blobUrl);
    
    console.log('✅ Download completed:', doc.name);
    
    // Show success message
    alert(`✅ "${doc.name}" downloaded successfully!`);
    
  } catch (error) {
    console.error('❌ Download failed:', error);
    
    // Fallback: Force download with a different approach
    try {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      link.target = '_blank';
      
      // Add download attribute to force download
      link.setAttribute('download', doc.name);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('📥 Download started! Check your downloads folder.');
    } catch (fallbackError) {
      console.error('❌ Fallback download failed:', fallbackError);
      alert('❌ Download failed. Please right-click and "Save as" instead.');
    }
  } finally {
    // Reset button state
    const downloadBtn = document.querySelector('.download-btn[disabled]');
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '⬇️';
    }
  }
};

// // Get file icon based on file type
// const getFileIcon = (fileType, format) => {
//   if (fileType === 'image') return '🖼️';
//   if (format === 'pdf') return '📄';
//   if (['doc', 'docx'].includes(format)) return '📝';
//   if (['txt'].includes(format)) return '📋';
//   return '📎';
// };

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};




  // Payment Functions - UPDATED with better status handling
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const downloadProfileAsPNG = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const cardElement = document.getElementById('lawyerProfileCard');
      
      if (cardElement) {
        const canvas = await html2canvas(cardElement, {
          backgroundColor: '#0f172a',
          scale: 2,
          useCORS: true,
          allowTaint: true
        });
        
        const link = document.createElement('a');
        link.download = `${user?.name || 'lawyer'}-profile-card.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        alert('✅ Profile card downloaded as PNG!');
      }
    } catch (error) {
      console.error('Error downloading PNG:', error);
      alert('❌ Failed to download PNG. Please try again.');
    }
  };

  const downloadProfileAsPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const cardElement = document.getElementById('lawyerProfileCard');
      
      if (cardElement) {
        const canvas = await html2canvas(cardElement, {
          backgroundColor: '#0f172a',
          scale: 2,
          useCORS: true,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190;
        const pageHeight = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 10;

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save(`${user?.name || 'lawyer'}-profile-card.pdf`);
        alert('✅ Profile card downloaded as PDF!');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('❌ Failed to download PDF. Please try again.');
    }
  };
// Document Vault Modal
const renderDocumentVault = () => {
  if (!selectedCaseForVault) return null;

  const caseDocuments = documents[selectedCaseForVault._id] || {};
  const folderNames = {
    general: 'General Documents',
    court_documents: 'Court Documents',
    evidence: 'Evidence',
    
    contracts: 'Contracts',
                // For lawyers
  
  };

  return (
    <div className="document-vault-overlay">
      <div className="document-vault-modal">
        <div className="vault-header">
          <h3>📁 Document Vault - {selectedCaseForVault.caseName}</h3>
          <button 
            className="close-btn"
            onClick={() => setShowDocumentVault(false)}
          >
            ✕
          </button>
        </div>

        <div className="vault-content">
          {/* Folder Selection */}
          <div className="folder-selection">
            <h4>Select Folder:</h4>
            <div className="folder-buttons">
              {Object.entries(folderNames).map(([folderKey, folderName]) => (
                <button
                  key={folderKey}
                  className={`folder-btn ${selectedFolder === folderKey ? 'active' : ''}`}
                  onClick={() => setSelectedFolder(folderKey)}
                >
                  <span className="folder-icon">📂</span>
                  {folderName}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Section */}
          <div className="upload-section">
            <button
              className="upload-btn"
              onClick={() => handleFileUpload(selectedFolder)}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <span className="upload-icon"></span>
                  Upload to {folderNames[selectedFolder]}
                </>
              )}
            </button>
            <p className="upload-note">
              Supported formats: PDF, Images, Word documents, Text files (Max 5MB)
            </p>
          </div>

          {/* Documents List */}
          <div className="documents-section">
            <h4>Documents in {folderNames[selectedFolder]}</h4>
            <div className="documents-list">
              {caseDocuments[selectedFolder] && caseDocuments[selectedFolder].length > 0 ? (
                caseDocuments[selectedFolder].map((doc, index) => (
                  <div key={doc.id || index} className="document-item">
                    <div className="document-info">
                      
                      <div className="document-details">
                        <span className="document-name">{doc.name}</span>
                        <span className="document-meta">
                          {formatFileSize(doc.size)} • {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="document-actions">
                      <button
                        className="action-btn view-btn"
                        onClick={() => window.open(doc.url, '_blank')}
                        title="View Document"
                      >
                        View
                      </button>
                        <button
                          className="action-btn download-btn"
                          onClick={() => downloadDocument(doc)}
                          title="Download"
                        >
                          Download
                        </button>
                        
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteDocument(selectedCaseForVault._id, selectedFolder, index)}
                        title="Delete"
                      >
                      Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-documents">
                  <p>No documents in this folder yet.</p>
                  <p>Click "Upload" to add documents to {folderNames[selectedFolder]}.</p>
                </div>
              )}
            </div>
          </div>

          {/* Storage Summary */}
          <div className="storage-summary">
            <h4>Storage Information</h4>
            <div className="storage-stats">
              <div className="storage-stat">
                <span>Total Documents:</span>
                <span>
                  {Object.values(caseDocuments).reduce((total, folder) => total + (folder ? folder.length : 0), 0)}
                </span>
              </div>
              <div className="storage-stat">
                <span>Current Folder:</span>
                <span>
                  {caseDocuments[selectedFolder] ? caseDocuments[selectedFolder].length : 0} documents
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



  const renderCallModal = () => {
    if (!selectedCaseForCall) return null;

    return (
      <div className="call-modal-overlay">
        <div className="call-modal">
          <div className="call-modal-header">
            <h3>Contact Client</h3>
            <button 
              className="close-btn"
              onClick={() => setShowCallModal(false)}
            >
              ✕
            </button>
          </div>

          <div className="call-client-info">
            <div className="client-avatar">
              {selectedCaseForCall.clientName?.charAt(0) || 'C'}
            </div>
            <div className="client-details">
              <h4>{selectedCaseForCall.clientName}</h4>
              <p className="client-case">{selectedCaseForCall.caseName}</p>
              <p className="client-phone">
                📞 {selectedCaseForCall.clientPhone || 'No phone number'}
              </p>
            </div>
          </div>

          <div className="call-options">
            <button 
              className="call-option-btn call"
              onClick={() => {
                callClient(selectedCaseForCall);
                setShowCallModal(false);
              }}
              disabled={!selectedCaseForCall.clientPhone}
            >
              <span className="call-icon">📞</span>
              <span>Call Now</span>
            </button>

            <button 
              className="call-option-btn sms"
              onClick={() => {
                sendSMS(selectedCaseForCall);
                setShowCallModal(false);
              }}
              disabled={!selectedCaseForCall.clientPhone}
            >
              <span className="call-icon">💬</span>
              <span>Send SMS</span>
            </button>
          </div>

          {/* Call History */}
          <div className="call-history">
            <h4>Recent Communications</h4>
            {getCallLogs(selectedCaseForCall._id).length > 0 ? (
              <div className="call-log-list">
                {getCallLogs(selectedCaseForCall._id)
                  .slice(-3)
                  .reverse()
                  .map((log, index) => (
                  <div key={index} className="call-log-item">
                    <span className={`log-type ${log.type}`}>
                      {log.type === 'outgoing' ? '📞' : '💬'}
                    </span>
                    <span className="log-time">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="log-duration">{log.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-calls">No recent communications</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const copyProfileShareableLink = async () => {
    try {
      const profileText = `
👨‍⚖️ ${user?.name || 'Lawyer Name'}
📊 ${roleData.stats.total} Total Cases | ${roleData.stats.solved} Solved | ${Math.round((roleData.stats.solved / roleData.stats.total) * 100) || 0}% Success Rate
⚖️ Specialized in Criminal, Family & Corporate Law
📧 ${user?.email || 'Contact for details'}

Generated via LegalMitra Case Management System
      `.trim();

      await navigator.clipboard.writeText(profileText);
      alert('✅ Profile information copied to clipboard! Share this with your clients.');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      const textArea = document.createElement('textarea');
      textArea.value = `Lawyer: ${user?.name}\nCases: ${roleData.stats.total}\nSuccess Rate: ${Math.round((roleData.stats.solved / roleData.stats.total) * 100) || 0}%\nContact: ${user?.email}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('✅ Profile information copied to clipboard!');
    }
  };

  const renderProfileCardModal = () => {
  // Calculate real statistics from lawyer cases
  const totalCases = lawyerCases.length;
  const solvedCases = lawyerCases.filter(caseItem => caseItem.status === 'solved').length;
  const ongoingCases = lawyerCases.filter(caseItem => caseItem.status === 'ongoing').length;
  const successRate = totalCases > 0 ? Math.round((solvedCases / totalCases) * 100) : 0;

  // Get lawyer-specific data from user schema
  const specialization = user?.specialization || 'General Practice';
  const experience = user?.experience || 0;
  const barCouncilNumber = user?.barCouncilNumber || 'Not provided';
  const phone = user?.phone || 'Not provided';
  const address = user?.address || 'Not provided';

  return (
    <div className="profile-card-overlay">
      <div className="profile-card-modal">
        <div className="profile-card-header">
          <h3>Your Professional Profile Card</h3>
          <button 
            className="close-btn"
            onClick={() => setShowProfileCard(false)}
          >
            ✕
          </button>
        </div>
        
        <div className="profile-card-content">
          {/* Profile Card Preview */}
          <div className="lawyer-profile-card" id="lawyerProfileCard">
            <div className="profile-header">
              <div className="profile-avatars">
                <img 
                  src={user?.profilePicture || userAvatar} 
                  alt="Profile" 
                  className="profile-avatar-img"
                  onError={(e) => {
                    console.log('❌ Image failed to load, using default avatar');
                    e.target.src = defaultAvatar;
                  }}
                />
              </div>
              <div className="profile-info">
                <h2>{user?.name || 'Lawyer Name'}</h2>
                <p className="profile-title">
                  {specialization} • {experience}+ years experience
                </p>
                <div className="rating">
                  <span className="stars">⭐⭐⭐⭐⭐</span>
                  <span className="rating-text">4.8 (120 reviews)</span>
                </div>
                <div className="bar-council">
                  <span className="badge">Bar Council: {barCouncilNumber}</span>
                </div>
              </div>
            </div>

            <div className="profile-stats">
              <h4>📊 Case Statistics</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">{totalCases}</span>
                  <span className="stat-label">Total Cases</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{solvedCases}</span>
                  <span className="stat-label">Solved</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{ongoingCases}</span>
                  <span className="stat-label">Ongoing</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{successRate}%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>
            </div>

            <div className="specializations">
              <h4>⚖️ Specializations</h4>
              <div className="specialization-list">
                <div className="specialization-item">
                  <span>{specialization}</span>
                  <span className="stars">⭐⭐⭐⭐⭐</span>
                </div>
                <div className="specialization-item">
                  <span>Legal Consultation</span>
                  <span className="stars">⭐⭐⭐⭐⭐</span>
                </div>
                <div className="specialization-item">
                  <span>Case Management</span>
                  <span className="stars">⭐⭐⭐⭐☆</span>
                </div>
              </div>
            </div>

            <div className="experience-section">
              <h4>💼 Professional Experience</h4>
              <div className="experience-item">
                <span className="exp-icon">🎓</span>
                <span>{experience}+ years of legal practice</span>
              </div>
              <div className="experience-item">
                <span className="exp-icon">⚖️</span>
                <span>Bar Council Verified</span>
              </div>
              <div className="experience-item">
                <span className="exp-icon">📈</span>
                <span>{successRate}% case success rate</span>
              </div>
            </div>

            <div className="contact-info">
              <h4>📞 Contact Information</h4>
              <div className="contact-item" style={{backgroundColor:'rgba(100, 116, 139, 0.1)'}}>
                <span className="contact-icon">📧</span>
                <span>{user?.email || 'email@example.com'}</span>
              </div>
              <div className="contact-item" style={{backgroundColor:'rgba(100, 116, 139, 0.1)'}}>
                <span className="contact-icon">📱</span>
                <span>{phone}</span>
              </div>
              <div className="contact-item" style={{backgroundColor:'rgba(100, 116, 139, 0.1)'}}>
                <span className="contact-icon">🏢</span>
                <span>{address}</span>
              </div>
              <div className="contact-item" style={{backgroundColor:'rgba(100, 116, 139, 0.1)'}}>
                <span className="contact-icon">🔒</span>
                <span>Bar Council: {barCouncilNumber}</span>
              </div>
            </div>
          </div>

          {/* Download Options */}
          <div className="download-options">
            <button className="download-btn primary" onClick={downloadProfileAsPNG}>
              <span className="btn-icon">📥</span>
              Download as PNG
            </button>
            <button className="download-btn secondary" onClick={downloadProfileAsPDF}>
              <span className="btn-icon">📄</span>
              Download as PDF
            </button>
          </div>

          <div className="profile-card-note">
            <p>💡 <strong>Pro Tip:</strong> Share this card with potential clients to showcase your expertise and build trust!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
  const createRazorpayOrder = async (amount) => {
    try {
      const token = localStorage.getItem('token');
      console.log('💰 Creating Razorpay order for amount:', amount);
      
      const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          amount: amount,
          currency: 'INR'
        })
      });

      console.log('📦 Razorpay order response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        return { 
          success: false, 
          error: `Server error: ${response.status} - ${errorText}` 
        };
      }

      const data = await response.json();
      console.log('📦 Razorpay order response data:', data);
      
      if (data.order && data.order.id) {
        return { success: true, order: data.order };
      } else {
        console.error('❌ Invalid order data:', data);
        return { success: false, error: 'Invalid order data from server' };
      }
    } catch (error) {
      console.error('💥 Error creating Razorpay order:', error);
      return { 
        success: false, 
        error: `Network error: ${error.message}` 
      };
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      console.log('🔍 Frontend: Starting payment verification');
      console.log('📦 Payment data sent to backend:', paymentData);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found');
        return { success: false, error: 'Authentication required' };
      }

      // Test if backend is reachable
      console.log('🌐 Testing backend connectivity...');
      const testResponse = await fetch(`${API_BASE_URL}/api/payment/test`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Backend test response status:', testResponse.status);
      
      const testData = await testResponse.json();
      console.log('📡 Backend test response:', testData);

      // Proceed with actual verification
      console.log('🔄 Sending verification request...');
      const response = await fetch(`${API_BASE_URL}/api/payment/verify-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      console.log('📡 Verification response status:', response.status);
      
      const data = await response.json();
      console.log('💰 Payment verification response:', data);

      if (data.success) {
        localStorage.setItem('userHasPaid', 'true');
        setHasPaid(true);
        localStorage.setItem('userHasPaid', 'true');
        console.log('✅ Payment verified successfully');
        return data;
      } else {
        console.error('❌ Payment verification failed:', data.error);
        return data;
      }
    } catch (error) {
      console.error('💥 Error in verifyPayment:', error);
      console.error('💥 Error details:', error.message);
      
      return { 
        success: false, 
        error: 'Payment verification failed: ' + error.message 
      };
    }
  };

  // FIXED: Enhanced case submission with proper payment check
  const submitCaseDirectly = async (caseData) => {
  try {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    console.log('📤 Submitting case directly...');
    console.log('💰 Current payment status - hasPaid:', hasPaid, 'joinTeamStatus:', joinTeamStatus);
    
    // ✅ FIXED: Separate personal access from team membership
    const hasPersonalAccess = hasPaid; // Basic payment for personal use
    const hasTeamMembership = joinTeamStatus === 'paid'; // Full team membership
    
    // For personal case management, only require basic payment
    if (!hasPersonalAccess && !hasTeamMembership) {
      console.log('💰 Personal access required, showing payment screen');
      alert('One-time payment required to access case management features.');
      setCaseDataBeforePayment(caseData);
      setShowPayment(true);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/cases/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(caseData)
    });

    const data = await response.json();
    console.log('📄 Direct case submission response:', data);

    if (response.ok) {
      setLawyerCases(prev => [data.case, ...prev]);
      setNewCase({
        clientName: '', clientEmail: '', clientPhone: '', clientAddress: '',
        caseName: '', caseType: '', caseNumber: '', courtName: '',
        filingDate: '', nextHearing: '', caseValue: '',
        opponentName: '', opponentLawyer: '', description: '',
        priority: 'medium', status: 'ongoing'
      });
      setShowForm(false);
      alert('Case created successfully!');
    } else {
      if (response.status === 402) {
        console.log('💰 Payment required, showing payment screen');
        alert('Payment required. Please complete the one-time payment.');
        setCaseDataBeforePayment(caseData);
        setShowPayment(true);
        setHasPaid(false);
        localStorage.setItem('userHasPaid', 'false');
      } else {
        alert('Failed to create case: ' + (data.error || 'Unknown error'));
      }
    }
  } catch (error) {
    console.error('💥 Error creating case:', error);
    alert('Error creating case. Please check if server is running.');
  } finally {
    setIsLoading(false);
  }
};
  const initiatePayment = async (caseData) => {
  try {
    setPaymentLoading(true);
    
    // Define the plan here - personal access for ₹1799
    const plan = PRICING.LAWYER.PERSONAL;
    
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Razorpay SDK failed to load. Please check your internet connection.');
      return;
    }

    const orderResponse = await createRazorpayOrder(plan.price);
    
    if (!orderResponse.success) {
      console.error('❌ Order creation failed:', orderResponse.error);
      alert(`Failed to create payment order: ${orderResponse.error}. Please try again.`);
      return;
    }

    const razorpayKey = 'rzp_test_RTOZnKCegnEMZB';
    
    const options = {
      key: razorpayKey,
      amount: orderResponse.order.amount,
      currency: orderResponse.order.currency || 'INR',
      name: 'LegalMitra Case Management',
      description: plan.description,
      order_id: orderResponse.order.id,
      handler: async function (response) {
        console.log('🎯 Payment handler called:', response);
        
        const verificationResponse = await verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          amount: plan.price // Send amount to backend
        });

        if (verificationResponse.success) {
          await submitCaseAfterPayment(caseData, verificationResponse.paymentId, response.razorpay_order_id);
        } else {
          alert('Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      notes: {
        case_name: caseData.caseName,
        user_id: user?._id
      },
      theme: {
        color: '#3399cc'
      }
    };

    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.failed', function (response) {
      console.error('❌ Payment failed:', response.error);
      alert(`Payment failed: ${response.error.description}`);
      setPaymentLoading(false);
    });

    rzp.open();
    
  } catch (error) {
    console.error('💥 Error in initiatePayment:', error);
    alert('Error initiating payment. Please try again.');
  } finally {
    setPaymentLoading(false);
  }
};

  const submitCaseAfterPayment = async (caseData, paymentId, razorpayOrderId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const caseSubmissionData = {
        caseData: {
          clientName: caseData.clientName,
          clientEmail: caseData.clientEmail,
          clientPhone: caseData.clientPhone,
          clientAddress: caseData.clientAddress,
          caseName: caseData.caseName,
          caseType: caseData.caseType,
          caseNumber: caseData.caseNumber,
          courtName: caseData.courtName,
          filingDate: caseData.filingDate,
          nextHearing: caseData.nextHearing,
          caseValue: caseData.caseValue,
          opponentName: caseData.opponentName,
          opponentLawyer: caseData.opponentLawyer,
          description: caseData.description,
          priority: caseData.priority,
          status: caseData.status
        },
        paymentId: paymentId,
        razorpayOrderId: razorpayOrderId
      };

      const response = await fetch(`${API_BASE_URL}/api/cases/create-after-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(caseSubmissionData)
      });

      const data = await response.json();

      if (response.ok) {
        setLawyerCases(prev => [data.case, ...prev]);
        setNewCase({
          clientName: '', clientEmail: '', clientPhone: '', clientAddress: '',
          caseName: '', caseType: '', caseNumber: '', courtName: '',
          filingDate: '', nextHearing: '', caseValue: '',
          opponentName: '', opponentLawyer: '', description: '',
          priority: 'medium', status: 'ongoing'
        });
        setShowForm(false);
        setShowPayment(false);
        setCaseDataBeforePayment(null);
        alert('✅ Case created successfully! Payment verified.');
      } else {
        alert('Failed to create case after payment: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error creating case after payment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitClientCase = async (e) => {
    e.preventDefault();
    
    // Check if client has paid
    if (!hasPaidClient) {
      setClientCaseDataBeforePayment({ ...newClientCase });
      setShowClientPayment(true);
      return;
    }

    // If already paid, submit directly
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/cases/client/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newClientCase)
      });

      const data = await response.json();

      if (response.ok) {
        setClientCases(prev => [data.case, ...prev]);
        setNewClientCase({
          caseName: '', caseType: '', caseNumber: '', courtName: '',
          filingDate: '', nextHearing: '', caseDescription: '',
          lawyerName: '', lawyerEmail: '', lawyerPhone: '', status: 'ongoing'
        });
        setShowClientCaseForm(false);
        alert('Case added successfully!');
      } else {
        // If payment required error
        if (response.status === 402) {
          alert('Payment required. Please complete the one-time payment.');
          setClientCaseDataBeforePayment(newClientCase);
          setShowClientPayment(true);
          setHasPaidClient(false);
          localStorage.setItem('userHasPaidClient', 'false');
        } else {
          alert('Failed to add case: ' + (data.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error adding case:', error);
      alert('Error adding case. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCase(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleClientCaseInputChange = (e) => {
    const { name, value } = e.target;
    setNewClientCase(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmitCase = async (e) => {
    e.preventDefault();
    
    if (user?.role === 'lawyer' && !hasPaid) {
      setCaseDataBeforePayment({ ...newCase });
      setShowPayment(true);
    } else {
      await submitCaseDirectly(newCase);
    }
  };

  const toggleCaseExpand = (caseId) => {
    setExpandedCase(expandedCase === caseId ? null : caseId);
  };

  const handleNoteChange = async (caseId, notes) => {
    setCaseNotes(prev => ({ ...prev, [caseId]: notes }));

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/cases/${caseId}/notes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const updateCaseStatus = async (caseId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        setLawyerCases(prev => prev.map(caseItem => 
          caseItem._id === caseId 
            ? { ...caseItem, status: newStatus }
            : caseItem
        ));
      }
    } catch (error) {
      console.error('Error updating case status:', error);
    }
  };

  const updateClientCaseStatus = async (caseId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok) {
        setClientCases(prev => prev.map(caseItem => 
          caseItem._id === caseId 
            ? { ...caseItem, status: newStatus }
            : caseItem
        ));
      }
    } catch (error) {
      console.error('Error updating case status:', error);
    }
  };

  // Role-based data
  const getRoleData = () => {
    switch(user?.role) {
      case 'lawyer':
        const ongoing = lawyerCases.filter(c => c.status === 'ongoing').length;
        const solved = lawyerCases.filter(c => c.status === 'solved').length;
        const highPriority = lawyerCases.filter(c => c.priority === 'high').length;
          // ✅ FIXED: Calculate actual revenue from client payments
      const totalValue = lawyerCases.reduce((sum, c) => {
        return sum + (c.clientPayment?.amountPaid || 0);
      }, 0);
        return {
          cases: lawyerCases,
          stats: { ongoing, solved, highPriority, total: lawyerCases.length, totalValue },
          title: 'Lawyer Dashboard',
          showAddCase: true,
          welcomeMessage: `Welcome back, ${user?.name}!`,
          type: 'lawyer'
        };

      case 'client':
        const clientOngoing = clientCases.filter(c => c.status === 'ongoing').length;
        const clientSolved = clientCases.filter(c => c.status === 'solved').length;
        
        return {
          cases: clientCases,
          stats: { ongoing: clientOngoing, solved: clientSolved, total: clientCases.length },
          title: 'My Legal Cases',
          showAddCase: true,
          welcomeMessage: `Hello ${user?.name}, track your legal matters here.`,
          type: 'client'
        };

      default:
        return {
          cases: [],
          stats: { ongoing: 0, solved: 0, total: 0 },
          title: 'My Collection',
          showAddCase: false,
          welcomeMessage: 'Welcome to LegalMitra',
          type: 'default'
        };
    }
  };

  const roleData = getRoleData();

  // UI Components
  const renderPaymentStatus = () => {
    if (user?.role === 'lawyer') {
      if (checkingPayment) {
        return (
          <div className="payment-status checking">
            <span className="status-icon">⏳</span>
            <span className="status-text">Checking payment status...</span>
          </div>
        );
      }
      
      return (
        <div className={`payment-status ${hasPaid ? 'paid' : 'unpaid'}`}>
          <span className="status-icon">
            {hasPaid ? '✅' : '💰'}
          </span>
          <span className="status-text">
            {hasPaid ? 'Premium Member - Unlimited Cases' : 'One-time payment required to add cases'}
          </span>
        </div>
      );
    } else if (user?.role === 'client') {
      return (
        <div className={`payment-status ${hasPaidClient ? 'paid' : 'unpaid'}`}>
          <span className="status-icon">
            {hasPaidClient ? '✅' : '💰'}
          </span>
          <span className="status-text">
            {hasPaidClient ? 'Premium Client - Unlimited Cases' : 'One-time payment required to add cases'}
          </span>
        </div>
      );
    }
    return null;
  };

  const renderClientPaymentScreen = () => (
    <div className="payment-overlay">
      <div className="payment-modal-new">
        <div className="container">
          <div className="header">
            <h1>One-Time Case Registration Fee</h1>
            <p>Pay once and track unlimited cases forever! No recurring fees.</p>
          </div>
          
          <div className="card pricing-card client-pricing">
            <h2>{PRICING.CLIENT.BASIC.name}</h2>
            <div className="price-tag">₹{PRICING.CLIENT.BASIC.price}</div>
            <div className="price-period">One-time payment • Lifetime access</div>
            
            <ul className="features">
              <li><i className="fas fa-check-circle"></i> Unlimited case tracking</li>
              <li><i className="fas fa-check-circle"></i> Lawyer communication</li>
              <li><i className="fas fa-check-circle"></i> Case status updates</li>
              <li><i className="fas fa-check-circle"></i> Document storage</li>
            </ul>
          </div>
          
          <div className="card form-card">
            <div className="payment-summary">
              <h3>Payment Summary</h3>
              <div className="payment-row">
                <span>One-time registration fee:</span>
                <span>₹{PRICING.CLIENT.BASIC.price}.00</span>
              </div>
              <div className="payment-row">
                <span>Tax:</span>
                <span>₹0.00</span>
              </div>
              <div className="payment-row total">
                <span>Total Amount:</span>
                <span>₹{PRICING.CLIENT.BASIC.price}.00</span>
              </div>
            </div>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', gap: '8px', fontSize: '14px', lineHeight: '1.4' }}>
                <input type="checkbox" style={{ display: 'inline-block', width: '16px', height: '16px', minWidth: '16px', marginTop: '2px', cursor: 'pointer' }} required />
                <span style={{ flex: 1 }}>
                  I agree to the <a href="#" style={{ color: '#4CAF50', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: '#4CAF50', textDecoration: 'none' }}>Privacy Policy</a>
                </span>
              </label>
            </div>
            
            <button 
              className="btn btn-primary client-pay-btn"
              onClick={() => initiateClientPayment(clientCaseDataBeforePayment)}
              disabled={clientPaymentLoading}
            >
              {clientPaymentLoading ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Processing...
                </>
              ) : (
                `Pay Now - ₹${PRICING.CLIENT.BASIC.price}`
              )}
            </button>
          </div>
        </div>

        <button 
          className="close-btn-new"
          onClick={() => {
            setShowClientPayment(false);
            setClientCaseDataBeforePayment(null);
          }}
          disabled={clientPaymentLoading}
        >
          ✕
        </button>
      </div>
    </div>
  );

  const renderPaymentScreen = () => (
  <div className="payment-overlay">
    <div className="payment-modal-new">
      <div className="container">
        <div className="header">
          <h1>One-Time Registration Fee</h1>
          <p>Pay once and add unlimited cases forever! No recurring fees.</p>
        </div>
        
        <div className="card pricing-card">
          <h2>{PRICING.LAWYER.PERSONAL.name}</h2>
          <div className="price-tag">₹{PRICING.LAWYER.PERSONAL.price}</div>
          <div className="price-period">One-time payment • Lifetime access</div>
          
          <ul className="features">
            {PRICING.LAWYER.PERSONAL.features.map((feature, index) => (
              <li key={index}><i className="fas fa-check-circle"></i> {feature}</li>
            ))}
          </ul>
        </div>
        
        <div className="card form-card">
          <div className="payment-summary">
            <h3>Payment Summary</h3>
            <div className="payment-row">
              <span>One-time registration fee:</span>
              <span>₹{PRICING.LAWYER.PERSONAL.price}.00</span>
            </div>
            <div className="payment-row">
              <span>Tax:</span>
              <span>₹0.00</span>
            </div>
            <div className="payment-row">
              <span>Total Amount:</span>
              <span>₹{PRICING.LAWYER.PERSONAL.price}.00</span>
            </div>
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={() => initiatePayment(caseDataBeforePayment)}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <>
                <div className="loading-spinner-small"></div>
                Processing...
              </>
            ) : (
              `Pay Now - ₹${PRICING.LAWYER.PERSONAL.price}`
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);

  // Render Solved Cases Section
  const renderSolvedCasesSection = () => {
    const solvedCases = roleData.cases.filter(caseItem => caseItem.status === 'solved');
    
    if (solvedCases.length === 0) return null;

    return (
      <div className="cases-section">
        <div className="section-header">
          <h2>
            {user?.role === 'lawyer' && 'Solved Cases'}
            {user?.role === 'client' && 'Solved Cases'}
          </h2>
          <button 
            className={`toggle-solved-btn ${showSolvedCases ? 'active' : ''}`}
            onClick={() => setShowSolvedCases(!showSolvedCases)}
          >
            {showSolvedCases ? '▲ Hide' : '▼ Show'} Solved Cases
          </button>
        </div>

        {showSolvedCases && (
          <div className="cases-grid">
            {solvedCases.map(caseItem => renderCaseCard(caseItem))}
          </div>
        )}
      </div>
    );
  };

 const renderWelcomeSection = () => {
  const nextHearing = roleData.cases.find(c => c.status === 'ongoing')?.nextHearing;
  
  // ✅ Check if user is actually connected (approved + hasPaid)
  const isConnected = joinTeamStatus === 'paid';
  
  return (
    <div className="dashboard-header">
      <div className="welcome-section">
        <h1>{roleData.welcomeMessage}
          <span className="welcome-emoji">
            {user?.role === 'lawyer' ? '👨‍⚖️' : '👤'}
          </span>
        </h1>
        <p className="welcome-subtitle">
          {user?.role === 'lawyer' && 'Here\'s your legal practice overview for today'}
          {user?.role === 'client' && 'Track your ongoing legal matters and case progress'}
        </p>
        <div className="welcome-stats">
          {user?.role === 'lawyer' && nextHearing && (
            <div className="welcome-stat">
              <span className="stat-icon">📅</span>
              <span>Next hearing: {new Date(nextHearing).toLocaleDateString()}</span>
            </div>
          )}
          <div className="welcome-stat">
            <span className="stat-icon">⚡</span>
            <span>
              {user?.role === 'lawyer' && `High priority cases: ${roleData.stats.highPriority}`}
              {user?.role === 'client' && `Active cases: ${roleData.stats.ongoing}`}
            </span>
          </div>
          
          {/* JOIN OUR TEAM STATUS - FIXED */}
          {user?.role === 'lawyer' && joinTeamStatus !== 'not_requested' && (
            <div className="welcome-stat">
              <span className="stat-icon">
                {joinTeamStatus === 'pending' && '⏳'}
                {(joinTeamStatus === 'approved' && !hasPaid) && '✅'} 
                {joinTeamStatus === 'rejected' && '❌'}
                {isConnected && '🎉'}
              </span>
              <span>
                Team Status: 
                <span className={`team-status ${isConnected ? 'paid' : joinTeamStatus}`}>
                  {joinTeamStatus === 'pending' && 'Verification Pending'}
                  {(joinTeamStatus === 'approved' && !hasPaid) && 'Approved - Complete Payment (₹2499)'}
                  {(joinTeamStatus === 'approved' && hasPaid) && 'Approved - Complete Payment(₹700)'}
                  {joinTeamStatus === 'rejected' && 'Verification Rejected'}
                  {isConnected && 'Connected with LegalMitra 🎉'}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="header-actions">
        {user?.role === 'lawyer' && (
          <>
            <button 
              className="primary-btn"
              onClick={() => setShowForm(true)}
            >
              <span className="btn-icon">➕</span>
              Add New Case
            </button>
            
            {/* ✅ JOIN OUR TEAM BUTTON - CONDITIONAL - FIXED */}
            {joinTeamStatus === 'not_requested' && (
              <button 
                className="join-team-btn"
                onClick={() => setShowJoinTeamPopup(true)}
              >
                <span className="btn-icon">🤝</span>
                Join Our Team
              </button>
            )}
            
            {joinTeamStatus === 'pending' && (
              <button 
                className="join-team-btn pending"
                disabled
              >
                <span className="btn-icon">⏳</span>
                Verification Pending
              </button>
            )}
            
            {(joinTeamStatus === 'approved' && hasPaid) && (
              <button 
                className="join-team-btn approved"
                onClick={() => setShowTeamPayment(true)}
              >
                <span className="btn-icon">💰</span>
                Complete Payment
              </button>
            )}
            {/* // ✅ ADD THIS NEW BUTTON - Direct Join (₹2499) */}
{(joinTeamStatus === 'approved' && !hasPaid) && (
  <button 
    className="join-team-btn approved"
    onClick={() => setShowTeamPayment(true)}
  >
    <span className="btn-icon">💰</span>
    Complete Payment
  </button>
)}


            {joinTeamStatus === 'rejected' && (
              <button 
                className="join-team-btn rejected"
                onClick={() => setShowJoinTeamPopup(true)}
              >
                <span className="btn-icon">🔄</span>
                Re-apply for Verification
              </button>
            )}
            
            {isConnected && (
              <button 
                className="join-team-btn paid"
                disabled
              >
                <span className="btn-icon">🎉</span>
                Team Member
              </button>
            )}
            
            <button 
              className="secondary-btn"
              onClick={() => setShowProfileCard(true)}
            >
              <span className="btn-icon">👨‍⚖️</span>
              Download Profile Card
            </button>
          </>
        )}
        {user?.role === 'client' && (
          <button 
            className="primary-btn"
            onClick={() => setShowClientCaseForm(true)}
          >
            <span className="btn-icon">➕</span>
            Add Your Case
          </button>
        )}
      </div>
    </div>
  );
};

  const renderJoinTeamPopup = () => (
  <div className="popup-overlay">
    <div className="join-team-popup">
      <div className="popup-header">
        <h2>🤝 Join Our LegalMitra Team</h2>
        <button 
          className="close-btn"
          onClick={() => setShowJoinTeamPopup(false)}
        >
          ✕
        </button>
      </div>
      
      <div className="popup-content">
        <div className="features-section">
          <h3>🚀 Premium Features You'll Get:</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">⭐</span>
              <div className="feature-text">
                <strong>Verified Profile Badge</strong>
                <p>Build trust with clients</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <div className="feature-text">
                <strong>Featured in "Our Lawyers"</strong>
                <p>Get more client visibility</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💼</span>
              <div className="feature-text">
                <strong>Advanced Case Tools</strong>
                <p>Premium case management</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div className="feature-text">
                <strong>Performance Analytics</strong>
                <p>Track your success metrics</p>
              </div>
            </div>
            
           
          </div>
        </div>

        <div className="verification-process">
          <h3>📋 Verification Process:</h3>
          <div className="process-steps">
            <div className="process-step">
              <span className="step-number">1</span>
              <span className="step-text">Submit verification request</span>
            </div>
            <div className="process-step">
              <span className="step-number">2</span>
              <span className="step-text">Admin reviews your profile (2-3 days)</span>
            </div>
            <div className="process-step">
              <span className="step-number">3</span>
              <span className="step-text">Get approval notification</span>
            </div>
            <div className="process-step">
              <span className="step-number">4</span>
              <span className="step-text">
                {hasPaid ? 'Pay upgrade fee of ₹700' : 'Pay one-time joining fee of ₹2499'}
              </span>
            </div>
            <div className="process-step">
              <span className="step-number">5</span>
              <span className="step-text">Welcome to the team! 🎉</span>
            </div>
          </div>
        </div>

        {/* NEW: Pricing Options Section */}
        <div className="pricing-options-section">
          <h3>💰 Choose Your Path to Team Membership:</h3>
          <div className="pricing-options-grid">
            {/* Option 1: Direct Team Join */}
            <div className={`pricing-option ${!hasPaid ? 'recommended' : ''}`}>
              <div className="option-header">
                <h4>Direct Team Join</h4>
                {!hasPaid && <span className="recommended-badge">Recommended</span>}
              </div>
              <div className="option-price">₹{PRICING.TEAM_JOIN.price}</div>
              <div className="option-description">
                Complete package including personal space + team features
              </div>
              <ul className="option-features">
                <li>✅ Personal case management (₹1799 value)</li>
                <li>✅ Full team membership</li>
                <li>✅ Verified profile badge</li>
              
              </ul>
              <div className="option-best-for">
                <strong>Best for:</strong> New lawyers joining LegalMitra
              </div>
            </div>

            {/* Option 2: Upgrade Path */}
            <div className={`pricing-option ${hasPaid ? 'recommended' : ''}`}>
              <div className="option-header">
                <h4>Team Upgrade</h4>
                {hasPaid && <span className="upgrade-badge">Your Path</span>}
              </div>
              <div className="option-price">₹{PRICING.LAWYER.TEAM_UPGRADE.price}</div>
              <div className="option-description">
                Upgrade from personal to team membership
              </div>
              <ul className="option-features">
                <li>✅ You already have personal access</li>
                <li>✅ Add team features only</li>
                <li>✅ Verified profile badge</li>
              
              </ul>
              <div className="option-best-for">
                <strong>Best for:</strong> Existing LegalMitra lawyers
              </div>
              {hasPaid && (
                <div className="upgrade-savings">
                  🎉 You save ₹{PRICING.LAWYER.PERSONAL.price} (already paid)
                </div>
              )}
            </div>
          </div>
          
          {/* Pricing Summary */}
          <div className="pricing-summary">
            <div className="summary-item">
              <span>Personal Space Only:</span>
              <span>₹{PRICING.LAWYER.PERSONAL.price}</span>
            </div>
            <div className="summary-item">
              <span>Upgrade to Team:</span>
              <span>+ ₹{PRICING.LAWYER.TEAM_UPGRADE.price}</span>
            </div>
            <div className="summary-item total">
              <span>Direct Team Join:</span>
              <span>₹{PRICING.TEAM_JOIN.price}</span>
            </div>
          </div>
        </div>

        <div className="popup-actions">
          <button 
            className="submit-verification-btn"
            onClick={requestVerification}
          >
            <span className="btn-icon">📨</span>
            {hasPaid ? 'Request Team Upgrade' : 'Request Team Membership'}
          </button>
          <button 
            className="may"
            onClick={() => setShowJoinTeamPopup(false)}
          >
            Maybe Later
          </button>
        </div>

        {/* NEW: Help Text */}
        <div className="help-text">
          <p>💡 <strong>Note:</strong> 
            {hasPaid 
              ? ` You already have personal access. The upgrade fee is only ₹${PRICING.LAWYER.TEAM_UPGRADE.price} to add team features.`
              : ` The ₹${PRICING.TEAM_JOIN.price} joining fee includes both personal space and team features.`
            }
          </p>
        </div>
      </div>
    </div>
  </div>
);

  const renderTeamPaymentScreen = () => {
  const hasPersonalAccess = hasPaid;
  const isUpgrade = hasPersonalAccess;

  return (
    <div className="payment-overlay">
      <div className="payment-modal-new team-payment">
        <div className="container">
          <div className="header">
            <h1>
              {isUpgrade ? 'Upgrade to Team Membership! 🚀' : 'Welcome to LegalMitra Team! 🎉'}
            </h1>
            <p>
              {isUpgrade 
                ? `Complete your upgrade for only ₹${PRICING.LAWYER.TEAM_UPGRADE.price} more` 
                : 'Complete your team registration with one-time payment'
              }
            </p>
          </div>
          
          <div className="card pricing-card team-pricing">
            <h2>{isUpgrade ? PRICING.LAWYER.TEAM_UPGRADE.name : PRICING.TEAM_JOIN.name}</h2>
            
            {/* Show different pricing based on upgrade status */}
            {isUpgrade ? (
              <>
                <div className="upgrade-price-breakdown">
                  <div className="price-breakdown">
                    <span>Team Membership Value:</span>
                    <span>₹{PRICING.TEAM_JOIN.price}</span>
                  </div>
                  <div className="price-breakdown">
                    <span>Already Paid (Personal):</span>
                    <span>- ₹{PRICING.LAWYER.PERSONAL.price}</span>
                  </div>
                  <div className="price-breakdown total">
                    <span>Amount Due:</span>
                    <span>₹{PRICING.LAWYER.TEAM_UPGRADE.price}</span>
                  </div>
                </div>
                <div className="price-tag">₹{PRICING.LAWYER.TEAM_UPGRADE.price}</div>
              </>
            ) : (
              <div className="price-tag">₹{PRICING.TEAM_JOIN.price}</div>
            )}
            
            <div className="price-period">One-time payment • Lifetime access</div>
            
            <ul className="features">
              {(isUpgrade ? PRICING.LAWYER.TEAM_UPGRADE.features : PRICING.TEAM_JOIN.features).map((feature, index) => (
                <li key={index}><i className="fas fa-check-circle"></i> {feature}</li>
              ))}
            </ul>
          </div>
          
          <div className="card form-card">
            <div className="payment-summary">
              <h3>Payment Summary</h3>
              <div className="payment-row">
                <span>
                  {isUpgrade ? 'Team upgrade fee:' : 'One-time team joining fee:'}
                </span>
                <span>₹{isUpgrade ? PRICING.LAWYER.TEAM_UPGRADE.price : PRICING.TEAM_JOIN.price}.00</span>
              </div>
              <div className="payment-row">
                <span>Tax:</span>
                <span>₹0.00</span>
              </div>
              <div className="payment-row total">
                <span>Total Amount:</span>
                <span>₹{isUpgrade ? PRICING.LAWYER.TEAM_UPGRADE.price : PRICING.TEAM_JOIN.price}.00</span>
              </div>
            </div>
            
            {isUpgrade && (
              <div className="upgrade-notice">
                <span className="upgrade-icon">🔄</span>
                <span>You're upgrading from Personal (₹{PRICING.LAWYER.PERSONAL.price}) to Team membership</span>
              </div>
            )}
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', gap: '8px', fontSize: '14px', lineHeight: '1.4' }}>
                <input type="checkbox" style={{ display: 'inline-block', width: '16px', height: '16px', minWidth: '16px', marginTop: '2px', cursor: 'pointer' }} required />
                <span style={{ flex: 1 }}>
                  I agree to the <a href="#" style={{ color: '#4CAF50', textDecoration: 'none' }}>Team Terms</a> and <a href="#" style={{ color: '#4CAF50', textDecoration: 'none' }}>Code of Conduct</a>
                </span>
              </label>
            </div>
            
            <button 
              className="btn btn-primary team-pay-btn"
              onClick={initiateTeamPayment}
              disabled={teamPaymentLoading}
            >
              {teamPaymentLoading ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Processing...
                </>
              ) : (
                `${isUpgrade ? 'Upgrade Now' : 'Join Team'} - ₹${isUpgrade ? PRICING.LAWYER.TEAM_UPGRADE.price : PRICING.TEAM_JOIN.price}`
              )}
            </button>
          </div>
        </div>

        <button 
          className="close-btn-new"
          onClick={() => setShowTeamPayment(false)}
          disabled={teamPaymentLoading}
        >
          ✕
        </button>
      </div>
    </div>
  );
};


// Cloudinary Document Upload Function
const uploadToCloudinary = (files, folder = 'general') => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary widget is available
    if (!window.cloudinary) {
      reject(new Error('Cloudinary widget not loaded'));
      return;
    }

    const uploadWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        folder: `legalmitra/cases/${selectedCaseForVault._id}/${folder}`,
        multiple: true,
        maxFiles: 10,
        maxFileSize: DOCUMENT_SETTINGS.maxFileSize,
        clientAllowedFormats: DOCUMENT_SETTINGS.allowedFormats,
        sources: ['local'],
        showAdvancedOptions: false,
        cropping: false
      },
      (error, result) => {
        if (!error && result && result.event === 'success') {
          // File uploaded successfully
          const fileData = {
            id: result.info.public_id,
            name: result.info.original_filename,
            type: result.info.resource_type,
            size: result.info.bytes,
            uploadDate: new Date().toISOString(),
            folder: folder,
            url: result.info.secure_url,
            publicId: result.info.public_id,
            format: result.info.format
          };
          resolve(fileData);
        } else if (error) {
          reject(error);
        }
      }
    );

    // Open the upload widget
    uploadWidget.open();
  });
};

// Updated handleFileUpload function
// Cloudinary Document Upload Function
const handleFileUpload = async (folder = 'general') => {
  if (!selectedCaseForVault) {
    alert('❌ No case selected for document upload');
    return;
  }

  setUploading(true);

  try {
    // Check if Cloudinary widget script is loaded
    if (!window.cloudinary) {
      console.log('🌐 Loading Cloudinary widget script...');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://upload-widget.cloudinary.com/global/all.js';
        script.onload = () => {
          console.log('✅ Cloudinary widget script loaded');
          resolve();
        };
        script.onerror = () => {
          console.error('❌ Failed to load Cloudinary widget script');
          reject(new Error('Failed to load Cloudinary script'));
        };
        document.head.appendChild(script);
      });
    }

    console.log('📤 Opening Cloudinary upload widget...');
    
    const uploadWidget = window.cloudinary.createUploadWidget(
      {
        cloudName: CLOUDINARY_CONFIG.cloudName, // You need to set this!
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        folder: `legalmitra/documents/${selectedCaseForVault._id}/${folder}`,
        multiple: true,
        maxFiles: 10,
        resourceType: 'auto',
        clientAllowedFormats: DOCUMENT_SETTINGS.allowedFormats,
        maxFileSize: DOCUMENT_SETTINGS.maxFileSize,
        sources: ['local', 'camera', 'url'],
        showAdvancedOptions: false,
        cropping: false,
        showPoweredBy: false,
        theme: 'minimal'
      },
      (error, result) => {
        console.log('📦 Cloudinary upload callback:', { error, result });
        
        if (!error && result && result.event === 'success') {
          console.log('✅ File uploaded successfully:', result.info);
          
          // Handle successful upload
          const updatedDocuments = { ...documents };
          const caseId = selectedCaseForVault._id;

          if (!updatedDocuments[caseId]) {
            updatedDocuments[caseId] = {};
          }

          if (!updatedDocuments[caseId][folder]) {
            updatedDocuments[caseId][folder] = [];
          }

          const fileData = {
            id: result.info.public_id,
            name: result.info.original_filename,
            type: result.info.resource_type,
            size: result.info.bytes,
            uploadDate: new Date().toISOString(),
            folder: folder,
            url: result.info.secure_url,
            publicId: result.info.public_id,
            format: result.info.format,
            thumbnailUrl: result.info.thumbnail_url
          };

          updatedDocuments[caseId][folder].push(fileData);
          setDocuments(updatedDocuments);
          localStorage.setItem('caseDocuments', JSON.stringify(updatedDocuments));
          
          alert(`✅ File "${result.info.original_filename}" uploaded successfully!`);
        } else if (error) {
          console.error('❌ Upload error:', error);
          alert(`❌ Upload failed: ${error.message}`);
        } else if (result && result.event === 'close') {
          console.log('📤 Upload widget closed by user');
        } else if (result && result.event === 'queues-start') {
          console.log('🚀 Upload started');
        } else if (result && result.event === 'queues-end') {
          console.log('🏁 Upload completed');
        }
      }
    );

    uploadWidget.open();
  } catch (error) {
    console.error('💥 Error in handleFileUpload:', error);
    alert('❌ Error opening upload interface. Please check your Cloudinary configuration.');
  } finally {
    setUploading(false);
  }
};

  const renderStats = () => {
    if (user?.role === 'lawyer') {
      return (
        <div className="stats-grid">
          <div className="stat-card ongoing">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>Ongoing Cases</h3>
              <div className="stat-number">{roleData.stats.ongoing}</div>
              
            </div>
          </div>
          
          <div className="stat-card solved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Solved Cases</h3>
              <div className="stat-number">{roleData.stats.solved}</div>
              
            </div>
          </div>
          
          <div className="stat-card revenue">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3> Total Revenue</h3>
              <div className="stat-number">₹{(roleData.stats.totalValue / 1000).toFixed(0)} k</div>
              
            </div>
          </div>
          
          <div className="stat-card priority">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>High Priority</h3>
              <div className="stat-number">{roleData.stats.highPriority}</div>
              
            </div>
          </div>
        </div>
      );
    } else if (user?.role === 'client') {
      return (
        <div className="stats-grid">
          <div className="stat-card ongoing">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>Active Cases</h3>
              <div className="stat-number">{roleData.stats.ongoing}</div>
              <div className="stat-trend">In progress</div>
            </div>
          </div>
          
          <div className="stat-card solved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Closed Cases</h3>
              <div className="stat-number">{roleData.stats.solved}</div>
              <div className="stat-trend">Successfully resolved</div>
            </div>
          </div>
          
          <div className="stat-card revenue">
            <div className="stat-icon">👨‍⚖️</div>
            <div className="stat-content">
              <h3>Your Lawyer</h3>
              <div className="stat-number">1</div>
              <div className="stat-trend">Legal representative</div>
            </div>
          </div>
          
          <div className="stat-card priority">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>Next Hearing</h3>
              <div className="stat-number">Soon</div>
              <div className="stat-trend">Stay prepared</div>
            </div>
          </div>
        </div>
      );
    }
  };

  

  const renderCaseCard = (caseItem) => {
  if (user?.role === 'lawyer') {
    const { clientPayment } = caseItem;
    const balanceDue = (clientPayment?.agreedAmount || 0) - (clientPayment?.amountPaid || 0);
    const paymentPercentage = clientPayment?.agreedAmount > 0 ? 
      Math.round(((clientPayment?.amountPaid || 0) / clientPayment?.agreedAmount) * 100) : 0;
    const daysRemaining = clientPayment?.dueDate ? 
      Math.ceil((new Date(clientPayment.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    return (
      <div key={caseItem._id} className={`case-card ${caseItem.priority} ${caseItem.status}`}>
        <div className="case-header" onClick={() => toggleCaseExpand(caseItem._id)}>
          <div className="case-title-section">
            <h3>{caseItem.caseName}</h3>
            <div className="case-meta">
              <span className="case-number">{caseItem.caseNumber || 'N/A'}</span>
              <span className={`status-badge ${caseItem.status}`}>
                {caseItem.status === 'ongoing' ? '📋' : '✅'} {caseItem.status}
              </span>
              {getClientPaymentBadge(caseItem.clientPayment)}
              <span className={`priority-badge ${caseItem.priority}`}>
                {caseItem.priority === 'high' ? '🔴' : caseItem.priority === 'medium' ? '🟡' : '🟢'} {caseItem.priority}
              </span>
            </div>
          </div>
          <div className="case-header-actions">
            {user?.role === 'lawyer' && (
              <button 
                className="call-client-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openCallOptions(caseItem);
                }}
                title="Contact Client"
              >
                <span className="call-icon">📞</span>
              </button>
            )}
            <button className="expand-btn">
              {expandedCase === caseItem._id ? '▲' : '▼'}
            </button>
          </div>
        </div>

        <div className="case-summary">
          <div className="summary-item">
            <span className="summary-icon">👤</span>
            <span>{caseItem.clientName}</span>
          </div>
          <div className="summary-item">
            <span className="summary-icon">⚖️</span>
            <span>{caseItem.caseType}</span>
          </div>
          <div className="summary-item">
            <span className="summary-icon">🏛️</span>
            <span>{caseItem.courtName || 'N/A'}</span>
          </div>
        </div>

        {expandedCase === caseItem._id && (
          <div className="case-details">
            <div className="details-grid">
              <div className="detail-section">
                <h4>Client Information</h4>
                <div className="detail-item">
                  <strong>Name:</strong> {caseItem.clientName}
                </div>
                <div className="detail-item">
                  <strong>Email:</strong> {caseItem.clientEmail}
                </div>
                <div className="detail-item">
                  <strong>Phone:</strong> {caseItem.clientPhone}
                </div>
                <div className="detail-item">
                  <strong>Address:</strong> {caseItem.clientAddress}
                </div>
              </div>

              <div className="detail-section">
                <h4>Case Information</h4>
                <div className="detail-item">
                  <strong>Case Number:</strong> {caseItem.caseNumber || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Court:</strong> {caseItem.courtName || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Filing Date:</strong> {caseItem.filingDate ? new Date(caseItem.filingDate).toLocaleDateString() : 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Next Hearing:</strong> {caseItem.nextHearing ? new Date(caseItem.nextHearing).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              {/* Additional Case Information */}
              <div className="detail-section">
                <h4>Case Details</h4>
                <div className="detail-item">
                  <strong>Case Value:</strong> {caseItem.caseValue || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Opponent:</strong> {caseItem.opponentName || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Opponent Lawyer:</strong> {caseItem.opponentLawyer || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Priority:</strong> 
                  <span className={`priority-badge ${caseItem.priority}`}>
                    {caseItem.priority}
                  </span>
                </div>
              </div>

              <div className="detail-section full-width">
                <h4>Case Description</h4>
                <p>{caseItem.description || 'No description provided.'}</p>
              </div>

              <div className="detail-section full-width">
                <h4>Case Notes</h4>
                <textarea
                  placeholder="Add your case notes here..."
                  value={caseNotes[caseItem._id] || caseItem.notes || ''}
                  onChange={(e) => handleNoteChange(caseItem._id, e.target.value)}
                  className="notes-textarea"
                  rows="4"
                />
              </div>

              {/* Enhanced Client Payment Section */}
              <div className="detail-section full-width">
                <h4>💳 Client Payment Dashboard</h4>
                
                {/* Payment Status Cards Grid */}
                <div className="payment-cards-grid">
                  {/* Payment Status Card */}
                  <div className="payment-status-card">
                    <div className="payment-card-header">
                      <span className="payment-card-icon">📊</span>
                      <h5>Payment Status</h5>
                    </div>
                    <div className="payment-card-content">
                      <div className={`payment-status-badge-large ${clientPayment?.status || 'unpaid'}`}>
                        <span className="status-text">
                          {clientPayment?.status === 'paid' && '✅ Fully Paid'}
                          {clientPayment?.status === 'partially_paid' && '🟡 Partially Paid'}
                          {clientPayment?.status === 'unpaid' && '🔴 Unpaid'}
                          {clientPayment?.status === 'overdue' && '🚨 Overdue'}
                          {clientPayment?.status === 'refunded' && '↩️ Refunded'}
                          {!clientPayment?.status && '🔴 Unpaid'}
                        </span>
                      </div>
                      <div className="payment-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${paymentPercentage}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{paymentPercentage}% Paid</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary Card */}
                  <div className="payment-status-card">
                    <div className="payment-card-header">
                      <span className="payment-card-icon">💰</span>
                      <h5>Financial Summary</h5>
                    </div>
                    <div className="payment-card-content">
                      <div className="financial-stats">
                        <div className="financial-item">
                          <span className="financial-label">Agreed Amount:</span>
                          <span className="financial-value">₹{(clientPayment?.agreedAmount || 0).toLocaleString()}</span>
                        </div>
                        <div className="financial-item">
                          <span className="financial-label">Amount Paid:</span>
                          <span className="financial-value paid">₹{(clientPayment?.amountPaid || 0).toLocaleString()}</span>
                        </div>
                        <div className="financial-item">
                          <span className="financial-label">Balance Due:</span>
                          <span className={`financial-value ${balanceDue > 0 ? 'due' : 'paid'}`}>
                            ₹{balanceDue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Timeline Card */}
                  <div className="payment-status-card">
                    <div className="payment-card-header">
                      <span className="payment-card-icon">📅</span>
                      <h5>Payment Timeline</h5>
                    </div>
                    <div className="payment-card-content">
                      <div className="timeline-info">
                        <div className="timeline-item">
                          <span className="timeline-label">Due Date:</span>
                          <span className="timeline-value">
                            {clientPayment?.dueDate ? new Date(clientPayment.dueDate).toLocaleDateString() : 'Not set'}
                          </span>
                        </div>
                        <div className="timeline-item">
                          <span className="timeline-label">Last Payment:</span>
                          <span className="timeline-value">
                            {clientPayment?.lastPaymentDate ? new Date(clientPayment.lastPaymentDate).toLocaleDateString() : 'No payments'}
                          </span>
                        </div>
                        <div className="timeline-item">
                          <span className="timeline-label">Days Remaining:</span>
                          <span className={`timeline-value ${daysRemaining !== null && daysRemaining < 0 ? 'overdue' : 'normal'}`}>
                            {daysRemaining !== null ? 
                              (daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`) : 
                              'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                

                {/* Payment Controls Section */}
                <div className="payment-controls-section">
                  <h5>Update Payment Information</h5>
                  
                  <div className="payment-controls-grid">
                    {/* Status Control */}
                    <div className="control-group">
                      <label>Payment Status</label>
                      <select 
                        value={clientPayment?.status || 'unpaid'}
                        onChange={(e) => updateClientPaymentStatus(caseItem._id, {
                          status: e.target.value,
                          amountPaid: clientPayment?.amountPaid || 0,
                          agreedAmount: clientPayment?.agreedAmount || 0,
                          dueDate: clientPayment?.dueDate
                        })}
                        className="payment-select"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>

                    {/* Amount Controls */}
                    <div className="control-group">
                      <label>Agreed Amount (₹)</label>
                      <input
                        type="number"
                        placeholder="Enter agreed amount"
                        value={clientPayment?.agreedAmount || ''}
                        onChange={(e) => updateClientPaymentStatus(caseItem._id, {
                          status: clientPayment?.status || 'unpaid',
                          agreedAmount: parseInt(e.target.value) || 0,
                          amountPaid: clientPayment?.amountPaid || 0,
                          dueDate: clientPayment?.dueDate
                        })}
                        className="payment-input"
                      />
                    </div>

                    <div className="control-group">
                      <label>Amount Paid (₹)</label>
                      <input
                        type="number"
                        placeholder="Enter paid amount"
                        value={clientPayment?.amountPaid || ''}
                        onChange={(e) => updateClientPaymentStatus(caseItem._id, {
                          status: clientPayment?.status || 'unpaid',
                          amountPaid: parseInt(e.target.value) || 0,
                          agreedAmount: clientPayment?.agreedAmount || 0,
                          dueDate: clientPayment?.dueDate
                        })}
                        className="payment-input"
                      />
                    </div>

                    {/* Due Date Control */}
                    <div className="control-group">
                      <label>Due Date</label>
                      <input
                        type="date"
                        value={clientPayment?.dueDate ? new Date(clientPayment.dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => updateClientPaymentStatus(caseItem._id, {
                          status: clientPayment?.status || 'unpaid',
                          amountPaid: clientPayment?.amountPaid || 0,
                          agreedAmount: clientPayment?.agreedAmount || 0,
                          dueDate: e.target.value
                        })}
                        className="payment-input"
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="payment-quick-actions">
                    <button 
                      className="quick-action-btn mark-paid" style={{paddingBottom:'-2px'}}
                      onClick={() => updateClientPaymentStatus(caseItem._id, {
                        status: 'paid',
                        amountPaid: clientPayment?.agreedAmount || 0,
                        agreedAmount: clientPayment?.agreedAmount || 0,
                        dueDate: clientPayment?.dueDate
                      })}
                    >
                      ✅ Mark as Paid
                    </button>
                    <button 
                      className="quick-action-btn add-payment"
                      onClick={() => {
                        const paymentAmount = prompt('Enter payment amount:');
                        if (paymentAmount && !isNaN(paymentAmount)) {
                          updateClientPaymentStatus(caseItem._id, {
                            status: 'partially_paid',
                            amountPaid: (clientPayment?.amountPaid || 0) + parseInt(paymentAmount),
                            agreedAmount: clientPayment?.agreedAmount || 0,
                            dueDate: clientPayment?.dueDate,
                            paymentNotes: `Payment of ₹${paymentAmount} recorded`
                          });
                        }
                      }}
                    >
                      💰 Add Payment
                    </button>
                    <button 
                      className="quick-action-btn set-due"
                      onClick={() => {
                        const dueDate = prompt('Enter due date (YYYY-MM-DD):');
                        if (dueDate) {
                          updateClientPaymentStatus(caseItem._id, {
                            status: clientPayment?.status || 'unpaid',
                            amountPaid: clientPayment?.amountPaid || 0,
                            agreedAmount: clientPayment?.agreedAmount || 0,
                            dueDate: dueDate
                          });
                        }
                      }}
                    >
                      📅 Set Due Date
                    </button>
                  </div>
                </div>

                {/* Payment History Section */}
                {clientPayment?.paymentHistory && clientPayment.paymentHistory.length > 0 && (
                  <div className="payment-history-section">
                    <h5>Payment History</h5>
                    <div className="payment-history-list">
                      {clientPayment.paymentHistory.slice().reverse().map((payment, index) => (
                        <div key={index} className="payment-history-item">
                          <div className="payment-history-info">
                            <span className="payment-amount">₹{payment.amount?.toLocaleString()}</span>
                            <span className="payment-date">
                              {new Date(payment.date).toLocaleDateString()}
                            </span>
                            {payment.method && (
                              <span className="payment-method">{payment.method}</span>
                            )}
                          </div>
                          {payment.notes && (
                            <div className="payment-notes">
                              📝 {payment.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              
            </div>

            <div className="case-actions">
              <div className="action-buttons-container">
                {/* Contact Client Button - Only for lawyers */}
                {user?.role === 'lawyer' && (
                  <button 
                    className="contact-client-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openContactPopup(caseItem);
                    }}
                    title="View Contact Details"
                  >
                    <span className="action-icon"></span>
                    Contact Details
                  </button>
                )}
                
                <button 
                  className={`status-btn ${caseItem.status === 'ongoing' ? 'solved' : 'ongoing'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCaseStatus(caseItem._id, caseItem.status === 'ongoing' ? 'solved' : 'ongoing');
                  }}
                >
                  {/* <span className="action-icon">
                    {caseItem.status === 'ongoing' ? '✅' : '📋'}
                  </span> */}
                  {caseItem.status === 'ongoing' ? 'Mark as Solved' : 'Reopen Case'}
                </button>
                
                <button 
                  className="document-vault-btn"
                  onClick={() => openDocumentVaultForLawyer(caseItem)}
                >
                  {/* <span className="action-icon">📁</span> */}
                  Document Vault
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } else if (user?.role === 'client') {
    const totalExpenses = calculateTotalExpenses(caseItem._id);
    const amountPaid = calculateAmountPaid(caseItem._id);
    const balanceDue = calculateBalanceDue(caseItem._id);
    
    return (
      <div key={caseItem._id} className={`case-card ${caseItem.status}`}>
        <div className="case-header" onClick={() => toggleCaseExpand(caseItem._id)}>
          <div className="case-title-section">
            <h3>{caseItem.caseName}</h3>
            <div className="case-meta">
              <span className="case-number">{caseItem.caseNumber || 'N/A'}</span>
              <span className={`status-badge ${caseItem.status}`}>
                {caseItem.status === 'ongoing' ? '📋' : '✅'} {caseItem.status}
              </span>
              {/* Expense Summary Badge */}
              <span className={`expense-badge ${balanceDue === 0 ? 'paid' : balanceDue > 0 ? 'pending' : 'overpaid'}`}>
                {balanceDue === 0 ? '💰 Paid' : balanceDue > 0 ? `₹${balanceDue}` : '💳 Credit'}
              </span>
            </div>
          </div>
          <button className="expand-btn">
            {expandedCase === caseItem._id ? '▲' : '▼'}
          </button>
        </div>

        <div className="case-summary">
          <div className="summary-item">
            <span className="summary-icon">👨‍⚖️</span>
            <span>Lawyer: {caseItem.lawyerName}</span>
          </div>
          <div className="summary-item">
            <span className="summary-icon">⚖️</span>
            <span>{caseItem.caseType}</span>
          </div>
          <div className="summary-item">
            <span className="summary-icon">📅</span>
            <span>Next: {caseItem.nextHearing ? new Date(caseItem.nextHearing).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        {expandedCase === caseItem._id && (
          <div className="case-details">
            <div className="details-grid">
              <div className="detail-section">
                <h4>Your Lawyer</h4>
                <div className="detail-item">
                  <strong>Name:</strong> {caseItem.lawyerName}
                </div>
                <div className="detail-item">
                  <strong>Email:</strong> {caseItem.lawyerEmail}
                </div>
                <div className="detail-item">
                  <strong>Phone:</strong> {caseItem.lawyerPhone || 'N/A'}
                </div>
              </div>

              <div className="detail-section">
                <h4>Case Information</h4>
                <div className="detail-item">
                  <strong>Case Number:</strong> {caseItem.caseNumber || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Court:</strong> {caseItem.courtName || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Filing Date:</strong> {caseItem.filingDate ? new Date(caseItem.filingDate).toLocaleDateString() : 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Next Hearing:</strong> {caseItem.nextHearing ? new Date(caseItem.nextHearing).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              {/* Expense Summary Section */}
              <div className="detail-section">
                <h4>💼 Expense Summary</h4>
                <div className="expense-mini-summary">
                  <div className="expense-mini-item">
                    <strong>Total Cost:</strong> ₹{totalExpenses.toLocaleString()}
                  </div>
                  <div className="expense-mini-item">
                    <strong>Paid:</strong> ₹{amountPaid.toLocaleString()}
                  </div>
                  <div className="expense-mini-item">
                    <strong>Balance:</strong> 
                    <span className={balanceDue === 0 ? 'expense-paid' : balanceDue > 0 ? 'expense-due' : 'expense-credit'}>
                      ₹{balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section full-width">
                <h4>Case Description</h4>
                <p>{caseItem.caseDescription || caseItem.description || 'No description provided.'}</p>
              </div>
            </div>

            <div className="case-actions">
              {/* Expense Calculator Button */}
              <button 
                className="expense-calculator-btn"
                onClick={() => openExpenseCalculator(caseItem)}
              >
                <span className="action-icon">💰</span>
                Expense Calculator
              </button>

              <button 
                className="document-vault-btn"
                onClick={() => openDocumentVault(caseItem)}
              >
                <span className="action-icon">📁</span>
                Document Vault
              </button>
              
              <button 
                className={`status-btn ${caseItem.status === 'ongoing' ? 'solved' : 'ongoing'}`}
                onClick={() => updateClientCaseStatus(caseItem._id, caseItem.status === 'ongoing' ? 'solved' : 'ongoing')}
              >
                {caseItem.status === 'ongoing' ? '✅ Mark as Solved' : '📋 Reopen Case'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
};
  // Contact Popup Function
  const openContactPopup = (caseItem) => {
    setSelectedCaseForCall(caseItem);
    setShowCallModal(true);
  };

  // Enhanced Contact Popup Modal
  const renderContactPopup = () => {
    if (!selectedCaseForCall) return null;

    return (
      <div className="contact-popup-overlay">
        <div className="contact-popup">
          <div className="contact-popup-header">
            <h3>Client Contact Details</h3>
            <button 
              className="close-btn"
              onClick={() => setShowCallModal(false)}
            >
              ✕
            </button>
          </div>

          <div className="contact-popup-content">
            {/* Client Information Card */}
            <div className="client-info-card">
              <div className="client-avatar-large">
                {selectedCaseForCall.clientName?.charAt(0) || 'C'}
              </div>
              <div className="client-info-main">
                <h4>{selectedCaseForCall.clientName}</h4>
                <p className="client-case-info">{selectedCaseForCall.caseName}</p>
                <div className="case-meta-info">
                  <span className="case-type">{selectedCaseForCall.caseType}</span>
                  <span className="case-status-badge">{selectedCaseForCall.status}</span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="contact-details-section">
              <h5>Contact Information</h5>
              <div className="contact-details-grid">
                <div className="contact-item">
                  <span className="contact-icon">📧</span>
                  <div className="contact-info">
                    <label>Email</label>
                    <p>{selectedCaseForCall.clientEmail || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <div className="contact-info">
                    <label>Phone</label>
                    <p>{selectedCaseForCall.clientPhone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="contact-item">
                  <span className="contact-icon">🏠</span>
                  <div className="contact-info">
                    <label>Address</label>
                    <p>{selectedCaseForCall.clientAddress || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h5>Quick Actions</h5>
              <div className="quick-actions-grid">
                <button 
                  className="quick-action-btn call-btn"
                  onClick={() => {
                    if (selectedCaseForCall.clientPhone) {
                      callClient(selectedCaseForCall);
                      setShowCallModal(false);
                    }
                  }}
                  disabled={!selectedCaseForCall.clientPhone}
                >
                  <span className="action-icon-large">📞</span>
                  <span>Call</span>
                </button>

                <button 
                  className="quick-action-btn sms-btn"
                  onClick={() => {
                    if (selectedCaseForCall.clientPhone) {
                      sendSMS(selectedCaseForCall);
                      setShowCallModal(false);
                    }
                  }}
                  disabled={!selectedCaseForCall.clientPhone}
                >
                  <span className="action-icon-large">💬</span>
                  <span>SMS</span>
                </button>

                <button 
                  className="quick-action-btn email-btn"
                  onClick={() => {
                    if (selectedCaseForCall.clientEmail) {
                      window.open(`mailto:${selectedCaseForCall.clientEmail}?subject=Regarding your case: ${selectedCaseForCall.caseName}`, '_self');
                      setShowCallModal(false);
                    }
                  }}
                  disabled={!selectedCaseForCall.clientEmail}
                >
                  <span className="action-icon-large">📧</span>
                  <span>Email</span>
                </button>

                <button 
                  className="quick-action-btn copy-btn"
                  onClick={() => {
                    const contactText = `Name: ${selectedCaseForCall.clientName}\nPhone: ${selectedCaseForCall.clientPhone || 'N/A'}\nEmail: ${selectedCaseForCall.clientEmail || 'N/A'}\nCase: ${selectedCaseForCall.caseName}`;
                    navigator.clipboard.writeText(contactText);
                    alert('Contact details copied to clipboard!');
                  }}
                >
                  <span className="action-icon-large">📋</span>
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Communication History */}
            <div className="communication-history">
              <h5>Recent Communications</h5>
              {getCallLogs(selectedCaseForCall._id).length > 0 ? (
                <div className="communication-list">
                  {getCallLogs(selectedCaseForCall._id)
                    .slice(-3)
                    .reverse()
                    .map((log, index) => (
                    <div key={index} className="communication-item">
                      <span className={`comm-icon ${log.type}`}>
                        {log.type === 'outgoing' ? '📞' : 
                         log.type === 'sms' ? '💬' : '📧'}
                      </span>
                      <div className="comm-details">
                        <span className="comm-type">{log.type}</span>
                        <span className="comm-time">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-communications">No recent communications</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLawyerForm = () => (
    <div className="case-form-overlay">
      <div className="case-form-modal">
        <div className="form-header">
          <h3>Add New Case</h3>
          <button 
            className="close-btn"
            onClick={() => setShowForm(false)}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmitCase} className="enhanced-form">
          <div className="form-section">
            <h4>Client Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Client Name *</label>
                <input
                  type="text"
                  name="clientName"
                  value={newCase.clientName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Client Email *</label>
                <input
                  type="email"
                  name="clientEmail"
                  value={newCase.clientEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="clientPhone"
                  value={newCase.clientPhone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Client Address *</label>
              <textarea
                name="clientAddress"
                value={newCase.clientAddress}
                onChange={handleInputChange}
                rows="2"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Case Details</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Case Name *</label>
                <input
                  type="text"
                  name="caseName"
                  value={newCase.caseName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Case Type *</label>
                <select
                  name="caseType"
                  value={newCase.caseType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Civil">Civil</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Family">Family</option>
                  <option value="Property">Property</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Case Number</label>
                <input
                  type="text"
                  name="caseNumber"
                  value={newCase.caseNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Court Name</label>
                <input
                  type="text"
                  name="courtName"
                  value={newCase.courtName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Next Hearing</label>
                <input
                  type="date"
                  name="nextHearing"
                  value={newCase.nextHearing}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Additional Information</h4>
            <div className="form-group full-width">
              <label>Case Description *</label>
              <textarea
                name="description"
                value={newCase.description}
                onChange={handleInputChange}
                rows="4"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Case'}
            </button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setShowForm(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderClientCaseForm = () => (
    <div className="case-form-overlay">
      <div className="case-form-modal">
        <div className="form-header">
          <h3>Add Your Case</h3>
          <button 
            className="close-btn"
            onClick={() => setShowClientCaseForm(false)}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmitClientCase} className="enhanced-form">
          <div className="form-section">
            <h4>Case Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Case Name *</label>
                <input
                  type="text"
                  name="caseName"
                  value={newClientCase.caseName}
                  onChange={handleClientCaseInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Case Type *</label>
                <select
                  name="caseType"
                  value={newClientCase.caseType}
                  onChange={handleClientCaseInputChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Civil">Civil</option>
                  <option value="Criminal">Criminal</option>
                  <option value="Family">Family</option>
                  <option value="Property">Property</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Case Number</label>
                <input
                  type="text"
                  name="caseNumber"
                  value={newClientCase.caseNumber}
                  onChange={handleClientCaseInputChange}
                />
              </div>
              <div className="form-group">
                <label>Court Name</label>
                <input
                  type="text"
                  name="courtName"
                  value={newClientCase.courtName}
                  onChange={handleClientCaseInputChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Next Hearing</label>
                <input
                  type="date"
                  name="nextHearing"
                  value={newClientCase.nextHearing}
                  onChange={handleClientCaseInputChange}
                />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Case Description *</label>
              <textarea
                name="caseDescription"
                value={newClientCase.caseDescription}
                onChange={handleClientCaseInputChange}
                rows="4"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Lawyer Information</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Lawyer Name *</label>
                <input
                  type="text"
                  name="lawyerName"
                  value={newClientCase.lawyerName}
                  onChange={handleClientCaseInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Lawyer Email *</label>
                <input
                  type="email"
                  name="lawyerEmail"
                  value={newClientCase.lawyerEmail}
                  onChange={handleClientCaseInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={isLoading}>
              <span className="btn-icon">💼</span>
              {isLoading ? 'Adding...' : 'Add Case'}
            </button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setShowClientCaseForm(false)}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // FIXED: Add debug function
  const debugPaymentStatus = () => {
    console.log('🔍 DEBUG PAYMENT STATUS:', {
      hasPaid,
      joinTeamStatus,
      localStorage: {
        userHasPaid: localStorage.getItem('userHasPaid'),
        joinTeamStatus: localStorage.getItem('joinTeamStatus')
      },
      user: user?.role
    });
  };

  return (
    <div className="lawyer-dashboard">
      {renderWelcomeSection()}
      {renderPaymentStatus()}
      {renderStats()}

       

      {/* Add Case Form - Only for Lawyers */}
      {showForm && user?.role === 'lawyer' && renderLawyerForm()}

      {/* Add Client Case Form */}
      {showClientCaseForm && user?.role === 'client' && renderClientCaseForm()}

      {/* Payment Screen */}
      {showPayment && renderPaymentScreen()}
      {showClientPayment && renderClientPaymentScreen()}
      {showTeamPayment && renderTeamPaymentScreen()}

      {/* Popups */}
      {showProfileCard && renderProfileCardModal()}
      {showJoinTeamPopup && renderJoinTeamPopup()}
      {showExpenseCalculator && renderExpenseCalculator()}
      {showCallModal && renderCallModal()}
      {showCallModal && renderContactPopup()}
        {showClientDetailsModal && renderClientDetailsModal()}

      {/* Debug Button - Temporary */}
      {/* <button 
        onClick={debugPaymentStatus}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#ff6b6b',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        🔍 Debug Status
      </button> */}

      {/* Cases Section */}
      <div className="cases-section">
        <div className="section-header">
          <h2>
            {user?.role === 'lawyer' && 'My Cases'}
            {user?.role === 'client' && 'My Legal Cases'}
          </h2>
        </div>

       {(isLoading || (user?.role === 'client' && checkingPayment)) && roleData.cases.length === 0 ? (
  <div className="loading-state">
    <div className="loading-spinner"></div>
    <p>Loading cases...</p>
  </div>
) : (
          <div className="cases-grid">
            {roleData.cases.filter(c => c.status === 'ongoing').length > 0 ? (
              roleData.cases.filter(c => c.status === 'ongoing').map(caseItem => renderCaseCard(caseItem))
            ) : (
              <div className="empty-state">
                {user?.role === 'lawyer' && 'No cases found. Click "Add Case" to get started.'}
                {user?.role === 'client' && 'No cases found. Click "Add Your Case" to get started.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SOLVED CASES SECTION */}
      {renderSolvedCasesSection()}
      {renderClientRequestsSection()}
      {/* ENHANCED MY REQUESTS SECTION */}
{user?.role === 'client' && (
  <div className="requests-section enhanced-requests">
    <div className="section-header">
      <h2>📨 My Case Requests</h2>
      <div className="requests-stats">
        <span className="stat pending">
          Pending: {myRequests.filter(req => req.status === 'pending').length}
        </span>
        <span className="stat accepted">
          Accepted: {myRequests.filter(req => req.status === 'accepted').length}
        </span>
        <span className="stat declined">
          Declined: {myRequests.filter(req => req.status === 'declined').length}
        </span>
      </div>
    </div>
    
    <div className="requests-container">
      {myRequests.length > 0 ? (
        <div className="requests-grid">
          {myRequests.map(request => (
            <div key={request._id} className={`request-card enhanced ${request.status}`}>
              <div className="request-header">
                <div className="lawyer-info">
                  <div className="lawyer-avatar">
                    {request.lawyerId?.name?.charAt(0) || 'L'}
                  </div>
                  <div className="lawyer-details">
                    <h4>To: {request.lawyerId?.name || 'Lawyer'}</h4>
                    <p className="lawyer-email">{request.lawyerId?.email || ''}</p>
                  </div>
                </div>
                <span className={`status-badge enhanced ${request.status}`}>
                  {request.status === 'pending' && '⏳ Pending Review'}
                  {request.status === 'accepted' && '✅ Case Accepted'}
                  {request.status === 'declined' && '❌ Declined'}
                </span>
              </div>
              
              <div className="request-body">
                <div className="case-info">
                  <div className="info-item">
                    <span className="info-label">Case Type:</span>
                    <span className="info-value">{request.caseType}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Priority:</span>
                    <span className="info-value priority">{request.priority || 'Normal'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Submitted:</span>
                    <span className="info-value">
                      {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                
                <div className="case-summary">
                  <strong>Case Summary:</strong>
                  <p>{request.caseSummary}</p>
                </div>
                
               
                
                {request.lawyerResponse && (
                  <div className={`lawyer-response ${request.status}`}>
                    <strong>Lawyer's Response:</strong>
                    <p>{request.lawyerResponse}</p>
                    {request.responseDate && (
                      <small>Responded on: {new Date(request.responseDate).toLocaleString()}</small>
                    )}
                  </div>
                )}
              </div>
              
              <div className="request-actions">
                
                {request.status === 'pending' && (
                  <button className="action-btn pending" disabled>
                    ⏳ Waiting for response
                  </button>
                )}
               
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-requests-state">
          <div className="empty-icon">📨</div>
          <h3>No Case Requests Yet</h3>
          <p>You haven't sent any case requests to lawyers.</p>
          <div className="empty-actions">
            <button className="primary-btn" onClick={() => setShowClientCaseForm(true)}>
              ➕ Add Your First Case
            </button>
            <button className="secondary-btn" onClick={fetchMyRequests}>
              🔄 Refresh Requests
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
      )}
       {renderRequestNotifications()} {/* Add this line */}
      
{showDocumentVault && renderDocumentVault()}
    </div>
  );
};

export default MyCollection;