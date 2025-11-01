import { useState } from "react";
import sectionsData from "../../../assets/data/sections.json"; 
import "./sections.css";

export default function IPCInfo() {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const normalizeKey = (s) => {
    if (!s) return "";
    s = s.trim().toUpperCase();
    if (/^\d+$/.test(s)) return "IPC_" + s;
    s = s.replace(/\s+/g, "_");
    if (!s.startsWith("IPC_")) s = "IPC_" + s.replace("IPC_", "");
    return s;
  };

  const handleSearch = () => {
    if (!search) {
      alert("Please enter a section number (e.g., 140)");
      return;
    }
    
    setIsSearching(true);
    setTimeout(() => {
      const parts = search.split(",").map((p) => p.trim()).filter(Boolean);
      let found = null;
      for (const p of parts) {
        const key = normalizeKey(p);
        const item = sectionsData.find(
          (sec) => (sec.Section || "").toUpperCase() === key
        );
        if (item) {
          found = item;
          break;
        }
      }

      if (found) {
        setResult(found);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
      setIsSearching(false);
    }, 500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const clearSearch = () => {
    setSearch("");
    setResult(null);
    setNotFound(false);
  };

  return (
    <div className="sections-container">
      {/* Hero Section */}
      <section className="sections-hero">
        <div className="hero-content">
          <div className="logo-container">
            <div className="logo">⚖️</div>
          </div>
          <h1 className="hero-title">
            IPC Sections <span className="highlight">Database</span>
          </h1>
          <p className="hero-subtitle">
            Comprehensive Indian Penal Code database with detailed descriptions, 
            offenses, and punishments for every section
          </p>
          <div className="search-stats">
            <div className="stat">
              <span className="stat-number">{sectionsData.length}+</span>
              <span className="stat-label">Sections</span>
            </div>
            <div className="stat">
              <span className="stat-number">100%</span>
              <span className="stat-label">Verified</span>
            </div>
            <div className="stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <div className="container">
          <div className="search-card">
            <div className="search-header">
              <h2>Search IPC Sections</h2>
              <p>Enter section number to get detailed legal information</p>
            </div>
            
            <div className="search-input-group">
              <div className="input-container " style={{background:"black",padding:"1px"
              }}>
                <div className="input-icon">🔍</div>
                <input
                  type="text"
                  placeholder="Enter section number (e.g., 140, 302, IPC_420)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="search-input"
                />
                {search && (
                  <button className="clear-btn" style={{padding:"10px" , background:"none"}} onClick={clearSearch}>
                    ✕
                  </button>
                )}
              </div>
              <button 
                onClick={handleSearch} 
                className="search-btn"
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <div className="spinner"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">⚡</span>
                    Search Section
                  </>
                )}
              </button>
            </div>

            <div className="search-tips">
              <div className="tip">
                <span className="tip-icon">💡</span>
                <span>Try: <code>140</code>, <code>IPC_302</code>, or multiple sections like <code>140, 302, 420</code></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {(result || notFound) && (
        <section className="results-section">
          <div className="container">
            {result && (
              <div className="result-card success">
                <div className="result-header">
                  <div className="result-badge">
                    <span className="badge-icon">✅</span>
                    Section Found
                  </div>
                  <div className="section-number">{result.Section}</div>
                </div>
                
                <div className="result-content">
                  <div className="info-grid">
                    <div className="info-item full-width">
                      <div className="info-label">
                        <span className="label-icon">⚖️</span>
                        Offense
                      </div>
                      <div className="info-value">{result.Offense}</div>
                    </div>
                    
                    <div className="info-item full-width">
                      <div className="info-label">
                        <span className="label-icon">⚡</span>
                        Punishment
                      </div>
                      <div className="info-value">{result.Punishment}</div>
                    </div>
                    
                    <div className="info-item full-width">
                      <div className="info-label">
                        <span className="label-icon">📖</span>
                        Description
                      </div>
                      <div className="info-value description">
                        {result.Description}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="result-footer">
                  <button className="action-btn primary" onClick={clearSearch}>
                    Search Another Section
                  </button>
                </div>
              </div>
            )}

            {notFound && (
              <div className="result-card error">
                <div className="result-header">
                  <div className="result-badge error">
                    <span className="badge-icon">❌</span>
                    Section Not Found
                  </div>
                </div>
                
                <div className="result-content">
                  <div className="error-message">
                    <div className="error-icon">🔍</div>
                    <div>
                      <h3>No matching section found</h3>
                      <p>
                        We couldn't find any data for "<strong>{search}</strong>". 
                        Please check the format and try again.
                      </p>
                    </div>
                  </div>
                  
                  <div className="suggestions">
                    <h4>Try these formats:</h4>
                    <div className="suggestion-list">
                      <div className="suggestion">
                        <code>140</code>
                        <span>Simple number</span>
                      </div>
                      <div className="suggestion">
                        <code>IPC_302</code>
                        <span>With IPC prefix</span>
                      </div>
                      <div className="suggestion">
                        <code>140, 302</code>
                        <span>Multiple sections</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="result-footer">
                  <button className="action-btn primary" onClick={clearSearch}>
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section - UPDATED STRUCTURE */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Use Our IPC Database?</h2>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-top-row">
                <div className="feature-icon">📚</div>
                <h3>Complete Database</h3>
              </div>
              <p>Access all IPC sections with detailed descriptions and legal interpretations</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-top-row">
                <div className="feature-icon">⚡</div>
                <h3>Instant Search</h3>
              </div>
              <p>Find any section instantly with our optimized search algorithm</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-top-row">
                <div className="feature-icon">🔍</div>
                <h3>Multiple Formats</h3>
              </div>
              <p>Search using simple numbers, IPC prefixes, or multiple sections</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}