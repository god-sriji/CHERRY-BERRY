import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Chat from './Chat';
import FYP from './FYP';
import Profile from './Profile';
import Settings from './Settings';
import './Homepage.css';

const Homepage = () => {
  const { user } = useAuth();
  // Initialize activeTab from localStorage or default to 'fyp'
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'fyp';
  });
  const [menuOpen, setMenuOpen] = useState(false);

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false); // Close menu after selection on mobile
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <Chat />;
      case 'fyp':
        return <FYP />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return <FYP />;
    }
  };

  return (
    <div className="homepage-container">
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="navbar-brand" onClick={() => handleTabClick('chat')}>
          <h1>🍒 Cherry Berry</h1>
        </div>
        
        {/* Desktop Navigation */}
        <div className="navbar-tabs desktop-nav">
          <button
            className={`nav-tab ${activeTab === 'fyp' ? 'active' : ''}`}
            onClick={() => handleTabClick('fyp')}
          >
            <span className="tab-icon">🏠</span>
            <span className="tab-label">For You</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => handleTabClick('chat')}
          >
            <span className="tab-icon">💬</span>
            <span className="tab-label">Chat</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabClick('profile')}
          >
            <span className="tab-icon">👤</span>
            <span className="tab-label">Profile</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabClick('settings')}
          >
            <span className="tab-icon">⚙️</span>
            <span className="tab-label">Settings</span>
          </button>
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="mobile-menu">
          <button 
            className={`hamburger ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div className="navbar-user desktop-only">
          <img 
            src={user?.profile_pic || '/default-avatar.png'} 
            alt="Profile" 
            className="navbar-avatar"
          />
          <span className="navbar-username">{user?.username}</span>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="mobile-dropdown">
          <button
            className={`mobile-nav-item ${activeTab === 'fyp' ? 'active' : ''}`}
            onClick={() => handleTabClick('fyp')}
          >
            <span className="tab-icon">🏠</span>
            <span>For You</span>
          </button>
          <button
            className={`mobile-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => handleTabClick('chat')}
          >
            <span className="tab-icon">💬</span>
            <span>Chat</span>
          </button>
          <button
            className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabClick('profile')}
          >
            <span className="tab-icon">👤</span>
            <span>Profile</span>
          </button>
          <button
            className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabClick('settings')}
          >
            <span className="tab-icon">⚙️</span>
            <span>Settings</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="homepage-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default Homepage;
