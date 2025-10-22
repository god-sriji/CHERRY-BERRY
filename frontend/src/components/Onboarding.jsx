import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { defaultProfilePics } from '../utils/defaultPfps';
import { userAPI } from '../services/api';
import './Onboarding.css';

const Onboarding = ({ onComplete }) => {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: '',
    profile_pic: user?.profile_pic || ''
  });
  const [selectedPfp, setSelectedPfp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePfpSelect = (pfp) => {
    setSelectedPfp(pfp.id);
    setFormData({ ...formData, profile_pic: pfp.url });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step === 1 && !formData.profile_pic) {
      setError('Please select a profile picture');
      return;
    }
    if (step === 2 && !formData.username.trim()) {
      setError('Please enter a username');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.username.trim()) {
        setError('Username is required');
        return;
      }

      // Update user profile
      const response = await userAPI.updateUser(user.user_id, {
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        profile_pic: formData.profile_pic
      });

      if (response.success) {
        // Refresh user data
        await refreshUser();
        onComplete();
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err.response?.data?.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h2>Welcome to Cherry Berry! 🍒</h2>
          <p className="step-indicator">Step {step} of 3</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Select Profile Picture */}
        {step === 1 && (
          <div className="onboarding-step">
            <h3>Choose Your Profile Picture</h3>
            <div className="pfp-grid">
              {defaultProfilePics.map((pfp) => (
                <div
                  key={pfp.id}
                  className={`pfp-option ${selectedPfp === pfp.id ? 'selected' : ''}`}
                  onClick={() => handlePfpSelect(pfp)}
                >
                  <img src={pfp.url} alt={pfp.alt} className="pfp-image" />
                </div>
              ))}
            </div>
            <button onClick={handleNext} className="next-button">
              Next
            </button>
          </div>
        )}

        {/* Step 2: Set Username */}
        {step === 2 && (
          <div className="onboarding-step">
            <h3>Create Your Username</h3>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter username"
              className="input-field"
              maxLength={30}
            />
            <p className="input-hint">This is how others will see you</p>
            <div className="button-group">
              <button onClick={() => setStep(1)} className="back-button">
                Back
              </button>
              <button onClick={handleNext} className="next-button">
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Add Bio */}
        {step === 3 && (
          <div className="onboarding-step">
            <h3>Tell Us About Yourself</h3>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Write a short bio (optional)"
              className="textarea-field"
              rows={4}
              maxLength={150}
            />
            <p className="input-hint">{formData.bio.length}/150 characters</p>
            <div className="button-group">
              <button onClick={() => setStep(2)} className="back-button">
                Back
              </button>
              <button 
                onClick={handleComplete} 
                className="complete-button"
                disabled={loading}
              >
                {loading ? 'Completing...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
