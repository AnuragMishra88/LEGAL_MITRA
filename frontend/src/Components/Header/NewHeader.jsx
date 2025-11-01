import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // ✅ ADD THIS IMPORT
import logoImage from '../../assets/logo.png'; 
const API_BASE_URL = import.meta.env.VITE_API_URL;
import userAvatar from '../../assets/default-avatar.png';

const NewHeader = () => { // ✅ REMOVE setCurrentPage prop
  const { user, logout, updateProfilePicture, refreshUserWithProfile } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); // ✅ ADD THIS HOOK

  const NAVY_BLUE = '#1b2d48'; 
  const VIBRANT_RED = 'red'; 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    try {
      setUploading(true);
      await updateProfilePicture(file);
      await refreshUserWithProfile();
      setDropdownOpen(false); // Close dropdown after upload
    } catch (error) {
      alert('Failed to upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleProfilePicClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const headerStyle = {
    width: '100%',
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '15px 40px', 
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxSizing: 'border-box'
  };

  const combinedLogoStyle = {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '8px',
  };

  const logoImageStyle = {
    height: '35px', 
    width: 'auto', 
  };
  
  const logoTextStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2563eb',
  };

  const buttonsStyle = {
    display: 'flex',
    gap: '15px'
  };

  const buttonStyle = {
    padding: '8px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600'
  };

  const loginStyle = {
    ...buttonStyle,
    backgroundColor: VIBRANT_RED,
    color: 'white',
    border: 'none' 
  };

  const signupStyle = {
    ...buttonStyle,
    backgroundColor: 'white',
    color: NAVY_BLUE,
    border: `2px solid ${NAVY_BLUE}`,
  };

  const userMenuStyle = {
    position: 'relative',
  };

  const userProfileBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
  };

  const profilePicStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  };

  const dropdownMenuStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    minWidth: '150px',
    zIndex: 1000,
  };

  const dropdownItemStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  };

  // ✅ UPDATED NAVIGATION HANDLERS - USING REACT ROUTER
  const handleSignUpClick = () => {
    navigate('/register'); // ✅ CHANGED
  };

  const handleLoginClick = () => {
    navigate('/login'); // ✅ CHANGED
  };

  const handleAdminLoginClick = () => {
    navigate('/admin-login'); // ✅ CHANGED
  };
  
  const handleLogoClick = () => {
    navigate('/'); // ✅ CHANGED
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/'); // ✅ CHANGED
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate('/profile'); // ✅ CHANGED
  };

  const handleAdminDashboardClick = () => {
    setDropdownOpen(false);
    navigate('/admin-dashboard'); // ✅ CHANGED
  };

  return (
    <div style={headerStyle}>
      <div style={combinedLogoStyle} onClick={handleLogoClick}>
        <img 
          src={logoImage} 
          alt="Judicial Scale Logo" 
          style={logoImageStyle} 
        />
        <div style={logoTextStyle}>
          Legal<span style={{color: VIBRANT_RED}}>Mitra</span>
        </div>
      </div>
      
      <div style={buttonsStyle}>
        {user ? (
          <div style={userMenuStyle} ref={dropdownRef}>
            <button 
              style={userProfileBtnStyle}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <img 
                src={user?.profilePicture || userAvatar} 
                alt="Profile" 
                style={{
                  ...profilePicStyle,
                  opacity: uploading ? 0.7 : 1
                }}
                onError={(e) => {
                  e.target.src = userAvatar;
                }}
              />
              <span>{user.name}</span>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </button>
            
            {dropdownOpen && (
              <div style={dropdownMenuStyle}>
                <button 
                  style={dropdownItemStyle}
                  onClick={handleProfileClick}
                >
                  My Profile
                </button>
                
                <button 
                  style={dropdownItemStyle}
                  onClick={handleProfilePicClick}
                >
                  Change Photo
                </button>
                
                {user.role === 'admin' && (
                  <button 
                    style={dropdownItemStyle}
                    onClick={handleAdminDashboardClick}
                  >
                    🛠️ Admin Dashboard
                  </button>
                )}
                
                <button 
                  style={dropdownItemStyle}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button style={loginStyle} onClick={handleLoginClick}>Login</button>
            <button style={signupStyle} onClick={handleSignUpClick}>Sign Up</button>
          </>
        )}
      </div>
    </div>
  );
};

export default NewHeader;