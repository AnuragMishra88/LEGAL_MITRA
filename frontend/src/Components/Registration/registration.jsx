import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ADD THIS IMPORT
import { useAuth } from '../../context/AuthContext';
import './registration.css';
import logo from '../../assets/logo.png';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const Registration = () => { // ✅ REMOVE setCurrentPage prop
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    // Lawyer-specific fields
    specialization: '',
    experience: '',
    barCouncilNumber: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate(); // ✅ ADD THIS HOOK

  // ✅ USE REACT ROUTER NAVIGATION
  const handleBackToHome = () => {
    navigate('/');
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
    if (errors[id]) {
      setErrors(prevState => ({
        ...prevState,
        [id]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    // Lawyer-specific validations
    if (formData.role === 'lawyer') {
      if (!formData.specialization) {
        newErrors.specialization = 'Specialization is required';
      }
      if (!formData.experience) {
        newErrors.experience = 'Experience is required';
      } else if (formData.experience < 0) {
        newErrors.experience = 'Experience cannot be negative';
      }
      if (!formData.barCouncilNumber) {
        newErrors.barCouncilNumber = 'Bar Council Number is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // SIMPLE data that matches backend
      const registrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      // Add lawyer fields only if lawyer
      if (formData.role === 'lawyer') {
        registrationData.specialization = formData.specialization;
        registrationData.experience = Number(formData.experience);
        registrationData.barCouncilNumber = formData.barCouncilNumber;
        registrationData.phone = formData.phone || '';
        registrationData.address = formData.address || '';
      }

      console.log('🚀 Sending registration data:', registrationData);

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();
      console.log('📥 Server response:', data);

      if (response.ok) {
        setMessage(data.message || 'Registration successful! Redirecting to login...');
        setTimeout(() => {
          // ✅ USE REACT ROUTER NAVIGATION
          navigate('/login');
        }, 2000);
      } else {
        setMessage(data.error || data.msg || `Registration failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ADD LOGIN NAVIGATION HANDLER
  const handleGoToLogin = () => {
    navigate('/login');
  };

  const specializations = [
    'Criminal Law',
    'Civil Law',
    'Corporate Law',
    'Family Law',
    'Property Law',
    'Labor Law',
    'Tax Law',
    'Cyber Law',
    'Intellectual Property',
    'Consumer Law',
    'Constitutional Law',
    'Environmental Law'
  ];

  return (
    <div className="registration-container">
      <div className="registration-card">
        <div className="registration-hero">
          <div className="hero-content">
            <img src={logo} height={100} width={100} alt="LegalMitra Logo" />
            <h1>Join LegalMitra</h1>
            <p>Your trusted legal partner for comprehensive legal solutions</p>
            <div className="features">
              <div className="feature">
                <span className="feature-icon">⚖️</span>
                Legal Expertise
              </div>
              <div className="feature">
                <span className="feature-icon">🔒</span>
                Secure & Private
              </div>
              <div className="feature">
                <span className="feature-icon">🚀</span>
                Fast & Efficient
              </div>
            </div>
          </div>
        </div>
        
        <div className="registration-form">
          <button className="back-btn" onClick={handleBackToHome}>
            ← Back to Home
          </button>
          
          <div className="form-header" style={{ display: 'block' }}>
            <h2 style={{ display: 'block' }}>Create Account</h2>
            <p style={{ display: 'block' }}>Sign up to get started with LegalMitra</p>
          </div>

          {message && (
            <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name" 
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email" 
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                type="password" 
                id="password" 
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="role">User Role</label>
              <select 
                id="role" 
                value={formData.role}
                onChange={handleChange}
              >
                <option value="">Select Role</option>
                <option value="client">Client</option>
                <option value="lawyer">Lawyer</option>
              </select>
              {errors.role && <span className="error-text">{errors.role}</span>}
            </div>

            {/* Lawyer-specific fields - only show when role is lawyer */}
            {formData.role === 'lawyer' && (
              <div className="lawyer-fields">
                <div className="form-section-divider">
                  <span>Professional Information</span>
                </div>
                
                <div className="form-group">
                  <label htmlFor="specialization">Specialization</label>
                  <select 
                    id="specialization" 
                    value={formData.specialization}
                    onChange={handleChange}
                  >
                    <option value="">Select Specialization</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                  {errors.specialization && <span className="error-text">{errors.specialization}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="experience">Years of Experience</label>
                    <input 
                      type="number" 
                      id="experience" 
                      placeholder="e.g., 5"
                      min="0"
                      max="50"
                      value={formData.experience}
                      onChange={handleChange}
                    />
                    {errors.experience && <span className="error-text">{errors.experience}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="barCouncilNumber">Bar Council Number</label>
                  <input 
                    type="text" 
                    id="barCouncilNumber" 
                    placeholder="e.g., MH/1254/2020"
                    value={formData.barCouncilNumber}
                    onChange={handleChange}
                  />
                  {errors.barCouncilNumber && <span className="error-text">{errors.barCouncilNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="address">Office Address</label>
                  <textarea 
                    id="address" 
                    placeholder="Enter your office address..."
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="login-link">
            Already have an account?{' '}
            <button 
              onClick={handleGoToLogin} // ✅ USE ROUTER NAVIGATION
              className="link-btn"
            >
              Sign in here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;