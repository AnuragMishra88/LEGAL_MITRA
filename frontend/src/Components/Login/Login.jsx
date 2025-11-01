import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ADD THIS IMPORT
import { useAuth } from '../../context/AuthContext';
import './Login.css';
import logo from '../../assets/logo.png';
const API_BASE_URL = import.meta.env.VITE_API_URL;
const Login = () => { // ✅ REMOVE setCurrentPage prop
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate(); // ✅ ADD THIS HOOK

  // ✅ USE REACT ROUTER NAVIGATION
  const handleBackToHome = () => {
    navigate('/');
  };

  const handleGoToRegister = () => {
    navigate('/register');
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
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Use AuthContext to update global state
        login(data.user, data.token);
        
        // ✅ USE REACT ROUTER NAVIGATION
        navigate('/my-collection');
      } else {
        setErrors({ submit: data.msg || 'Login failed' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = () => {
    setIsLoading(true);
    
    // Configure your Google OAuth parameters
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id';
    const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`;
    const scope = 'email profile';
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    // Redirect to Google OAuth
    window.location.href = googleAuthUrl;
  };

  // LinkedIn OAuth Login
  const handleLinkedInLogin = () => {
    setIsLoading(true);
    
    // Configure your LinkedIn OAuth parameters
    const clientId = process.env.REACT_APP_LINKEDIN_CLIENT_ID || 'your-linkedin-client-id';
    const redirectUri = process.env.REACT_APP_LINKEDIN_REDIRECT_URI || `${window.location.origin}/auth/linkedin/callback`;
    const scope = 'r_liteprofile r_emailaddress';
    
    const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}`;

    // Redirect to LinkedIn OAuth
    window.location.href = linkedInAuthUrl;
  };

  // Alternative: Backend-initiated OAuth (Recommended)
  const handleSocialLogin = async (provider) => {
    setIsLoading(true);
    
    try {
      // This endpoint should return the OAuth URL from your backend
      const response = await fetch(`http://localhost:5000/api/auth/${provider}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setErrors({ submit: `Failed to initiate ${provider} login` });
        setIsLoading(false);
      }
    } catch (error) {
      setErrors({ submit: `Network error. Please try again.` });
      setIsLoading(false);
    }
  };

  // ✅ ADD BACK BUTTON COMPONENT
  const BackButton = () => (
    <button 
      className="back-button"
      onClick={handleBackToHome}
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'none',
        border: 'none',
        fontSize: '16px',
        cursor: 'pointer',
        color: '#666',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      ← Back to Home
    </button>
  );

  return (
    <div className="login-container">
      <BackButton /> {/* ✅ ADD BACK BUTTON */}
      
      <div className="login-card">
        <div className="login-welcome">
          <div className="welcome-content">
            <img src={logo} height={100} width={100} alt="LegalMitra Logo" />
            <h1>Welcome Back</h1>
            <p>Sign in to continue your legal journey with LegalMitra</p>
            <div className="benefits">
              <div className="benefit">
                <span className="benefit-icon">⚡</span>
                Quick Access to Your Cases
              </div>
              <div className="benefit">
                <span className="benefit-icon">🔐</span>
                Secure Legal Documents
              </div>
              <div className="benefit">
                <span className="benefit-icon">💼</span>
                Professional Network
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-section">
          <div className="form-container">
            <div className="form-header" style={{ display: 'block' }}>
              <h2 style={{ display: 'block' }}>Sign In</h2>
              <p style={{ display: 'block' }}>Enter your credentials to access your account</p>
            </div>

            {errors.submit && (
              <div className="error-message">
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit}>
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
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  Remember me
                </label>
                <a href="#" className="forgot-password">
                  Forgot password?
                </a>
              </div>

              <button 
                type="submit" 
                className="login-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="divider">
              <span>Or continue with</span>
            </div>

            <div className="social-login">
              <button 
                className="social-btn google-btn"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <span>Google</span>
              </button>
              <button 
                className="social-btn linkedin-btn"
                onClick={() => handleSocialLogin('linkedin')}
                disabled={isLoading}
              >
                <span>LinkedIn</span>
              </button>
            </div>

            <div className="signup-link">
              Don't have an account?{' '}
              <button onClick={handleGoToRegister} className="link-btn">
                Sign up here
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;