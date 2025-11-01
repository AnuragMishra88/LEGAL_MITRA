import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ADD THIS IMPORT
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './AdminLogin.css';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const API_URL = `${API_BASE_URL}/api/auth`;

const AdminLogin = () => { // ✅ REMOVE setCurrentPage prop
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate(); // ✅ ADD THIS HOOK

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { email, password } = credentials; // ✅ USE STATE VALUES INSTEAD OF HARDCODED

    console.log('Attempting login with:', email, password);
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { user, token } = response.data;
      
      if (user.role !== 'admin') {
        setError('Login successful, but this user is not an administrator.');
        setIsLoading(false);
        return;
      }

      login(user, token); 

      // ✅ USE REACT ROUTER NAVIGATION INSTEAD OF setCurrentPage
      navigate('/admin-dashboard');

    } catch (err) {
      console.error('Admin Login Error:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.msg || err.response?.data?.error || 'Login failed. Server unreachable or invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ADD BACK BUTTON HANDLER
  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <h2>Admin Login</h2>
        
        {/* ✅ ADD BACK BUTTON */}
        <button 
          className="back-button"
          onClick={handleBackToHome}
          style={{
            position: 'absolute',
            top: '15px',
            left: '15px',
            background: '#f0f0f0',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="Enter admin email (e.g., admin@lawconnect.com)"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter admin password"
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="admin-login-btn" disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Login as Admin'}
          </button>
        </form>
        
        
      </div>
    </div>
  );
};

export default AdminLogin;