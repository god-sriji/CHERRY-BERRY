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

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

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
        <div className="navbar-brand">
          <h1>🍒 Cherry Berry</h1>
        </div>
        <div className="navbar-tabs">
          <button
            className={`nav-tab ${activeTab === 'fyp' ? 'active' : ''}`}
            onClick={() => setActiveTab('fyp')}
          >
            <span className="tab-icon">🏠</span>
            <span className="tab-label">For You</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="tab-icon">💬</span>
            <span className="tab-label">Chat</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="tab-icon">👤</span>
            <span className="tab-label">Profile</span>
          </button>
          <button
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="tab-icon">⚙️</span>
            <span className="tab-label">Settings</span>
          </button>
        </div>
        <div className="navbar-user">
          <img 
            src={user?.profile_pic || '/default-avatar.png'} 
            alt="Profile" 
            className="navbar-avatar"
          />
          <span className="navbar-username">{user?.username}</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="homepage-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default Homepage;
