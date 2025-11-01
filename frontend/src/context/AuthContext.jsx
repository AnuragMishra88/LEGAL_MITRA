import React, { createContext, useState, useContext, useEffect } from 'react';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const CLOUDINARY_CLOUD_NAME = 'dwua2kvwe';
  const CLOUDINARY_UPLOAD_PRESET = 'legalmitra_avatars';

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      refreshUser();
    }
    setLoading(false);
  }, []);

  

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
      // Force a complete reset by reloading the page
  window.location.href = '/'; // This will refresh the page
  };

  

  // Fixed Cloudinary upload function
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
    formData.append('folder', 'legalmitra/profiles');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  };


  // ADD this new function - don't change refreshUser
const refreshUserWithProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Use the new endpoint that includes profilePicture
    const response = await fetch(`${API_BASE_URL}/api/admin/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        
      }
    }
  } catch (error) {
    console.error('Error refreshing user with profile:', error);
  }
};

useEffect(() => {
  // Refresh user data with profile picture when component loads
  if (user && !user.profilePicture) {
    refreshUserWithProfile();
  }
}, [user, refreshUserWithProfile]);


  // Fixed: Update user profile picture
  // Update user profile picture
const updateProfilePicture = async (file) => {
  try {
    console.log('🔄 1. Starting profile picture update...');
    
    // 1. Upload to Cloudinary
    console.log('🔄 2. Uploading to Cloudinary...');
    const cloudinaryResult = await uploadToCloudinary(file);
    console.log('✅ 3. Cloudinary upload successful:', cloudinaryResult.secure_url);
    
    // 2. Update profile
    const token = localStorage.getItem('token');
    console.log('🔄 4. Sending to backend...');
    
    const response = await fetch(`${API_BASE_URL}/api/admin/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        profilePicture: cloudinaryResult.secure_url
      })
    });

    console.log('📡 5. Backend response status:', response.status);
    
    const data = await response.json();
    console.log('📦 6. Backend response data:', data);

    if (data.success && data.user) {
      console.log('✅ 7. Backend update successful');
      console.log('🖼️ New profile picture in response:', data.user.profilePicture);
      
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('✅ 8. Frontend state updated');
      return data.user;
    } else {
      throw new Error(data.message || 'Failed to update profile');
    }
  } catch (error) {
    console.error('❌ Error updating profile picture:', error);
    throw error;
  }
};

  const value = {
    user,
    login,
    logout,
    loading,
    refreshUser,
    updateProfilePicture,
    refreshUserWithProfile, // Add new one
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};