import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { defaultProfilePics } from '../utils/defaultPfps';
import { userAPI } from '../services/api';
import './Settings.css';

const Settings = () => {
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showPfpSelector, setShowPfpSelector] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    profile_pic: user?.profile_pic || ''
  });
  const [selectedPfp, setSelectedPfp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePfpSelect = (pfp) => {
    setSelectedPfp(pfp.id);
    setFormData({ ...formData, profile_pic: pfp.url });
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const response = await userAPI.updateUser(user.user_id, formData);

      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setEditing(false);
        setShowPfpSelector(false);
        // Refresh user data
        await refreshUser();
      } else {
        setMessage({ type: 'error', text: response.message || 'Update failed' });
      }
    } catch (err) {
      console.error('Update error:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <h2>Settings ⚙️</h2>

        {message.text && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Profile Settings */}
        <div className="settings-section">
          <h3>Profile Information</h3>
          
          {!editing ? (
            <div className="profile-preview">
              <div className="preview-item">
                <span className="preview-label">Profile Picture:</span>
                <img 
                  src={user?.profile_pic || '/default-avatar.png'} 
                  alt="Profile" 
                  className="preview-avatar"
                />
              </div>
              <div className="preview-item">
                <span className="preview-label">Username:</span>
                <span className="preview-value">{user?.username}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Bio:</span>
                <span className="preview-value">{user?.bio || 'No bio set'}</span>
              </div>
              <button onClick={() => setEditing(true)} className="edit-button">
                Edit Profile
              </button>
            </div>
          ) : (
            <div className="profile-edit">
              <div className="form-group">
                <label>Profile Picture</label>
                <div className="current-pfp-display">
                  <img 
                    src={formData.profile_pic || '/default-avatar.png'} 
                    alt="Current" 
                    className="current-pfp"
                  />
                  <button 
                    onClick={() => setShowPfpSelector(!showPfpSelector)}
                    className="change-pfp-button"
                  >
                    Change Picture
                  </button>
                </div>
                
                {showPfpSelector && (
                  <div className="pfp-selector">
                    {defaultProfilePics.map((pfp) => (
                      <div
                        key={pfp.id}
                        className={`pfp-option-small ${selectedPfp === pfp.id ? 'selected' : ''}`}
                        onClick={() => handlePfpSelect(pfp)}
                      >
                        <img src={pfp.url} alt={pfp.alt} className="pfp-image-small" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="settings-input"
                  maxLength={30}
                />
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="settings-textarea"
                  rows={3}
                  maxLength={150}
                />
                <span className="char-count">{formData.bio.length}/150</span>
              </div>

              <div className="button-group">
                <button 
                  onClick={() => {
                    setEditing(false);
                    setShowPfpSelector(false);
                    setFormData({
                      username: user?.username || '',
                      bio: user?.bio || '',
                      profile_pic: user?.profile_pic || ''
                    });
                  }} 
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile} 
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div className="settings-section">
          <h3>Account</h3>
          <div className="account-info">
            <div className="info-row">
              <span>Email:</span>
              <span>{user?.email}</span>
            </div>
            <div className="info-row">
              <span>Member since:</span>
              <span>{new Date(user?.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="settings-section">
          <button onClick={handleLogout} className="logout-button-settings">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
