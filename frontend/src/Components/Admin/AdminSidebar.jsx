import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminSidebar.css';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const sections = [
    { id: 'dashboard', title: 'Dashboard Overview', icon: '📊', path: '/admin-dashboard' },
    { id: 'users', title: 'User Management', icon: '👥', path: '/admin-dashboard/users' },
    { id: 'verification', title: 'Content & Verification', icon: '⚖️', path: '/admin-dashboard/verification' },
    { id: 'analytics', title: 'Analytics & Settings', icon: '📈', path: '/admin-dashboard/analytics' }
  ];

  const getActiveSection = () => {
    const currentPath = location.pathname;
    const section = sections.find(s => currentPath.startsWith(s.path));
    return section ? section.id : 'dashboard';
  };

  const activeSection = getActiveSection();

  return (
    <div className="admin-sidebar">
      <nav className="admin-nav">
        {sections.map(section => (
          <div 
            key={section.id}
            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => navigate(section.path)}
          >
            <span className="nav-icon">{section.icon}</span>
            <span>{section.title}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;