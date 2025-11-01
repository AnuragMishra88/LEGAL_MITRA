import React, { useState } from 'react';
import './ContactForm.css';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const ContactForm = ({ isOpen, onClose }) => {
  const [result, setResult] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setResult("Sending....");
    setIsSuccess(false);
    setIsError(false);
    
    const formData = new FormData(event.target);

    formData.append("access_key", "bf893cad-b2b7-4668-bb94-c32a1b725e92");
    formData.append("subject", "New Contact Form Submission - LegalMitra");
    formData.append("from_name", "LegalMitra Website");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult("✅ Form Submitted Successfully! We'll get back to you soon.");
        setIsSuccess(true);
        setIsError(false);
        event.target.reset();
        
        setTimeout(() => {
          onClose();
          setResult("");
          setIsSuccess(false);
        }, 3000);
      } else {
        console.log("Error", data);
        setResult("❌ Error: " + (data.message || "Something went wrong. Please try again."));
        setIsSuccess(false);
        setIsError(true);
      }
    } catch (error) {
      console.log("Error", error);
      setResult("❌ Network Error: Please check your connection and try again.");
      setIsSuccess(false);
      setIsError(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="contact-form-overlay" onClick={onClose}>
      <div className="contact-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h3>Contact Our Team</h3>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={onSubmit} className="contact-form">
          <input type="checkbox" name="botcheck" style={{ display: 'none' }} />
          
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="Enter your email address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              required
              rows="5"
              placeholder="Tell us about your legal needs or questions..."
            />
          </div>

          {/* ✅ Fixed syntax error below */}
          {result && (
            <div
              className={`result-message ${isSuccess ? 'success' : ''} ${isError ? 'error' : ''} ${
                !isSuccess && !isError ? 'sending' : ''
              }`}
            >
              {result}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose}
              disabled={result === "Sending...."}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={result === "Sending...."}
            >
              {result === "Sending...." ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
