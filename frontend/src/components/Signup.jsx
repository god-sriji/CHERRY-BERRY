import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../context/AuthContext';
import './Signup.css';

const Signup = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      // Decode the Google JWT token
      const decoded = jwtDecode(credentialResponse.credential);
      console.log('Google user info:', decoded);

      // Prepare user data
      const userData = {
        google_id: decoded.sub,
        email: decoded.email,
        username: decoded.name || decoded.email.split('@')[0],
        profile_pic: decoded.picture || null,
        bio: '',
      };

      // Register the user
      const result = await register(userData);
      
      if (result.success) {
        setSuccessMessage('Account created successfully! Redirecting to dashboard...');
        // AuthContext automatically logs user in after registration
        // App.jsx will detect isAuthenticated and show Dashboard
      } else {
        // If user already exists, show friendly message with login option
        if (result.message && result.message.includes('already exists')) {
          setError('This Google account is already registered. Redirecting to login...');
          // Auto-switch to login after 1.5 seconds
          setTimeout(() => {
            setError('');
            onSwitchToLogin();
          }, 1500);
        } else {
          setError(result.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Signup failed. Please try again.';
      
      // Check if it's a "user already exists" error
      if (errorMessage.includes('already exists')) {
        setError('This Google account is already registered. Please use the login page.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google signup failed. Please try again.');
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Create Account</h2>
        <p className="subtitle">Sign up to get started with Cherry Berry</p>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="google-login-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signup_with"
            shape="rectangular"
            theme="filled_blue"
            size="large"
            width="300"
          />
        </div>

        {loading && <div className="loading">Creating your account...</div>}

        <div className="terms">
          <p className="terms-text">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <div className="switch-auth">
          <p>
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="link-button">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
