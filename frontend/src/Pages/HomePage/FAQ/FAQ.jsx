import React, { useState, useEffect } from 'react';
import './FAQ.css';
const API_BASE_URL = import.meta.env.VITE_API_URL;

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [formStatus, setFormStatus] = useState(''); // 'sending', 'success', 'error'
  const [formMessage, setFormMessage] = useState('');

  const faqData = [
    {
      question: "What is bail and how is it decided?",
      answer:
        "Bail is a temporary release of an accused person awaiting trial. It's decided based on factors like the severity of the offense, risk of flight, and prior criminal record.",
      icon: "⚖",
    },
    {
      question: "Can I get bail for a non-bailable offense?",
      answer:
        "Yes, but it's more difficult. You'll need to apply to a higher court and show strong reasons like medical urgency or lack of evidence.",
      icon: "🔓",
    },
    {
      question: "How can I check if my case qualifies for anticipatory bail?",
      answer:
        "Anticipatory bail is granted when you fear arrest in a non-bailable offense. Our platform can assess your FIR and suggest eligibility based on recent judgments.",
      icon: "🛡",
    },
    {
      question: "What does IPC Section 498A mean?",
      answer:
        "Section 498A deals with cruelty by husband or relatives towards a woman. It's a cognizable and non-bailable offense, often linked to dowry harassment.",
      icon: "📜",
    },
    {
      question: "How do I find a lawyer for my specific case type?",
      answer:
        'Use our "Find a Lawyer" tool to filter by case type (criminal, civil, family, etc.), location, and experience. You can also view ratings and availability.',
      icon: "👨‍💼",
    },
    {
      question: "Can I consult a lawyer online through your platform?",
      answer:
        "Absolutely. We offer secure video consultations and chat-based legal advice with verified lawyers across India.",
      icon: "💻",
    },
    {
      question: "What documents do I need to apply for bail?",
      answer:
        "Typically, you'll need the FIR copy, ID proof, case details, and any medical or employment documents that support your bail plea.",
      icon: "📄",
    },
    {
      question: "How long does it take to get bail?",
      answer:
        "It varies. For minor offenses, bail may be granted within 24–48 hours. For serious charges, it can take weeks depending on court schedules.",
      icon: "⏰",
    },
    {
      question: "What is the difference between civil and criminal cases?",
      answer:
        "Civil cases involve disputes over property, contracts, or rights. Criminal cases involve offenses against the state, like theft, assault, or fraud.",
      icon: "⚔",
    },
    {
      question: "Can I file a case without a lawyer?",
      answer:
        "Yes, but it's not recommended. Legal procedures are complex, and a lawyer ensures your case is properly drafted and presented.",
      icon: "❓",
    },
    {
      question: "Is my personal information safe on your platform?",
      answer:
        "Yes. We use end-to-end encryption and never share your data without consent. Your privacy is our top priority.",
      icon: "🔒",
    },
    {
      question: "How do I know which IPC section applies to my case?",
      answer:
        "Our legal assistant tool can analyze your FIR or complaint and suggest relevant IPC sections based on keywords and context.",
      icon: "🔍",
    },
    {
      question: "Can I change my lawyer mid-case?",
      answer:
        "Yes, you have the right to change your legal representation at any time. We can help you transition smoothly to a new lawyer.",
      icon: "🔄",
    },
    {
      question: "Do you offer legal help for domestic violence cases?",
      answer:
        "Yes. We have lawyers specializing in domestic violence, protection orders, and women's rights. You can request urgent help through our portal.",
      icon: "🚨",
    },
    {
      question: "What is your bail prediction feature and how accurate is it?",
      answer:
        "Our bail prediction tool uses past case data and AI to estimate your chances of getting bail. It's not a guarantee but offers helpful insights for planning.",
      icon: "🤖",
    },
  ];

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setFormStatus('sending');
    setFormMessage('Sending your message...');

    const formData = new FormData(event.target);
    formData.append("access_key", "bf893cad-b2b7-4668-bb94-c32a1b725e92");
    formData.append("subject", "New FAQ Contact Form Submission - LegalMitra");
    formData.append("from_name", "LegalMitra FAQ Page");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setFormStatus('success');
        setFormMessage('✅ Message sent successfully! We will get back to you soon.');
        event.target.reset();

        setTimeout(() => {
          setFormStatus('');
          setFormMessage('');
        }, 5000);
      } else {
        setFormStatus('error');
        setFormMessage('❌ Failed to send message. Please try again.');
        console.log("Error", data);
      }
    } catch (error) {
      setFormStatus('error');
      setFormMessage('❌ Network error. Please check your connection and try again.');
      console.log("Error", error);
    }
  };

  return (
    <div className="faq-page">
      {/* Animated Background Elements */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Mouse Follow Gradient */}
      <div
        className="mouse-follower"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
        }}
      ></div>

      <div className="faq-container">
        {/* Header Section */}
        <div className="faq-header">
          <div className="header-glow"></div>
          <h1 className="faq-title">
            <span className="title-text">Frequently Asked Questions</span>
          </h1>
          <p className="faq-subtitle">
            Get instant answers to your legal queries with our comprehensive FAQ section
          </p>
          <div className="header-decoration">
            <div className="decoration-line"></div>
            <div className="decoration-dot"></div>
            <div className="decoration-line"></div>
          </div>
        </div>

        {/* FAQ Grid */}
        <div className="faq-grid">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className={`faq-card ${activeIndex === index ? 'active' : ''} ${
                index % 3 === 0
                  ? 'card-primary'
                  : index % 3 === 1
                  ? 'card-secondary'
                  : 'card-tertiary'
              }`}
              onClick={() => toggleFAQ(index)}
            >
              <div className="card-glow"></div>
              <div className="card-content">
                <div className="card-header">
                  <span className="faq-icon">{faq.icon}</span>
                  <h3 className="faq-question">{faq.question}</h3>
                  <span className="expand-icon">
                    <div
                      className={`expand-line horizontal ${
                        activeIndex === index ? 'active' : ''
                      }`}
                    ></div>
                    <div className="expand-line vertical"></div>
                  </span>
                </div>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section - Only Form */}
        <div className="faq-contact">
          <div className="contact-glow"></div>
          <div className="contact-content">
            <h2>Still Have Questions?</h2>
            <p>Get in touch with our legal experts</p>

            <form className="contact-form" onSubmit={handleFormSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    required
                    className="form-input"
                    disabled={formStatus === 'sending'}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    required
                    className="form-input"
                    disabled={formStatus === 'sending'}
                  />
                </div>
              </div>

              <div className="form-group">
                <textarea
                  name="message"
                  placeholder="Your legal question or message..."
                  required
                  className="form-textarea"
                  rows="4"
                  disabled={formStatus === 'sending'}
                ></textarea>
              </div>

              {/* Honeypot Spam Protection */}
              <input
                type="checkbox"
                name="botcheck"
                className="hidden"
                style={{ display: 'none' }}
              />

              {/* ✅ Fixed syntax here */}
              {formMessage && (
                <div className={`form-status ${formStatus}`}>
                  {formMessage}
                </div>
              )}

              <div className="form-submit">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={formStatus === 'sending'}
                >
                  <span className="btn-glow"></span>
                  <span className="btn-text">
                    {formStatus === 'sending' ? 'Sending...' : 'Send Message'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
