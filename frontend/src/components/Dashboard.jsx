import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();

  // Security: If somehow accessed without authentication, redirect handled by App.jsx
  useEffect(() => {
    if (!isAuthenticated) {
      console.warn('Unauthorized access attempt to dashboard');
    }
  }, [isAuthenticated]);

  // Show loading while user data is being fetched
  if (!user) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome to Cherry Berry! 🍒</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="user-profile-card">
        <div className="profile-header">
          {user.profile_pic ? (
            <img src={user.profile_pic} alt="Profile" className="profile-pic" />
          ) : (
            <div className="profile-pic-placeholder">
              {user.username?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="profile-info">
            <h2>{user.username}</h2>
            <p className="email">{user.email}</p>
            {user.bio && <p className="bio">{user.bio}</p>}
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <span className="detail-label">User ID:</span>
            <span className="detail-value">{user.user_id}</span>
          </div>
          {user.google_id && (
            <div className="detail-item">
              <span className="detail-label">Google ID:</span>
              <span className="detail-value">{user.google_id.substring(0, 20)}...</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">Member since:</span>
            <span className="detail-value">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <h3>Your Dashboard</h3>
        <p>Your authenticated content goes here!</p>
      </div>
    </div>
  );
};

export default Dashboard;
