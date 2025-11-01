import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ADD THIS IMPORT
import './HomePage.css';
import newsData from './newsdatabase.json';

const HomePage = () => { // ✅ REMOVE setCurrentPage prop
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // ✅ ADD THIS HOOK
  
  const slides = [
    {
      id: 1,
      title: "Welcome to LegalMitra",
      subtitle: "Your Trusted Legal Partner",
      description: "Comprehensive legal solutions including bail prediction, lawyer matching, and legal documentation management for all your needs.",
      cta: "Get Started",
      link: "#welcome",
      background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
      page: null // No page change for welcome
    },
    {
      id: 2,
      title: "Bharatiya Nyaya Sanhita (BNS) Sections Database",
      subtitle: "Complete Legal Sections Information",
      description: "Access detailed explanations of Indian Penal Code and Criminal Procedure Code sections with case references and legal interpretations.",
      cta: "Explore Sections",
      link: "/sections/info.html",
      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
      page: 'law-sections' // Navigate to law sections page
    },
    {
      id: 3,
      title: "AI-Powered Bail Prediction", 
      subtitle: "Smart Bail Amount Estimation",
      description: "Get accurate bail amount predictions using our AI algorithms based on case type, severity, and legal precedents.",
      cta: "Predict Now",
      link: "/sections/predict.html",
      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
      page: 'predict-bail' // Navigate to bail prediction page
    },
    {
      id: 4,
      title: "Find Verified Lawyers",
      subtitle: "Connect with Legal Experts",
      description: "Browse our network of verified lawyers specializing in various legal domains with ratings, experience, and client reviews.",
      cta: "Find Lawyers",
      link: "/sections/lawyers.html",
      background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
      page: 'find-lawyer' // Navigate to find lawyer page
    }
  ];

  // ✅ UPDATED: USE REACT ROUTER NAVIGATION
  const handleSlideClick = (slide) => {
    if (slide.page) {
      // Use React Router navigation instead of setCurrentPage
      navigate(`/${slide.page}`);
    } else if (slide.link && slide.link.startsWith('http')) {
      // If it's an external link, open in new tab
      window.open(slide.link, '_blank', 'noopener,noreferrer');
    }
    // For internal links starting with #, let the default anchor behavior handle it
  };

  // Load news articles from JSON file
  useEffect(() => {
    const loadNewsData = () => {
      try {
        setLoading(true);
        const validArticles = newsData
          .filter(article => article.title && article.link)
          .slice(0, 24)
          .map(article => ({
            article_id: article.article_id,
            title: article.title,
            link: article.link,
            keywords: article.keywords || [],
            creator: article.creator || [article.source_name],
            description: article.description || 'No description available',
            image_url: article.image_url,
            pubDate: article.pubDate,
            source_name: article.source_name,
            category: article.category || []
          }));
        
        setNewsArticles(validArticles);
      } catch (err) {
        console.error('Error loading news data:', err);
        setNewsArticles(getFallbackArticles());
      } finally {
        setLoading(false);
      }
    };

    const getFallbackArticles = () => {
      return [
        {
          article_id: "1",
          title: "Supreme Court Introduces New Guidelines for Bail Applications",
          link: "https://indianexpress.com/article/india/supreme-court-bail-guidelines-123456/",
          keywords: ["Bail", "Supreme Court", "Legal"],
          creator: ["Legal News Network"],
          description: "The Supreme Court has introduced new procedural guidelines to streamline bail applications across the country.",
          image_url: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          source_name: "Legal News",
          category: ["legal", "judicial"]
        },
        {
          article_id: "2",
          title: "New Criminal Laws BNS, BNSS to Come into Effect from July 1",
          link: "https://timesofindia.indiatimes.com/india/new-criminal-laws-bns-bnss-to-come-into-effect-from-july-1/articleshow/123456.cms",
          keywords: ["BNS", "BNSS", "Criminal Law"],
          creator: ["Times of India"],
          description: "The three new criminal laws — Bharatiya Nyaya Sanhita, Bharatiya Nagarik Suraksha Sanhita, and Bharatiya Sakshya Act — will come into effect from July 1.",
          image_url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
          source_name: "Times of India",
          category: ["legal", "crime"]
        }
      ];
    };

    loadNewsData();
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Handle news card click
  const handleCardClick = (link) => {
    if (link && link.startsWith('http')) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="homepage">
      {/* Carousel Section */}
      <section className="carousel-section" aria-label="Website main features">
        <div className="carousel-container">
          <div 
            className="carousel-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                aria-hidden={index !== currentSlide}
              >
                <div className="slide-link" onClick={() => handleSlideClick(slide)}>
                  <div 
                    className="slide-background"
                    style={{ background: slide.background }}
                  >
                    <div className="slide-overlay">
                      <div className="slide-content">
                        <h2 className="slide-title">{slide.title}</h2>
                        <p className="slide-subtitle">{slide.subtitle}</p>
                        <p className="slide-description">{slide.description}</p>
                        <button 
                          className="slide-cta"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSlideClick(slide);
                          }}
                        >
                          {slide.cta}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button 
            className="carousel-arrow carousel-arrow-prev"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button 
            className="carousel-arrow carousel-arrow-next"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            ›
          </button>

          {/* Dots Indicator */}
          <div className="carousel-dots">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* News Section - REMAINS EXACTLY THE SAME */}
      <section className="news-section">
        <div className="news-container">
          <h2 className="news-section-title">Latest Legal News</h2>
          
          {loading && (
            <div className="news-loading">
              <div className="loading-spinner"></div>
              <p>Loading latest legal news...</p>
            </div>
          )}
          
          {!loading && (
            <div className="news-grid">
              {newsArticles.length > 0 ? (
                newsArticles.map((article) => (
                  <div 
                    key={article.article_id}
                    className="news-card"
                    onClick={() => handleCardClick(article.link)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Read article: ${article.title}`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleCardClick(article.link);
                      }
                    }}
                  >
                    <div className="news-image-container">
                      <img 
                        src={article.image_url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'} 
                        alt={article.title}
                        className="news-image"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
                        }}
                      />
                      {article.category && article.category.length > 0 && (
                        <span className="news-category">
                          {article.category[0]}
                        </span>
                      )}
                    </div>
                    
                    <div className="news-content">
                      {article.keywords && article.keywords.length > 0 && article.keywords[0] && (
                        <span className="news-keyword">
                          {typeof article.keywords[0] === 'string' ? article.keywords[0] : 'Legal News'}
                        </span>
                      )}
                      
                      <h3 className="news-title">{article.title}</h3>
                      
                      <div className="news-meta">
                        <span className="news-source">{article.source_name}</span>
                      </div>
                      
                      <p className="news-creator">
                        {article.creator && article.creator.length > 0 ? 
                          (typeof article.creator[0] === 'string' ? article.creator[0] : 'Unknown Author') : 
                          'Unknown Author'
                        }
                      </p>
                      
                      <p className="news-description">
                        {article.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="news-empty">
                  <p>No legal news articles available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;