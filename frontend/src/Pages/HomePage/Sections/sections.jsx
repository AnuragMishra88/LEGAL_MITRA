import { useState } from "react";
import "./sections.css";

export default function IPCInfo() {
  // AI States
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [languageMode, setLanguageMode] = useState('english');
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);

  // Groq API Configuration
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  const MODEL = "llama-3.1-8b-instant";

  // Function to clean text by removing markdown symbols
  const cleanText = (text) => {
    if (!text) return text;
    
    // Remove ** markers (bold in markdown)
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    
    // Remove * markers (italic in markdown)
    text = text.replace(/\*(.*?)\*/g, '$1');
    
    // Remove __ markers (bold in markdown)
    text = text.replace(/__(.*?)__/g, '$1');
    
    // Remove _ markers (italic in markdown)
    text = text.replace(/_(.*?)_/g, '$1');
    
    // Remove # markers (headings in markdown)
    text = text.replace(/#{1,6}\s?(.*?)(?:\n|$)/g, '$1\n');
    
    // Remove backticks (code in markdown)
    text = text.replace(/`(.*?)`/g, '$1');
    
    return text;
  };

  const getSystemPrompt = () => {
    const lawName = 'Indian Penal Code (IPC) and Bharatiya Nyaya Sanhita (BNS)';
    
    if (languageMode === 'english') {
      return `You are LegalMitra AI, an expert in Indian law specializing in ${lawName}.

RULES:
1. Provide accurate information about Indian laws, sections, articles, and legal procedures
2. Use simple, clear English
3. Always mention relevant section/article numbers
4. Give practical examples
5. Be concise but thorough
6. Note that BNS is the new criminal code replacing IPC (effective 2024)
7. For serious matters, advise consulting a lawyer
8. When relevant, compare IPC and BNS provisions

RESPONSE FORMAT:
- Start with brief summary
- Use bullet points for key information
- End with practical advice`;
    } else {
      return `You are LegalMitra AI, an expert in Indian law specializing in ${lawName}. Hinglish mein jawab dein.

RULES:
1. Simple Hinglish mein samjhayein
2. Section/articles numbers zaroor batayein
3. Examples bhi dein
4. Short but complete jawab dein
5. BNS naya criminal code hai jo IPC ki jagah 2024 mein aaya hai
6. Gambhir mamlon mein lawyer se contact karne ki salah dein
7. IPC aur BNS ke beech comparison bhi batayein

RESPONSE FORMAT:
- Chota summary dijiye
- Bullet points mein important baatein
- End mein practical advice dijiye`;
    }
  };

  const handleAiQuery = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const lawName = 'Indian Penal Code (IPC) and Bharatiya Nyaya Sanhita (BNS)';
      
      const prompt = languageMode === 'english'
        ? `Answer this legal question about Indian law: "${aiQuery}"
           Provide accurate information with relevant section/article numbers from both IPC and BNS where applicable.
           Note that BNS is the new criminal code replacing IPC (effective 2024).`
        : `Bharatiya kanoon ke baare mein yeh sawal hai: "${aiQuery}"
           Sahi jankari dein aur relevant IPC aur BNS section/article numbers batayein.
           BNS naya criminal code hai jo IPC ki jagah 2024 mein aaya hai.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: getSystemPrompt()
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        // Clean the response content
        const cleanedContent = cleanText(data.choices[0].message.content);
        
        setAiResponse({
          query: aiQuery,
          content: cleanedContent
        });
        
        // Generate suggested questions based on response
        generateSuggestedQuestions(aiQuery, cleanedContent);
      }
    } catch (error) {
      console.error('AI Error:', error);
      setAiResponse({
        type: 'error',
        content: languageMode === 'english' 
          ? "Sorry, unable to process your query. Please try again."
          : "माफ कीजिए, आपका सवाल process नहीं कर पा रहा है। कृपया फिर से कोशिश करें।"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateSuggestedQuestions = async (query, response) => {
    try {
      const prompt = `Based on this legal Q&A about Indian law:
      
Question: "${query}"
Answer: "${response.substring(0, 200)}..."

Suggest 3 follow-up questions someone might ask. Return only as a simple comma-separated list.`;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 100,
          temperature: 0.3
        })
      });

      const data = await res.json();
      if (data.choices && data.choices[0]) {
        setSuggestedQuestions(data.choices[0].message.content.split(',').map(q => q.trim()));
      }
    } catch (error) {
      console.error('Suggested questions error:', error);
    }
  };

  const clearChat = () => {
    setAiResponse(null);
    setAiQuery("");
    setSuggestedQuestions([]);
  };

  // Function to format response with proper styling (without markdown)
  const formatResponseContent = (content) => {
    if (!content) return null;
    
    const lines = content.split('\n');
    const formattedElements = [];
    let listItems = [];
    let inList = false;
    let listType = null;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check for bullet points (lines starting with - or •)
      if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
        if (!inList || listType !== 'bullet') {
          if (inList) {
            formattedElements.push(
              <ul key={`list-${index}`} className="response-bullet-list">
                {listItems}
              </ul>
            );
            listItems = [];
          }
          inList = true;
          listType = 'bullet';
        }
        listItems.push(
          <li key={`item-${index}`} className="response-bullet">
            {trimmedLine.substring(1).trim()}
          </li>
        );
      }
      // Check for numbered lists
      else if (trimmedLine.match(/^\d+\./)) {
        if (!inList || listType !== 'numbered') {
          if (inList) {
            formattedElements.push(
              listType === 'bullet' ? (
                <ul key={`list-${index}`} className="response-bullet-list">
                  {listItems}
                </ul>
              ) : (
                <ol key={`list-${index}`} className="response-numbered-list">
                  {listItems}
                </ol>
              )
            );
            listItems = [];
          }
          inList = true;
          listType = 'numbered';
        }
        listItems.push(
          <li key={`item-${index}`} className="response-numbered">
            {trimmedLine.replace(/^\d+\.\s*/, '')}
          </li>
        );
      }
      // Empty line
      else if (trimmedLine === '') {
        if (inList) {
          formattedElements.push(
            listType === 'bullet' ? (
              <ul key={`list-${index}`} className="response-bullet-list">
                {listItems}
              </ul>
            ) : (
              <ol key={`list-${index}`} className="response-numbered-list">
                {listItems}
              </ol>
            )
          );
          listItems = [];
          inList = false;
          listType = null;
        }
        formattedElements.push(<br key={`br-${index}`} />);
      }
      // Regular paragraph
      else {
        if (inList) {
          formattedElements.push(
            listType === 'bullet' ? (
              <ul key={`list-${index}`} className="response-bullet-list">
                {listItems}
              </ul>
            ) : (
              <ol key={`list-${index}`} className="response-numbered-list">
                {listItems}
              </ol>
            )
          );
          listItems = [];
          inList = false;
          listType = null;
        }

        // Check if line contains important legal terms
        const hasLegalTerm = trimmedLine.includes('Section') || 
                            trimmedLine.includes('Article') || 
                            trimmedLine.includes('IPC') || 
                            trimmedLine.includes('BNS') ||
                            trimmedLine.includes('Act') ||
                            trimmedLine.includes('Code');

        formattedElements.push(
          <p 
            key={`p-${index}`} 
            className={`response-paragraph ${hasLegalTerm ? 'highlight-text' : ''}`}
          >
            {trimmedLine}
          </p>
        );
      }
    });

    // Add any remaining list items
    if (inList && listItems.length > 0) {
      formattedElements.push(
        listType === 'bullet' ? (
          <ul key="list-final" className="response-bullet-list">
            {listItems}
          </ul>
        ) : (
          <ol key="list-final" className="response-numbered-list">
            {listItems}
          </ol>
        )
      );
    }

    return formattedElements;
  };

  return (
    <div className="ai-assistant-container">
      {/* Header */}
      <div className="ai-header-mini">
        <div className="ai-header-left">
          <h2>LegalMitra AI</h2>
          <div>
            <p className="ai-subtitle">Your AI Legal Assistant for Indian Law</p>
          </div>
        </div>
        <div className="ai-header-controls">
          {/* Language Toggle */}
          <div className="lang-toggle-mini">
            <button 
              className={`lang-opt ${languageMode === 'english' ? 'active' : ''}`}
              onClick={() => setLanguageMode('english')}
            >
              EN
            </button>
            <button 
              className={`lang-opt ${languageMode === 'hinglish' ? 'active' : ''}`}
              onClick={() => setLanguageMode('hinglish')}
            >
              हिं
            </button>
          </div>

          {/* Clear Button
          {aiResponse && (
            <button className="clear-chat-btn" onClick={clearChat} title="Clear chat">
              ✕
            </button>
          )} */}
        </div>
      </div>

      {/* AI Assistant Panel */}
      <div className="ai-panel-full">
        {/* Quick Action Buttons */}
        <div className="quick-actions">
          <button 
            className="action-chip"
            onClick={() => setAiQuery("What is Section 302 IPC and its BNS equivalent?")}
          >
            📜 Section 302
          </button>
          <button 
            className="action-chip"
            onClick={() => setAiQuery("How to file an FIR?")}
          >
            📝 File FIR
          </button>
          <button 
            className="action-chip"
            onClick={() => setAiQuery("What is bail and how to get it?")}
          >
            ⚖️ Bail process
          </button>
          <button 
            className="action-chip"
            onClick={() => setAiQuery("What are my rights if arrested?")}
          >
            🔒 Rights on arrest
          </button>
          <button 
            className="action-chip"
            onClick={() => setAiQuery("Difference between theft and robbery")}
          >
            🔍 Theft vs Robbery
          </button>
         
        </div>

        {/* Query Input Form */}
        <form onSubmit={handleAiQuery} className="ai-query-form-main">
          <div className="input-wrapper-main">
            <textarea
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder={languageMode === 'english' 
                ? "Ask any legal question... (e.g., What is Section 302? Compare IPC and BNS)" 
                : "कोई भी कानूनी सवाल पूछें... (जैसे, Section 302 क्या है? IPC और BNS में अंतर)"}
              className="ai-query-input-main"
              rows="2"
            />
            <button 
              type="submit" 
              className="ai-submit-btn-main"
              disabled={isAiLoading || !aiQuery.trim()}
            >
              {isAiLoading ? (
                <div className="spinner-mini"></div>
              ) : (
                <>
                  <span className="btn-icon">⚡</span>
                  <span className="btn-text">Ask AI</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* AI Response Section */}
        {isAiLoading && (
          <div className="ai-loading-main">
            <div className="ai-spinner-main"></div>
            <p>LegalMitra AI is analyzing your question...</p>
          </div>
        )}

        {aiResponse && !isAiLoading && (
          <div className={`ai-response-main ${aiResponse.type === 'error' ? 'error' : ''}`}>
            <div className="response-header-main">
              <div className="response-query">
                <span className="query-label">You asked:</span>
                <p className="query-text">{aiResponse.query || aiQuery}</p>
              </div>
            </div>
            
            <div className="response-content-main">
              {formatResponseContent(aiResponse.content)}
            </div>

            {/* Suggested Follow-up Questions */}
            {suggestedQuestions.length > 0 && (
              <div className="suggested-questions">
                <h4 className="suggested-title">You might also want to know:</h4>
                <div className="suggested-grid">
                  {suggestedQuestions.map((q, index) => (
                    <button
                      key={index}
                      className="suggested-chip"
                      onClick={() => {
                        setAiQuery(q);
                        handleAiQuery({ preventDefault: () => {} });
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="response-actions-main">
              <button 
                className="response-action-btn"
                onClick={() => navigator.clipboard.writeText(aiResponse.content)}
              >
                 Copy
              </button>
              <button 
                className="response-action-btn"
                onClick={clearChat}
              >
                 New Query
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!aiResponse && !isAiLoading && (
          <div className="empty-state">
            <h3>LegalMitra AI Assistant</h3>
            <p>Ask me anything about Indian law - IPC, BNS, and legal procedures</p>
           
          </div>
        )}
      </div>
    </div>
  );
}