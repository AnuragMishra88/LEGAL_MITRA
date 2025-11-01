import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import NewHeader from './Components/Header/NewHeader';
import Navbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import HomePage from './Pages/HomePage/HomePage';
import BailPredic from './Pages/HomePage/BailPredic/bailpredic';
import Sections from './Pages/HomePage/Sections/sections';
import Registration from './Components/Registration/registration';
import Login from './Components/Login/Login';
import MyCollection from './Pages/HomePage/MyCollection/MyCollection';
import FAQ from './Pages/HomePage/FAQ/FAQ';
import AboutUs from './Pages/HomePage/AboutUs/AboutUs';
import FindLawyer from './Pages/HomePage/FindLawyer/FindLawyer';
import { AuthProvider } from './context/AuthContext';
import ProfilePage from './Pages/HomePage/ProfilePage/ProfilePage';
import AdminLogin from './Components/Admin/AdminLogin';
import AdminDashboard from './Pages/HomePage/AdminDashboard/AdminDashboard';
import Chatbot from './Components/Chatbot/Chatbot';

function App() {
  const [showChatbot, setShowChatbot] = useState(false);

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <NewHeader />
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/law-sections" element={<Sections />} />
              <Route path="/predict-bail" element={<BailPredic />} />
              <Route path="/find-lawyer" element={<FindLawyer />} />
              <Route path="/register" element={<Registration />} />
              <Route path="/login" element={<Login />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/my-collection" element={<MyCollection />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/pa~ma" element={<AdminLogin />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />

              
              {/* Add more routes as needed */}
            </Routes>
          </main>
          <Footer />

          {/* Global Chatbot Widget */}
          <div className="global-chatbot-widget">
            <button 
              className={`chatbot-toggle-btn ${showChatbot ? 'active' : ''}`}
              onClick={toggleChatbot}
              aria-label="Toggle chatbot"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" 
                  fill="currentColor"
                />
              </svg>
            </button>

            {showChatbot && (
              <div className="global-chatbot-container">
                <Chatbot />
              </div>
            )}
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;