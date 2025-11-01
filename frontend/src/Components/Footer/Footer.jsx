// src/Components/Footer/Footer.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ADD THIS IMPORT
import './Footer.css';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const Footer = () => { // ✅ REMOVE setCurrentPage prop
  const navigate = useNavigate(); // ✅ ADD THIS HOOK

  const handleAdminLoginClick = (e) => {
    e.preventDefault();
    console.log('Footer: Admin login clicked');
    
    // ✅ USE REACT ROUTER NAVIGATION
    navigate('/admin-login');
  };

  // ✅ ADD HANDLERS FOR OTHER INTERNAL LINKS
  const handleInternalLinkClick = (path, e) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-columns">
          {/* Helpdesk Section */}
          <div className="footer-column">
            <h4>Helpdesk</h4>
            <div className="footer-links">
              {/* ✅ CONVERT INTERNAL LINKS TO USE NAVIGATION */}
              <a 
                href="/contact" 
                onClick={(e) => handleInternalLinkClick('/contact', e)}
              >
                📞 Contact Us
              </a>
              <a 
                href="/support" 
                onClick={(e) => handleInternalLinkClick('/support', e)}
              >
                💬 Support
              </a>
              <a 
                href="/faq" 
                onClick={(e) => handleInternalLinkClick('/faq', e)}
              >
                ❓ FAQ
              </a>
            </div>
          </div>

          {/* Important Links Section - Keep external links as is */}
          <div className="footer-column">
            <h4>Important Links</h4>
            <div className="footer-links">
              <a href="https://legalaffairs.gov.in/" target="_blank" rel="noopener noreferrer">
                🏛 Ministry of Law & Justice
              </a>
              <a href="https://districts.ecourts.gov.in/" target="_blank" rel="noopener noreferrer">
                ⚖ eCourts Services
              </a>
              <a href="https://www.legalservicesindia.com/" target="_blank" rel="noopener noreferrer">
                📜 Legal Services India
              </a>
              <a href="https://nalsa.gov.in/" target="_blank" rel="noopener noreferrer">
                🛡 NALSA
              </a>
              <a href="https://main.sci.gov.in/" target="_blank" rel="noopener noreferrer">
                🏛 Supreme Court of India
              </a>
            </div>
          </div>

          {/* Contact Information */}
          <div className="footer-column">
            <h4>Contact Info</h4>
            <div className="contact-info">
              <a href="mailto:pathakabhi290@gmail.com" className="contact-link">
                📧 pathakabhi290@gmail.com
              </a>
              <a href="mailto:anuragmishra5433@gmail.com" className="contact-link">
                📧 anuragmishra5433@gmail.com
              </a>
              <a href="tel:+917017331435" className="contact-link">
                📱 +91-7017331435
              </a>
              <a href="tel:+919267918534" className="contact-link">
                📱 +91-9267918534
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div className="footer-column">
            <h4>Connect With Us</h4>
            <div className="social-links">
              <a href="https://linkedin.com/in/abhishekpathakofficial" target="_blank" rel="noopener noreferrer">
                💼 LinkedIn
              </a>
              <a href="https://github.com/AbhishekPathak369" target="_blank" rel="noopener noreferrer">
                🐱 GitHub
              </a>
              <a href="https://twitter.com/yourprofile" target="_blank" rel="noopener noreferrer">
                🐦 Twitter
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="footer-bottom">
          <div className="footer-legal">
            {/* ✅ ADD INTERNAL NAVIGATION FOR LEGAL PAGES */}
            <a 
              href="#privacy" 
              onClick={(e) => handleInternalLinkClick('/privacy', e)}
            >
              Privacy
            </a>
            <a 
              href="#terms" 
              onClick={(e) => handleInternalLinkClick('/terms', e)}
            >
              Terms
            </a>
            <a 
              href="#cookies" 
              onClick={(e) => handleInternalLinkClick('/cookies', e)}
            >
              Cookies
            </a>
            {/* <span 
              className="admin-login-link"
              onClick={handleAdminLoginClick}
              title="Admin Login"
            >
              Admin
            </span> */}
          </div>
          <p className="copyright">© 2025 LegalMitra | Justice Made Accessible</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;