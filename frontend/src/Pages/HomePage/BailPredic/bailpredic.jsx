import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import Login from "../../../Components/Login/Login";
import casesData from "../../../assets/data/cases.json";
import { Pie, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import "./bailpredic.css";
import { PRICING } from "../../../config/pricing";
const API_BASE_URL = import.meta.env.VITE_API_URL;

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function BailPredict() {
  const { user, loading, refreshUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filteredCases, setFilteredCases] = useState([]);
  const [bailProbability, setBailProbability] = useState(0);
  const [displayCases, setDisplayCases] = useState([]);
  const [mostCommonIPC, setMostCommonIPC] = useState("");
  const [mostCommonCrime, setMostCommonCrime] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [forceCheckDone, setForceCheckDone] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

   // NEW STATE FOR CASE PAGINATION
  const [casesToShow, setCasesToShow] = useState(10); // Start with 10 cases

  // Filters
  const [courtFilter, setCourtFilter] = useState("");
  const [crimeFilter, setCrimeFilter] = useState("");
  const [bailFilter, setBailFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  const courts = [...new Set(casesData.map(c => c.court).filter(Boolean))];
  const crimes = [...new Set(casesData.map(c => c.crime_type).filter(Boolean))];
  const regions = [...new Set(casesData.map(c => c.region).filter(Boolean))];

   // NEW FUNCTION TO LOAD MORE CASES
  const loadMoreCases = () => {
    setCasesToShow(prev => prev + 1); // Load one more case
  };


  // Fallback localStorage payment check
  const checkLocalStoragePayment = () => {
    if (user?.role === 'lawyer') {
      const hasPaid = localStorage.getItem('userHasPaid') === 'true';
      console.log('💾 Lawyer localStorage payment status:', hasPaid);
      return hasPaid;
    } else if (user?.role === 'client') {
      const hasPaid = localStorage.getItem('userHasPaidClient') === 'true';
      console.log('💾 Client localStorage payment status:', hasPaid);
      return hasPaid;
    }
    return false;
  };

  // COMPREHENSIVE PAYMENT STATUS CHECK
  const checkPaymentStatus = async () => {
    if (!user) return false;
    
    try {
      console.log('🔍 Comprehensive payment check for:', user.role, user.id);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found');
        return false;
      }

      // Check server payment status first
      const endpoint = user.role === 'lawyer' 
        ? `${API_BASE_URL}/api/payment/payment-status`
        : `${API_BASE_URL}/api/payment/client-payment-status`;

      console.log('📡 Checking payment status from:', endpoint);
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('💰 Server payment status:', data);
        
        if (data.success && data.hasPaid) {
          // Update localStorage to match server state
          if (user.role === 'lawyer') {
            localStorage.setItem('userHasPaid', 'true');
          } else {
            localStorage.setItem('userHasPaidClient', 'true');
          }
          await refreshUser(); // Refresh user context
          console.log('✅ Payment status confirmed: PAID');
          return true;
        } else {
          // Ensure localStorage reflects unpaid status
          if (user.role === 'lawyer') {
            localStorage.setItem('userHasPaid', 'false');
          } else {
            localStorage.setItem('userHasPaidClient', 'false');
          }
          console.log('❌ Payment status confirmed: NOT PAID');
          return false;
        }
      } else {
        console.log('⚠️ Using fallback payment check');
        // Fallback to localStorage check if server is unavailable
        return checkLocalStoragePayment();
      }
    } catch (error) {
      console.error('💥 Error checking payment status:', error);
      // Fallback to localStorage check
      return checkLocalStoragePayment();
    }
  };

  // Main payment status effect
  useEffect(() => {
    const initializePaymentStatus = async () => {
      if (!user || paymentChecked) return;
      
      console.log('🎯 Initializing payment status check...');
      const paymentStatus = await checkPaymentStatus();
      setHasPaid(paymentStatus);
      setPaymentChecked(true);
      console.log('🎯 Final payment status for BailPredict:', paymentStatus);
    };

    initializePaymentStatus();
  }, [user, paymentChecked]);

  // Force check payment status from server on component load
  useEffect(() => {
    const forceCheckPaymentStatus = async () => {
      if (!user || forceCheckDone) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        console.log("🔄 Force checking payment status from server...");
        
        const response = await fetch(`${API_BASE_URL}/api/payment/payment-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("💰 Server payment status:", data);
          
          if (data.success && data.hasPaid) {
            await refreshUser();
            setHasPaid(true);
            console.log("✅ Updated user payment status");
          }
        }
        setForceCheckDone(true);
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    forceCheckPaymentStatus();
  }, [user, forceCheckDone, refreshUser]);

  useEffect(() => {
    filterCases();
  }, [search, courtFilter, crimeFilter, bailFilter, regionFilter]);

    // UPDATE: Reset cases to show when filters change
  useEffect(() => {
    setCasesToShow(10); // Reset to 10 cases when filters change
  }, [search, courtFilter, crimeFilter, bailFilter, regionFilter]);


  const filterCases = () => {
    let filtered = casesData.filter(c =>
      (c.case_title?.toLowerCase().includes(search.toLowerCase()) ||
       c.court?.toLowerCase().includes(search.toLowerCase()) ||
       c.crime_type?.toLowerCase().includes(search.toLowerCase()) ||
       c.accused_name?.toLowerCase().includes(search.toLowerCase()) ||
       c.judge?.toLowerCase().includes(search.toLowerCase()) ||
       c.region?.toLowerCase().includes(search.toLowerCase()) ||
       (Array.isArray(c.ipc_sections) && c.ipc_sections.join(",").toLowerCase().includes(search.toLowerCase())))
    );

    if (courtFilter) filtered = filtered.filter(c => c.court === courtFilter);
    if (crimeFilter) filtered = filtered.filter(c => c.crime_type === crimeFilter);
    if (bailFilter) {
      if (bailFilter === "granted") {
        filtered = filtered.filter(c => c.bail_outcome?.toLowerCase() === "granted");
      } else if (bailFilter === "rejected") {
        filtered = filtered.filter(c => c.bail_outcome?.toLowerCase() === "rejected");
      }
    }
    if (regionFilter) filtered = filtered.filter(c => c.region === regionFilter);

    setFilteredCases(filtered);
    
    // const casesToShow = Math.max(filtered.length, 5);
    const cases = filtered.slice(0, casesToShow);
    setDisplayCases(cases);

    const bailGranted = filtered.filter(c => c.bail_outcome?.toLowerCase() === "granted").length;
    setBailProbability(filtered.length ? ((bailGranted / filtered.length) * 100).toFixed(1) : 0);

    const ipcCounts = {};
    filtered.forEach(c => {
      if (Array.isArray(c.ipc_sections)) {
        c.ipc_sections.forEach(sec => {
          ipcCounts[sec] = (ipcCounts[sec] || 0) + 1;
        });
      }
    });
    setMostCommonIPC(Object.keys(ipcCounts).reduce((a, b) => ipcCounts[a] > ipcCounts[b] ? a : b, "N/A"));

    const crimeCounts = {};
    filtered.forEach(c => {
      if (c.crime_type) {
        crimeCounts[c.crime_type] = (crimeCounts[c.crime_type] || 0) + 1;
      }
    });
    setMostCommonCrime(Object.keys(crimeCounts).reduce((a, b) => crimeCounts[a] > crimeCounts[b] ? a : b, "N/A"));
  };

   // UPDATE: Add effect to update display cases when casesToShow changes
  useEffect(() => {
    const cases = filteredCases.slice(0, casesToShow);
    setDisplayCases(cases);
  }, [casesToShow, filteredCases]);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    setPaymentChecked(false); // Reset payment check
    await refreshUser();
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = user?.role === 'lawyer' 
        ? `${API_BASE_URL}/api/payment/payment-status`
        : `${API_BASE_URL}/api/payment/client-payment-status`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.hasPaid) {
          setHasPaid(true);
          await refreshUser();
        } else {
          setHasPaid(false);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
    
    setRefreshing(false);
  };

  // Payment functions
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const createRazorpayOrder = async (amount) => {
    try {
      const token = localStorage.getItem('token');
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

      if (!response.ok) {
        const errorText = await response.text();
        return { 
          success: false, 
          error: `Server error: ${response.status} - ${errorText}` 
        };
      }

      const data = await response.json();
      if (data.order && data.order.id) {
        return { success: true, order: data.order };
      } else {
        return { success: false, error: 'Invalid order data from server' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: `Network error: ${error.message}` 
      };
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = user?.role === 'lawyer'
        ? `${API_BASE_URL}/api/payment/verify-payment`
        : `${API_BASE_URL}/api/payment/verify-client-payment`;

      console.log('🔍 Verifying payment via:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      console.log('💰 Payment verification response:', data);

      if (data.success) {
        // Update localStorage based on user role
        if (user?.role === 'lawyer') {
          localStorage.setItem('userHasPaid', 'true');
        } else {
          localStorage.setItem('userHasPaidClient', 'true');
        }
        
        await refreshUser();
        setHasPaid(true);
        setPaymentChecked(false); // Force recheck
        
        return data;
      } else {
        return data;
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Payment verification failed: ' + error.message 
      };
    }
  };

  const initiatePayment = async () => {
    try {
      setPaymentLoading(true);

      const plan = PRICING.LAWYER.PERSONAL;
      
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay SDK failed to load. Please check your internet connection.');
        return;
      }

      const orderResponse = await createRazorpayOrder(plan.price);
      
      if (!orderResponse.success) {
        alert(`Failed to create payment order: ${orderResponse.error}. Please try again.`);
        return;
      }

      const razorpayKey = 'rzp_test_RTOZnKCegnEMZB';
      
      const options = {
        key: razorpayKey,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency || 'INR',
        name: 'LegalMitra Bail Predict',
        description: 'One-Time Premium Access Fee',
        order_id: orderResponse.order.id,
        handler: async function (response) {
          const verificationResponse = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
             amount: plan.price // Send amount to backend
          });

          if (verificationResponse.success) {
            setShowPayment(false);
            setHasPaid(true);
            alert('✅ Payment successful! You now have premium access.');
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response) {
        alert(`Payment failed: ${response.error.description}`);
        setPaymentLoading(false);
      });

      rzp.open();
      
    } catch (error) {
      alert('Error initiating payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Payment Modal Component
  const renderPaymentScreen = () => (
    <div className="payment-overlay">
      <div className="payment-modal-new">
        <div className="container">
          <div className="header">
            <h1>One-Time Premium Access Fee</h1>
            <p>Pay once and unlock Bail Predict feature forever! No recurring fees.</p>
          </div>
          
          <div className="card pricing-card">
            <h2>Premium Bail Predict Access</h2>
            <div className="price-tag">₹{PRICING.CLIENT.BASIC.price}</div>
            <div className="price-period">One-time payment • Lifetime access</div>
            
            <ul className="features">
              <li><i className="fas fa-check-circle"></i> Unlimited bail predictions</li>
              <li><i className="fas fa-check-circle"></i> Advanced case analytics</li>
              <li><i className="fas fa-check-circle"></i> Priority support</li>
            </ul>
          </div>
          
          <div className="card form-card">
            <div className="payment-summary">
              <h3>Payment Summary</h3>
              <div className="payment-row">
                <span>One-time premium access:</span>
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
                  I agree to the <a href="#" style={{ color: '#3399cc', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: '#3399cc', textDecoration: 'none' }}>Privacy Policy</a>
                </span>
              </label>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={initiatePayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? (
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
          onClick={() => setShowPayment(false)}
          disabled={paymentLoading}
        >
          ✕
        </button>
      </div>
    </div>
  );

  const pieData = {
    labels: ["Bail Granted", "Bail Rejected"],
    datasets: [{
      data: [
        filteredCases.filter(c => c.bail_outcome?.toLowerCase() === "granted").length,
        filteredCases.filter(c => c.bail_outcome?.toLowerCase() === "rejected").length
      ],
      backgroundColor: ["#06b6d4", "#7c3aed"],
    }]
  };

  const barCounts = filteredCases.reduce((acc, c) => {
    if (c.crime_type) acc[c.crime_type] = (acc[c.crime_type] || 0) + 1;
    return acc;
  }, {});
  
  const barData = {
    labels: Object.keys(barCounts),
    datasets: [{ 
      label: "Crime Type Count", 
      data: Object.values(barCounts), 
      backgroundColor: "#06b6d4" 
    }]
  };
  // If user is not logged in, show login page
  if (!user) {
    return <Login setCurrentPage={() => {}} />;
  }

  // Show loading state while checking authentication or payment status
  if (loading || !paymentChecked) {
    return (
      <div className="bail-dashboard">
        <div className="bail-container">
          
        </div>
      </div>
    );
  }


  

  // If user has not paid, show subscription gate
  if (!hasPaid) {
    return (
      <div className="bail-dashboard">
        <div className="bail-container">
          <div className="premium-gate-exact">
            <div className="premium-lock-icon">🔒</div>
            <h2 className="premium-gate-title">Subscribe to unlock.</h2>
            <p className="premium-gate-message">
              Thanks for using LegalMitra! To view this question you must subscribe to premium.
            </p>
            
            <button 
              className="premium-subscribe-btn"
              onClick={() => setShowPayment(true)}
            >
              Subscribe
            </button>
            
            <button 
              className="premium-refresh-btn"
              onClick={handleRefreshStatus}
              disabled={refreshing}
              style={{
                marginTop: '10px',
                background: 'transparent',
                border: '1px solid #06b6d4',
                color: '#06b6d4',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Status'}
            </button>
          </div>
        </div>

        {/* Payment Modal */}
        {showPayment && renderPaymentScreen()}
      </div>
    );
  }

  // If user has paid, show the full bail dashboard
  return (
    <div className="bail-dashboard">
      <div className="bail-container">
        <h1 className="bail-title">Bail Cases Dashboard</h1>
        
        <input
          type="text"
          placeholder="Search by title, court, crime type, IPC section, judge, region..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bail-search"
        />

        {/* Filters */}
        <div className="bail-filters">
          <select 
            value={courtFilter} 
            onChange={e => setCourtFilter(e.target.value)} 
            className="bail-filter-select"
          >
            <option value="">All Courts</option>
            {courts.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={crimeFilter} 
            onChange={e => setCrimeFilter(e.target.value)} 
            className="bail-filter-select"
          >
            <option value="">All Crime Types</option>
            {crimes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={bailFilter} 
            onChange={e => setBailFilter(e.target.value)} 
            className="bail-filter-select"
          >
            <option value="">All Bail Outcomes</option>
            <option value="granted">Granted</option>
            <option value="rejected">Rejected</option>
          </select>

          <select 
            value={regionFilter} 
            onChange={e => setRegionFilter(e.target.value)} 
            className="bail-filter-select"
          >
            <option value="">All Regions</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Stats Panel */}
        <div className="bail-stats">
          <div className="bail-stat-card">
            <div className="bail-stat-label">Bail Probability</div>
            <div className="bail-stat-value" style={{ color: "#06b6d4" }}>{bailProbability}%</div>
          </div>
          <div className="bail-stat-card">
            <div className="bail-stat-label">Total Cases</div>
            <div className="bail-stat-value" style={{ color: "#7c3aed" }}>{filteredCases.length}</div>
          </div>
          <div className="bail-stat-card">
            <div className="bail-stat-label">Most Common IPC</div>
            <div className="bail-stat-value" style={{ color: "#06b6d4" }}>{mostCommonIPC}</div>
          </div>
          <div className="bail-stat-card">
            <div className="bail-stat-label">Most Common Crime</div>
            <div className="bail-stat-value" style={{ color: "#7c3aed" }}>{mostCommonCrime}</div>
          </div>
        </div>

        {/* Scrollable Cases Section */}
        <div className="bail-cases-section">
          <h2 className="bail-section-title">Case Details</h2>
          
          <div className="bail-cases-container">
            {displayCases.length > 0 ? (
              displayCases.map((c, index) => (
                <div key={c.case_id || index} className="bail-case-card">
                  <h3 className="bail-case-title">
                    {c.case_title || "Case Title Not Available"}
                  </h3>
                  
                  <div className="bail-case-details">
                    <div><strong>Court:</strong> {c.court || "N/A"}</div>
                    <div><strong>Date:</strong> {c.date || "N/A"}</div>
                    <div><strong>Judge:</strong> {c.judge || "N/A"}</div>
                    <div><strong>Accused:</strong> {c.accused_name || "N/A"} {c.accused_gender ? `(${c.accused_gender})` : ""}</div>
                    <div>
                      <strong>Bail Outcome:</strong> 
                      <span style={{ 
                        color: c.bail_outcome?.toLowerCase() === "granted" ? "#06b6d4" : "#7c3aed",
                        fontWeight: "bold",
                        marginLeft: "5px"
                      }}>
                        {c.bail_outcome || "N/A"}
                      </span>
                    </div>
                    <div><strong>Crime Type:</strong> {c.crime_type || "N/A"}</div>
                    <div><strong>Region:</strong> {c.region || "N/A"}</div>
                  </div>
                  
                  <div className="bail-ipc-section">
                    <strong>IPC Sections:</strong> {Array.isArray(c.ipc_sections) ? c.ipc_sections.join(", ") : "N/A"}
                  </div>
                  
                  <details className="bail-details">
                    <summary className="bail-summary">
                      View Full Case Details
                    </summary>
                    <div className="bail-full-details">
                      <p><strong>Facts:</strong> {c.facts || "No facts available"}</p>
                      <p><strong>Summary:</strong> {c.summary || "No summary available"}</p>
                      <p><strong>Legal Issues:</strong> {Array.isArray(c.legal_issues) ? c.legal_issues.join("; ") : "N/A"}</p>
                      <p><strong>Judgment Reason:</strong> {c.judgment_reason || "N/A"}</p>
                    </div>
                  </details>
                </div>
              ))
            ) : (
              <div className="bail-no-cases">
                No cases found matching your criteria.
              </div>
            )}
          </div>
          
          {/* UPDATED: Show More Button */}
          {filteredCases.length > casesToShow && (
            <div className="bail-show-more-container">
              <button 
                className="bail-show-more-btn"
                onClick={loadMoreCases}
              >
                Show More Cases ({casesToShow} of {filteredCases.length} shown)
              </button>
            </div>
          )}
          
          {filteredCases.length > 0 && (
            <p className="bail-cases-count">
              
              Showing {casesToShow} of {filteredCases.length} cases
            </p>
          )}
        </div>

        {/* Charts */}
        <div className="bail-charts">
          <div className="bail-chart-container">
            <h3 className="bail-chart-title">Bail Outcome Distribution</h3>
            <div className="bail-chart-wrapper">
              <Pie 
                data={pieData} 
                options={{ 
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      labels: {
                        color: "#e6eef6"
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
          <div className="bail-chart-container">
            <h3 className="bail-chart-title">Crime Type Distribution</h3>
            <div className="bail-chart-wrapper">
              <Bar 
                data={barData} 
                options={{ 
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      labels: {
                        color: "#e6eef6"
                      }
                    }
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: "#e6eef6"
                      },
                      grid: {
                        color: "#374151"
                      }
                    },
                    y: {
                      ticks: {
                        color: "#e6eef6"
                      },
                      grid: {
                        color: "#374151"
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}