import React, { useState, useEffect } from 'react';
import styles from './FindLawyer.module.css'; // CSS Modules import
import lawyersData from './lawyers_dataset.json';
import { PRICING } from '../../../config/pricing';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const FindLawyer = () => {
  // All your existing state remains exactly the same
  const [allLawyers, setAllLawyers] = useState([]);
  const [teamLawyers, setTeamLawyers] = useState([]);
  const [otherLawyers, setOtherLawyers] = useState([]);
  const [filteredTeamLawyers, setFilteredTeamLawyers] = useState([]);
  const [filteredOtherLawyers, setFilteredOtherLawyers] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [caseSummary, setCaseSummary] = useState('');
  const [caseType, setCaseType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [hasPaidClient, setHasPaidClient] = useState(() => {
    const savedPaymentStatus = localStorage.getItem('userHasPaidClient');
    return savedPaymentStatus === 'true';
  });
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [showClientPayment, setShowClientPayment] = useState(false);
  const [clientPaymentLoading, setClientPaymentLoading] = useState(false);
  const [clientRequestDataBeforePayment, setClientRequestDataBeforePayment] = useState(null);
  
  const [otherLawyersToShow, setOtherLawyersToShow] = useState(10);

  // Check client payment status on component load
  const checkClientPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found');
        setCheckingPayment(false);
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
        setHasPaidClient(data.hasPaid);
        localStorage.setItem('userHasPaidClient', data.hasPaid.toString());
        console.log('✅ Client payment status updated to:', data.hasPaid);
      } else {
        console.error('❌ Failed to check client payment status:', data.error);
        const savedStatus = localStorage.getItem('userHasPaidClient');
        setHasPaidClient(savedStatus === 'true');
      }
    } catch (error) {
      console.error('💥 Error checking client payment status:', error);
      const savedStatus = localStorage.getItem('userHasPaidClient');
      setHasPaidClient(savedStatus === 'true');
    } finally {
      setCheckingPayment(false);
    }
  };

  // Fetch team lawyers from backend
  const fetchTeamLawyers = async () => {
    try {
      console.log('🔄 Fetching team lawyers from API...');
      
      const response = await fetch(`${API_BASE_URL}/api/lawyer/team-lawyers`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Team lawyers API response:', data);
      
      if (data.success && data.lawyers) {
        const transformedTeamLawyers = data.lawyers.map(lawyer => ({
          id: lawyer._id,
          name: lawyer.name,
          location: lawyer.address || 'Location not specified',
          speciality: lawyer.specialization ? [lawyer.specialization] : ['General Practice'],
          rating: 4.5,
          experience: lawyer.experience || 1,
          gender: 'M',
          jurisdiction: 'Multiple Courts',
          clientType: 'Individual & Corporate',
          avgDaysOfCompletion: 45,
          languages: ['English', 'Hindi'],
          isTeamLawyer: true,
          barCouncilNumber: lawyer.barCouncilNumber || 'Not specified',
          joinDate: lawyer.teamJoinDate,
          email: lawyer.email,
          phone: lawyer.phone
        }));

        console.log(`✅ Transformed ${transformedTeamLawyers.length} team lawyers`);
        setTeamLawyers(transformedTeamLawyers);
        setFilteredTeamLawyers(transformedTeamLawyers);
        
        setOtherLawyers(lawyersData);
        setFilteredOtherLawyers(lawyersData.slice(0, 10));
        
        setAllLawyers([...transformedTeamLawyers, ...lawyersData]);
      } else {
        console.warn('⚠️ No team lawyers found or API error');
        setOtherLawyers(lawyersData);
        setFilteredOtherLawyers(lawyersData.slice(0, 10));
        setAllLawyers(lawyersData);
      }
    } catch (error) {
      console.error('❌ Error fetching team lawyers:', error);
      setOtherLawyers(lawyersData);
      setFilteredOtherLawyers(lawyersData.slice(0, 10));
      setAllLawyers(lawyersData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkClientPaymentStatus();
    
    setOtherLawyers(lawyersData);
    setFilteredOtherLawyers(lawyersData.slice(0, 10));
    setAllLawyers(lawyersData);
    
    fetchTeamLawyers();
  }, []);

  const loadMoreOtherLawyers = () => {
    setOtherLawyersToShow(prev => prev + 10);
  };

  useEffect(() => {
    const applyFilters = (lawyers) => {
      let filtered = [...lawyers];
      
      if (selectedState) {
        filtered = filtered.filter(lawyer => 
          lawyer.location.toLowerCase().includes(selectedState.toLowerCase())
        );
      }
      
      if (selectedSpeciality) {
        filtered = filtered.filter(lawyer => 
          lawyer.speciality.some(spec => 
            spec.toLowerCase().includes(selectedSpeciality.toLowerCase())
          )
        );
      }
      
      if (selectedRating) {
        filtered = filtered.filter(lawyer => 
          Math.floor(lawyer.rating) >= parseInt(selectedRating)
        );
      }
      
      if (sortBy) {
        filtered = filtered.sort((a, b) => {
          switch (sortBy) {
            case 'experience-high':
              return b.experience - a.experience;
            case 'experience-low':
              return a.experience - b.experience;
            case 'rating-high':
              return b.rating - a.rating;
            case 'rating-low':
              return a.rating - b.rating;
            default:
              return 0;
          }
        });
      } else {
        filtered = filtered.sort((a, b) => b.rating - a.rating);
      }
      
      return filtered;
    };

    const filteredTeam = applyFilters(teamLawyers);
    setFilteredTeamLawyers(filteredTeam);
    
    const filteredOther = applyFilters(otherLawyers);
    setFilteredOtherLawyers(filteredOther.slice(0, otherLawyersToShow));
  }, [selectedState, selectedSpeciality, selectedRating, sortBy, teamLawyers, otherLawyers, otherLawyersToShow]);

  useEffect(() => {
    setOtherLawyersToShow(10);
  }, [selectedState, selectedSpeciality, selectedRating, sortBy]);

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
        localStorage.setItem('userHasPaidClient', 'true');
        setHasPaidClient(true);
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

  const initiateClientPayment = async (requestData) => {
    try {
      setClientPaymentLoading(true);
      
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
            amount: plan.price
          });

          if (verificationResponse.success) {
            await sendRequestToLawyer(clientRequestDataBeforePayment);
            setShowClientPayment(false);
            setClientRequestDataBeforePayment(null);
          } else {
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
          contact: localStorage.getItem('userPhone') || ''
        },
        notes: {
          user_id: localStorage.getItem('userId'),
          user_role: 'client',
          payment_type: 'client_access'
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

  const handleSendRequest = (lawyer) => {
    console.log('🎯 === handleSendRequest FUNCTION CALLED ===');
    console.log('🎯 Lawyer received:', lawyer);
    
    const hasPaidFromState = hasPaidClient;
    const hasPaidFromStorage = localStorage.getItem('userHasPaidClient') === 'true';
    const hasPaid = hasPaidFromState || hasPaidFromStorage;
    
    console.log('💰 Payment status:', { hasPaidFromState, hasPaidFromStorage, hasPaid });

    if (!hasPaid) {
      console.log('💰 Payment required, showing payment modal');
      setClientRequestDataBeforePayment({
        lawyer: lawyer,
        caseSummary: '',
        caseType: ''
      });
      setShowClientPayment(true);
      return;
    }

    setSelectedLawyer(lawyer);
    setShowRequestModal(true);
    console.log('✅ Client has paid, opening request modal');
  };

  const sendRequestToLawyer = async (requestData) => {
    console.log('🔍 === START sendRequestToLawyer ===');
    
    if (!requestData.caseSummary?.trim()) {
      console.log('❌ Case summary is empty');
      alert('Please provide a case summary');
      return;
    }

    if (!requestData.caseType) {
      console.log('❌ Case type not selected');
      alert('Please select a case type');
      return;
    }

    if (!requestData.lawyer) {
      console.log('❌ No lawyer selected');
      alert('No lawyer selected');
      return;
    }

    console.log('✅ All validations passed');
    console.log('📤 Request data:', {
      lawyerId: requestData.lawyer.id,
      caseSummary: requestData.caseSummary,
      caseType: requestData.caseType,
      selectedLawyerName: requestData.lawyer.name
    });

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      
      if (!token) {
        alert('Please log in again');
        return;
      }

      const requestPayload = {
        lawyerId: requestData.lawyer.id,
        caseSummary: requestData.caseSummary,
        caseType: requestData.caseType
      };

      console.log('🚀 Sending POST request to /api/requests/send...');
      
      const response = await fetch(`${API_BASE_URL}/api/requests/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        
        if (response.status === 404) {
          throw new Error('Request endpoint not found (404). Check if server routes are properly set up.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else {
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('📦 API Response data:', data);

      if (data.success) {
        console.log('✅ Request sent successfully!');
        alert(`✅ Request sent successfully to ${requestData.lawyer.name}! They will contact you soon.`);
        setShowRequestModal(false);
        setCaseSummary('');
        setCaseType('');
        setSelectedLawyer(null);
      } else {
        console.error('❌ API returned error:', data.error);
        throw new Error(data.error || 'Failed to send request');
      }
    } catch (error) {
      console.error('💥 Network/Request error:', error);
      alert(`❌ Failed to send request: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      console.log('🔍 === END sendRequestToLawyer ===');
    }
  };

  const handleSubmitRequest = async () => {
    const requestData = {
      lawyer: selectedLawyer,
      caseSummary: caseSummary,
      caseType: caseType
    };
    
    await sendRequestToLawyer(requestData);
  };

  const renderClientPaymentScreen = () => (
    <div className={styles.paymentOverlay}>
      <div className={styles.paymentModalNew}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>One-Time Client Registration Fee</h1>
            <p>Pay ₹{PRICING.CLIENT.BASIC.price} once to send unlimited case requests to lawyers! No recurring fees.</p>
            
            {clientRequestDataBeforePayment && (
              <div className={styles.paymentRequiredNotice}>
                <h5>💰 Payment Required to Send Request</h5>
                <p>You need to complete the one-time payment to send case requests to lawyers.</p>
                <p><strong>After payment, you can send your request to {clientRequestDataBeforePayment.lawyer.name}</strong></p>
              </div>
            )}
          </div>
          
          <div className={`${styles.card} ${styles.pricingCard} ${styles.clientPricing}`}>
            <h2>{PRICING.CLIENT.BASIC.name}</h2>
            <div className={styles.priceTag}>₹{PRICING.CLIENT.BASIC.price}</div>
            <div className={styles.pricePeriod}>One-time payment • Lifetime access</div>
            
            <ul className={styles.features}>
              {PRICING.CLIENT.BASIC.features.map((feature, index) => (
                <li key={index}><i className="fas fa-check-circle"></i> {feature}</li>
              ))}
            </ul>
          </div>
          
          <div className={`${styles.card} ${styles.formCard}`}>
            <div className={styles.paymentSummary}>
              <h3>Payment Summary</h3>
              <div className={styles.paymentRow}>
                <span>One-time registration fee:</span>
                <span>₹{PRICING.CLIENT.BASIC.price}.00</span>
              </div>
              <div className={styles.paymentRow}>
                <span>Tax:</span>
                <span>₹0.00</span>
              </div>
              <div className={`${styles.paymentRow} ${styles.total}`}>
                <span>Total Amount:</span>
                <span>₹{PRICING.CLIENT.BASIC.price}.00</span>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer', gap: '8px', fontSize: '14px', lineHeight: '1.4' }}>
                <input type="checkbox" style={{ display: 'inline-block', width: '16px', height: '16px', minWidth: '16px', marginTop: '2px', cursor: 'pointer' }} required />
                <span style={{ flex: 1 }}>
                  I agree to the <a href="#" style={{ color: '#4CAF50', textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: '#4CAF50', textDecoration: 'none' }}>Privacy Policy</a>
                </span>
              </label>
            </div>
            
            <button 
              className={`${styles.btn} ${styles.btnPrimary} ${styles.clientPayBtn}`}
              onClick={() => initiateClientPayment(clientRequestDataBeforePayment)}
              disabled={clientPaymentLoading}
            >
              {clientPaymentLoading ? (
                <>
                  <div className={styles.loadingSpinnerSmall}></div>
                  Processing...
                </>
              ) : (
                `Pay Now - ₹${PRICING.CLIENT.BASIC.price}`
              )}
            </button>
          </div>
        </div>

        <button 
          className={styles.closeBtnNew}
          onClick={() => {
            setShowClientPayment(false);
            setClientRequestDataBeforePayment(null);
          }}
          disabled={clientPaymentLoading}
        >
          ✕
        </button>
      </div>
    </div>
  );

  const resetFilters = () => {
    setSelectedState('');
    setSelectedSpeciality('');
    setSelectedRating('');
    setSortBy('');
    setOtherLawyersToShow(10);
  };

  const states = [...new Set(allLawyers.map(lawyer => lawyer.location))];
  const specialities = [...new Set(allLawyers.flatMap(lawyer => lawyer.speciality))];

  const renderStars = (rating) => {
    return (
      <div className={styles.ratingStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${styles.star} ${star <= rating ? styles.filled : ''}`}
          >
            ★
          </span>
        ))}
        <span className={styles.ratingText}>({rating.toFixed(1)})</span>
      </div>
    );
  };

  // LawyerCard Component with scoped styles
  const LawyerCard = ({ lawyer, isTeamLawyer = false, onSendRequest }) => (
    <div key={lawyer.id} className={styles.darkCard}>
      <div className={styles.cardGlow}></div>
      
      {isTeamLawyer && (
        <div className={styles.teamLawyerBadge}>
          <span className={styles.badgeIcon}>⭐</span>
          LegalMitra Team
        </div>
      )}
      
      {!isTeamLawyer && (
        <div className={styles.verifiedBadge}>
          <span className={styles.badgeIcon}>✓</span>
          LegalMitra Verified
        </div>
      )}
      
      <div className={styles.cardHeader}>
        <div className={styles.avatarContainer}>
          <div className={styles.avatar}>
            {lawyer.gender === 'F' ? (
              <div className={styles.femaleAvatar}>
                <span className={styles.genderIcon}>♀</span>
              </div>
            ) : (
              <div className={styles.maleAvatar}>
                <span className={styles.genderIcon}>♂</span>
              </div>
            )}
            <div className={styles.experienceTag}>{lawyer.experience}+ years</div>
          </div>
        </div>
        
        <div className={styles.lawyerMainInfo}>
          <h3 className={styles.lawyerName}>{lawyer.name}</h3>
          <div className={styles.locationInfo}>
            <span className={styles.locationIcon}>📍</span>
            {lawyer.location}
          </div>
          {renderStars(lawyer.rating)}
          
          {isTeamLawyer && lawyer.joinDate && (
            <div className={styles.teamJoinInfo}>
              <span className={styles.teamIcon}>🤝</span>
              Team member since {new Date(lawyer.joinDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.expertiseSection}>
          <h4>Areas of Expertise</h4>
          <div className={styles.expertiseTags}>
            {lawyer.speciality.map(spec => (
              <span key={spec} className={styles.expertiseTag}>{spec}</span>
            ))}
          </div>
        </div>

        <div className={styles.detailsSection}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Jurisdiction:</span>
            <span className={styles.detailValue}>{lawyer.jurisdiction}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Client Type:</span>
            <span className={styles.detailValue}>{lawyer.clientType}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Avg Case Duration:</span>
            <span className={styles.detailValue}>{lawyer.avgDaysOfCompletion} days</span>
          </div>
          
          {isTeamLawyer && lawyer.barCouncilNumber && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Bar Council:</span>
              <span className={styles.detailValue}>{lawyer.barCouncilNumber}</span>
            </div>
          )}
        </div>

        <div className={styles.languagesSection}>
          <h4>Languages</h4>
          <div className={styles.languageTags}>
            {lawyer.languages.map(lang => (
              <span key={lang} className={styles.languageTag}>{lang}</span>
            ))}
          </div>
        </div>

        {isTeamLawyer && (
          <div className={styles.actionSection}>
            <button
              className={styles.sendRequestBtn}
              onClick={(e) => {
                e.stopPropagation();
                console.log('🟡 === SEND REQUEST BUTTON CLICKED ===');
                console.log('🟡 Lawyer:', lawyer.name);
                if (onSendRequest) {
                  console.log('🟡 Calling onSendRequest...');
                  onSendRequest(lawyer);
                } else {
                  console.log('🟥 onSendRequest is undefined!');
                }
              }}
            >
              📨 Send Request
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.findLawyerDark}>
      <div className={styles.darkHeader}>
        <div className={styles.headerContent}>
          <h1>Find Your Legal Expert</h1>
          <p>Connect with verified legal professionals across India</p>
          <div className={styles.headerStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{teamLawyers.length + otherLawyers.length}+</span>
              <span className={styles.statLabel}>Total Lawyers</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{specialities.length}+</span>
              <span className={styles.statLabel}>Legal Specialities</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{states.length}+</span>
              <span className={styles.statLabel}>Cities Covered</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{teamLawyers.length}</span>
              <span className={styles.statLabel}>Team Lawyers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shared Filter Section */}
      <div className={styles.darkFilterSection}>
        <div className={styles.filterContainer}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label>📍 Location</label>
              <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                <option value="">All Locations</option>
                {states.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>⚖ Speciality</label>
              <select value={selectedSpeciality} onChange={(e) => setSelectedSpeciality(e.target.value)}>
                <option value="">All Specialities</option>
                {specialities.map(spec => <option key={spec} value={spec}>{spec}</option>)}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>⭐ Rating</label>
              <select value={selectedRating} onChange={(e) => setSelectedRating(e.target.value)}>
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>📊 Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="">Rating (High to Low)</option>
                <option value="experience-high">Experience (High to Low)</option>
                <option value="experience-low">Experience (Low to High)</option>
                <option value="rating-high">Rating (High to Low)</option>
                <option value="rating-low">Rating (Low to High)</option>
              </select>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button className={styles.resetBtn} onClick={resetFilters}>
              Reset All Filters
            </button>
            <div className={styles.resultsCount}>
              <span className={styles.countBadge}>{filteredTeamLawyers.length + filteredOtherLawyers.length}</span>
              lawyers found
              <span className={styles.teamCount}> ({filteredTeamLawyers.length} team, {filteredOtherLawyers.length} other)</span>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showClientPayment && renderClientPaymentScreen()}

      {/* REQUEST MODAL */}
      {showRequestModal && selectedLawyer && (
        <div className={styles.modalOverlay}>
          <div className={styles.requestModal}>
            <div className={styles.modalHeader}>
              <h3>Send Request to {selectedLawyer.name}</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowRequestModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Case Type</label>
                <select 
                style={{backgroundColor:'black'}}
                  value={caseType} 
                  onChange={(e) => setCaseType(e.target.value)}
                  className={styles.caseTypeSelect}
                >
                  <option value="">Select Case Type</option>
                  <option value="Civil">Civil Case</option>
                  <option value="Criminal">Criminal Case</option>
                  <option value="Family">Family Matter</option>
                  <option value="Property">Property Dispute</option>
                  <option value="Corporate">Corporate Legal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Case Summary *</label>
                <textarea
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value)}
                  placeholder="Please describe your legal issue in detail. Include relevant facts, parties involved, and what you're seeking..."
                  rows="6"
                  className={styles.caseSummaryTextarea}
                />
                <div className={styles.charCount}>{caseSummary.length}/500 characters</div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.submitRequestBtn}
                onClick={handleSubmitRequest}
                disabled={isSubmitting || !caseSummary.trim()}
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading lawyers...</p>
        </div>
      ) : (
        <>
          {/* Section 1: LegalMitra Team Lawyers */}
          <div className={`${styles.lawyersSection} ${styles.teamLawyersSection}`}>
            <div className={styles.sectionHeaderWrapper}>
              <div className={styles.sectionHeaderContent}>
                <h2>
                  <span className={styles.sectionIcon}>⭐</span>
                  LegalMitra Team Lawyers
                </h2>
                <p>Verified professionals who are officially part of our legal network</p>
                <div className={styles.sectionStats}>
                  Showing {filteredTeamLawyers.length} of {teamLawyers.length} team lawyers
                </div>
              </div>
            </div>

            {filteredTeamLawyers.length > 0 ? (
              <div className={styles.darkGrid}>
                {filteredTeamLawyers.map((lawyer) => (
                  <LawyerCard key={lawyer.id} lawyer={lawyer} isTeamLawyer={true} onSendRequest={handleSendRequest} />
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>👥</div>
                <h3>No team lawyers found</h3>
                <p>Try adjusting your search criteria</p>
              </div>
            )}
          </div>

          {/* Section 2: Other Verified Lawyers */}
          <div className={`${styles.lawyersSection} ${styles.otherLawyersSection}`}>
            <div className={styles.sectionHeaderWrapper}>
              <div className={styles.sectionHeaderContent}>
                <h2>
                  <span className={styles.sectionIcon}>⚖️</span>
                  Other Verified Lawyers
                </h2>
                <p>Additional legal professionals available for consultation</p>
                <div className={styles.sectionStats}>
                  Showing {filteredOtherLawyers.length} of {otherLawyers.length} lawyers
                </div>
              </div>
            </div>

            {filteredOtherLawyers.length > 0 ? (
               <>
                <div className={styles.darkGrid}>
                  {filteredOtherLawyers.map((lawyer) => (
                    <LawyerCard key={lawyer.id} lawyer={lawyer} isTeamLawyer={false} />
                  ))}
                </div>
                
                {filteredOtherLawyers.length < otherLawyers.length && (
                  <div className={styles.loadMoreContainer}>
                    <button 
                      className={styles.loadMoreBtn}
                      onClick={loadMoreOtherLawyers}
                    >
                      Show 10 More Lawyers ({filteredOtherLawyers.length} of {otherLawyers.length} shown)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>🔍</div>
                <h3>No lawyers found</h3>
                <p>Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FindLawyer;