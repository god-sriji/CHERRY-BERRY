import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Signup.css';

const Signup = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('lastLoginEmail');
    const savedPassword = localStorage.getItem('lastLoginPassword');
    if (savedEmail) setEmailInput(savedEmail);
    if (savedPassword) setPasswordInput(savedPassword);
  }, []);

  const googleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });

        console.log('Google user info:', userInfo.data);

        const userData = {
          google_id: userInfo.data.sub,
          email: userInfo.data.email,
          username: userInfo.data.name || userInfo.data.email.split('@')[0],
          profile_pic: userInfo.data.picture || null,
          bio: '',
        };

        const result = await register(userData);
        
        if (result.success) {
          setSuccessMessage('Account created successfully! Redirecting...');
          window.location.assign('/');
        } else {
          if (result.message && result.message.includes('already exists')) {
            setError('This Google account is already registered. Redirecting to login...');
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
        
        if (errorMessage.includes('already exists')) {
          setError('This Google account is already registered. Please use the login page.');
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google signup failed. Please try again.');
    },
    flow: 'implicit'
  });

  const handleEmailSignup = async () => {
    if (!emailInput || !passwordInput) {
      setError('Please enter both email and password');
      return;
    }
    
    if (passwordInput.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const userData = {
        email: emailInput,
        password: passwordInput,
        username: emailInput.split('@')[0]
      };
      const res = await register(userData);
      console.log('Email register result:', res);
      if (res.success) {
        setSuccessMessage('Account created! Redirecting...');
        window.location.assign('/');
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (e) {
      console.error('Signup error:', e);
      setError(e.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Create Account</h2>
        <p className="subtitle">Sign up to get started with Cherry Berry</p>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="email-signup-form">
          <input
            type="email"
            placeholder="Email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEmailSignup()}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password (min. 6 characters)"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEmailSignup()}
            disabled={loading}
          />
          <button
            onClick={handleEmailSignup}
            className="primary-button"
            disabled={loading}
          >
            Create account
          </button>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="google-login-wrapper">
          <button 
            onClick={() => googleSignup()} 
            className="google-login-button"
            disabled={loading}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.30-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>
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
