import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'law-sections', label: 'LegalPedia', path: '/law-sections' },
    { id: 'predict-bail', label: 'Predict Bail', path: '/predict-bail' },
    { id: 'my-collection', label: 'My Collection', path: '/my-collection' },
    { id: 'find-lawyer', label: 'Find a Lawyer', path: '/find-lawyer' },
    { id: 'faq', label: 'FAQ', path: '/faq' },
    { id: 'about', label: 'About Us', path: '/about' }
  ];

  const handleNavClick = (item) => {
    if (item.id === 'my-collection' && !user) {
      navigate('/login');
    } else {
      navigate(item.path);
    }
    setIsMenuOpen(false); // Close menu after navigation
  };

  // Determine active page from current route
  const getCurrentPageId = () => {
    const currentPath = location.pathname;
    const item = navItems.find(navItem => navItem.path === currentPath);
    return item ? item.id : 'home';
  };

  const currentPage = getCurrentPageId();

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Hamburger Menu Button - Only visible on mobile */}
        <button 
          className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Desktop Navigation */}
        <div className="desktop-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`mobile-nav-link ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;