import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import defaultAvatar from '../../../assets/default-avatar.png';
import './ProfilePage.css';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProfilePage = () => {
  const { user, loading, updateProfilePicture, refreshUserWithProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});


  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  useEffect(() => {
    console.log('🔍 CURRENT USER DATA:', user);
    console.log('🖼 Profile Picture URL:', user?.profilePicture);
    console.log('📝 Using default avatar?', !user?.profilePicture);
    
    // Initialize edit form with user data
    if (user && !isEditing) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        specialization: user.specialization || '',
        experience: user.experience || '',
        barCouncilNumber: user.barCouncilNumber || ''
      });
    }
  }, [user, isEditing]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Please select an image smaller than 5MB');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');
      
      await updateProfilePicture(file);
      await refreshUserWithProfile();
      
    } catch (error) {
      setUploadError('Failed to upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleAvatarClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveDetails = async () => {
    try {
      setSaveLoading(true);
      setSaveError('');
      setSaveSuccess('');

      // Validate required fields
      if (!editForm.name?.trim()) {
        setSaveError('Full name is required');
        return;
      }

      // For lawyers, validate professional fields
      if (user?.role === 'lawyer') {
        if (!editForm.specialization?.trim()) {
          setSaveError('Specialization is required for lawyers');
          return;
        }
        if (!editForm.barCouncilNumber?.trim()) {
          setSaveError('Bar Council Number is required for lawyers');
          return;
        }
        if (!editForm.experience || editForm.experience < 0) {
          setSaveError('Please enter valid years of experience');
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (response.ok) {
        setSaveSuccess('Profile updated successfully!');
        await refreshUserWithProfile(); // Refresh user data
        setTimeout(() => {
          setIsEditing(false);
          setSaveSuccess('');
        }, 2000);
      } else {
        setSaveError(data.msg || 'Failed to update profile');
      }
    } catch (error) {
      setSaveError('Network error. Please try again.');
      console.error('Update error:', error);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to original user data
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      specialization: user.specialization || '',
      experience: user.experience || '',
      barCouncilNumber: user.barCouncilNumber || ''
    });
    setIsEditing(false);
    setSaveError('');
    setSaveSuccess('');
  };

  const clearError = () => {
    setUploadError('');
    setSaveError('');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format status with proper capitalization
  const formatStatus = (status) => {
    if (!status) return 'Not available';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Loading state
  if (loading) {
    return (
      <div className="profile-page-dark">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <h3>Loading Your Profile</h3>
          <p>Please wait while we fetch your information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page-dark">
        <div className="no-user">
          <div className="no-user-icon">👤</div>
          <h3>No User Found</h3>
          <p>Please log in to view your profile information</p>
          <button className="login-btn" onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-dark">
      <div className="profile-container">
        {(uploadError || saveError) && (
          <div className="upload-error-alert">
            <span>{uploadError || saveError}</span>
            <button className="error-close-btn" onClick={clearError}>×</button>
          </div>
        )}

        {saveSuccess && (
          <div className="save-success-alert">
            <span>{saveSuccess}</span>
          </div>
        )}

        <div className="profile-header">
          <h1>My Profile</h1>
          <button 
            className={`edit-details-btn ${isEditing ? 'editing' : ''}`}
            onClick={handleEditToggle}
          >
            {isEditing ? 'Cancel Editing' : '🖊 Edit Details'}
          </button>
        </div>

        <div className="profile-card">
          {/* Profile Header Section */}
          <div className="profile-header-section">
            <div className="avatar-container">
              <div className="avatar-glow"></div>
              <div 
                className={`avatar-wrapper ${uploading ? 'uploading' : ''}`}
                onClick={handleAvatarClick}
              >
                <img 
                  src={user?.profilePicture || defaultAvatar} 
                  alt="Profile" 
                  className="profile-avatar"
                  onError={(e) => {
                    console.log('❌ Image failed to load, using default avatar');
                    e.target.src = defaultAvatar;
                  }}
                />
                {uploading && (
                  <div className="upload-overlay">
                    <div className="upload-spinner"></div>
                    <span>Uploading...</span>
                  </div>
                )}
                {!uploading && (
                  <div className="edit-overlay">
                    <span>✏ Edit</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
            
            <div className="profile-basic-info">
              <h2 className="profile-name">{user?.name || 'Not provided'}</h2>
              <p className="profile-role">
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
              </p>
              <p className="profile-location">
                📍 {user?.address || 'Location not provided'}
              </p>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="section">
            <h3 className="section-title">Personal Information</h3>
            <div className="details-grid">
              <div className="detail-group">
                <span className="detail-label">Full Name</span>
                {isEditing ? (
                  <input
                    type="text"
                    className="edit-input"
                    value={editForm.name}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <span className="detail-value">{user?.name || 'Not provided'}</span>
                )}
              </div>

              <div className="detail-group">
                <span className="detail-label">Email Address</span>
                <span className="detail-value email-disabled">{user?.email || 'Not provided'}</span>
              </div>

              <div className="detail-group">
                <span className="detail-label">User Role</span>
                <span className="detail-value">
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Not provided'}
                </span>
              </div>

              <div className="detail-group">
                <span className="detail-label">Phone Number</span>
                {isEditing ? (
                  <input
                    type="tel"
                    className="edit-input"
                    value={editForm.phone}
                    onChange={(e) => handleEditChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <span className="detail-value">{user?.phone || 'Not provided'}</span>
                )}
              </div>

              <div className="detail-group">
                <span className="detail-label">Account Status</span>
                <span className={`detail-value status ${user?.isActive ? 'active' : 'inactive'}`}>
                  {user?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="detail-group">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">{formatDate(user?.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="section">
            <h3 className="section-title">Address</h3>
            <div className="details-grid">
              <div className="detail-group full-width">
                <span className="detail-label">Address</span>
                {isEditing ? (
                  <textarea
                    className="edit-textarea"
                    value={editForm.address}
                    onChange={(e) => handleEditChange('address', e.target.value)}
                    placeholder="Enter your address"
                    rows="3"
                  />
                ) : (
                  <span className="detail-value">{user?.address || 'Not provided'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Last Active Section */}
          <div className="section">
            <h3 className="section-title">Account Information</h3>
            <div className="details-grid">
              <div className="detail-group">
                <span className="detail-label">Last Active</span>
                <span className="detail-value">{formatDate(user?.lastActive)}</span>
              </div>
            </div>
          </div>

          {/* Lawyer Specific Information */}
          {user?.role === 'lawyer' && (
            <div className="section">
              <h3 className="section-title">Professional Information</h3>
              <div className="details-grid">
                <div className="detail-group">
                  <span className="detail-label">Specialization</span>
                  {isEditing ? (
                    <select
                      className="edit-select"
                      value={editForm.specialization}
                      onChange={(e) => handleEditChange('specialization', e.target.value)}
                    >
                      <option value="">Select Specialization</option>
                      <option value="Criminal Law">Criminal Law</option>
                      <option value="Civil Law">Civil Law</option>
                      <option value="Corporate Law">Corporate Law</option>
                      <option value="Family Law">Family Law</option>
                      <option value="Property Law">Property Law</option>
                      <option value="Labor Law">Labor Law</option>
                      <option value="Tax Law">Tax Law</option>
                      <option value="Cyber Law">Cyber Law</option>
                      <option value="Intellectual Property">Intellectual Property</option>
                      <option value="Consumer Law">Consumer Law</option>
                      <option value="Constitutional Law">Constitutional Law</option>
                      <option value="Environmental Law">Environmental Law</option>
                    </select>
                  ) : (
                    <span className="detail-value">{user?.specialization || 'Not provided'}</span>
                  )}
                </div>

                <div className="detail-group">
                  <span className="detail-label">Experience</span>
                  {isEditing ? (
                    <input
                      type="number"
                      className="edit-input"
                      value={editForm.experience}
                      onChange={(e) => handleEditChange('experience', e.target.value)}
                      placeholder="Years of experience"
                      min="0"
                      max="50"
                    />
                  ) : (
                    <span className="detail-value">
                      {user?.experience ? `${user.experience} years` : 'Not provided'}
                    </span>
                  )}
                </div>

                <div className="detail-group">
                  <span className="detail-label">Bar Council Number</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.barCouncilNumber}
                      onChange={(e) => handleEditChange('barCouncilNumber', e.target.value)}
                      placeholder="e.g., MH/1254/2020"
                    />
                  ) : (
                    <span className="detail-value">{user?.barCouncilNumber || 'Not provided'}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Save Button when editing */}
          {isEditing && (
            <div className="edit-actions">
              <button 
                className="save-btn"
                onClick={handleSaveDetails}
                disabled={saveLoading}
              >
                {saveLoading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;