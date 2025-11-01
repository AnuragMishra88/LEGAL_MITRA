import React, { useState } from 'react';
import './AboutUs.css';
import ContactForm from './ContactForm';
const API_BASE_URL = import.meta.env.VITE_API_URL;
const AboutUs = () => {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);

  const openContactForm = () => setIsContactFormOpen(true);
  const closeContactForm = () => setIsContactFormOpen(false);

  return (
    <div className="about-us-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">About LegalMitra</h1>
            <p className="hero-subtitle">
              Your Trusted Partner in Legal Innovation and Digital Justice Solutions
            </p>
            <div className="hero-decoration">
              <div className="decoration-line"></div>
              <div className="decoration-dot"></div>
              <div className="decoration-line"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Brief Section */}
      <section className="mission-brief">
        <div className="container">
          <div className="brief-content">
            <h2>Democratizing Legal Access Through Technology</h2>
            <p>
              LegalMitra bridges the gap between complex legal systems and everyday users by 
              providing intelligent tools, comprehensive legal databases, and seamless connections 
              between legal professionals and those seeking justice.
            </p>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="founders-section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', width: '100%' }}>
            <h2 style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}>Our Founders</h2>
          
          </div>
          
          <div className="founders-grid">
            {/* Founder 1 */}
            <div className="founder-card">
  <div className="founder-image">
    <div className="image-placeholder">
      {/* Replace with actual photo */}
      <img 
        src='../../../assets/abhi.jpg'
               alt="Abhishek Pathak" 
        className="founder-photo"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      <span className="initials" style={{display: 'none'}}>AP</span>
    </div>
    <div className="founder-badge">Co-Founder</div>
  </div>
              <div className="founder-info">
                <h3>Abhishek Pathak</h3>
                <p className="founder-role">Legal-Tech Entrepreneur & Developer</p>
                <div className="education-details">
                  <h4>Education</h4>
                  <ul>
                    <li>B.Tech in Computer Science - AKTU (Currently Pursuing)</li>
                    <li>Specialization in AI & Machine Learning</li>
                    <li>Legal Technology Research Enthusiast</li>
                  </ul>
                </div>
                <div className="expertise">
                  <h4>Areas of Expertise</h4>
                  <div className="expertise-tags">
                    <span className="tag">AI & ML</span>
                    <span className="tag">Legal Tech</span>
                    <span className="tag">Product Development</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder 2 */}
         <div className="founder-card">
  <div className="founder-image">
    <div className="image-placeholder">
      {/* Replace with actual photo */}
      <img 
     
        src="/path/to/abhishek-photo.jpg" 
        alt="Abhishek Pathak" 
        className="founder-photo"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'flex';
        }}
      />
      <span className="initials" style={{display: 'none'}}>AM</span>
    </div>
    <div className="founder-badge">Co-Founder</div>
  </div>
              <div className="founder-info">
                <h3>Anurag Mishra</h3>
                <p className="founder-role">Legal Operations & Strategy</p>
                <div className="education-details">
                  <h4>Education</h4>
                  <ul>
                    <li>B.Tech in Information Technology - AKTU (Currently Pursuing)</li>
                    <li>Specialization in Data Analytics</li>
                    <li>Legal Process Automation Expert</li>
                  </ul>
                </div>
                <div className="expertise">
                  <h4>Areas of Expertise</h4>
                  <div className="expertise-tags">
                    <span className="tag">Legal Operations</span>
                    <span className="tag">Data Analytics</span>
                    <span className="tag">Business Strategy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width Focus Sections */}
      <section className="focus-sections">
        {/* Our Focus */}
        <div className="focus-block focus-primary">
          <div className="container">
            <div className="focus-content">
              <div className="focus-icon">🎯</div>
              <h2>Our Focus</h2>
              <p>
                To simplify legal access and empower users with reliable, AI-driven legal tools 
                and verified data. We believe that everyone deserves equal access to justice 
                and legal information, regardless of their background or technical expertise.
              </p>
              <div className="focus-features">
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <span>Instant Legal Assistance</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <span>Verified Legal Data</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌐</span>
                  <span>Accessible to All</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Goal */}
        <div className="focus-block focus-secondary">
          <div className="container">
            <div className="focus-content">
              <div className="focus-icon">🎯</div>
              <h2>Our Goal</h2>
              <p>
                To become India's most trusted legal assistant platform, serving millions of 
                students, legal professionals, and citizens with accurate, timely, and 
                comprehensive legal solutions.
              </p>
              <div className="goal-metrics">
                <div className="metric">
                  <span className="metric-number">10M+</span>
                  <span className="metric-label">Users</span>
                </div>
                <div className="metric">
                  <span className="metric-number">50K+</span>
                  <span className="metric-label">Legal Professionals</span>
                </div>
                <div className="metric">
                  <span className="metric-number">95%</span>
                  <span className="metric-label">Accuracy Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Vision */}
        <div className="focus-block focus-tertiary">
          <div className="container">
            <div className="focus-content">
              <div className="focus-icon">🚀</div>
              <h2>Our Future Vision</h2>
              <p>
                We're building the future of legal technology with ambitious plans to transform 
                how India accesses and interacts with the legal system.
              </p>
              <div className="vision-roadmap">
                <div className="roadmap-item">
                  <h4>Multilingual Support</h4>
                  <p>Expanding access to legal information in all major Indian languages</p>
                </div>
                <div className="roadmap-item">
                  <h4>Expanded Lawyer Network</h4>
                  <p>Growing our verified network to cover every district and high court</p>
                </div>
                <div className="roadmap-item">
                  <h4>Predictive Legal Analytics</h4>
                  <p>Advanced AI models for case outcome predictions and legal strategy</p>
                </div>
                <div className="roadmap-item">
                  <h4>Personalized Dashboards</h4>
                  <p>Custom interfaces for students, lawyers, judges, and general users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="features-showcase">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', width: '100%' }}>
            <h2 style={{ textAlign: 'center', margin: '0 auto', width: '100%' }}>What Makes LegalMitra Unique</h2>
           
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI Bail Prediction</h3>
              <p>Advanced algorithms analyze case patterns to predict bail eligibility based on historical data and judicial trends</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>BNS Rule Descriptions</h3>
              <p>Complete explanations of Bharatiya Nyaya Sanhita sections with practical examples and interpretations</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍💼</div>
              <h3>Lawyer Directory</h3>
              <p>Find verified legal professionals by specialization, location, experience, and availability</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure Login System</h3>
              <p>Enterprise-grade security ensuring your legal data remains private and protected</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>User Dashboard</h3>
              <p>Personalized interfaces for lawyers, students, and judges to manage cases and research</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏛</div>
              <h3>Legal Knowledge Hub</h3>
              <p>Access to comprehensive case databases and legal research materials across India</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Join the Legal Revolution</h2>
            <p>Be part of India's growing community of legal innovators and empowered citizens</p>
            <div className="cta-buttons">
             
              <button className="cta-btn secondary" onClick={openContactForm}>
                Contact Our Team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Popup */}
      <ContactForm isOpen={isContactFormOpen} onClose={closeContactForm} />
    </div>
  );
};

export default AboutUs;