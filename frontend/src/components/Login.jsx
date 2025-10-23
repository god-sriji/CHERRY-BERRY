import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = ({ onSwitchToSignup }) => {
  const { login } = useAuth();
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

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        
        console.log('Token response:', tokenResponse);
        
        // Get user info from Google using the access token
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });

        console.log('Google user info:', userInfo.data);

        // Try to login with email and Google ID
        const loginResult = await login(userInfo.data.email, userInfo.data.sub);
        
        console.log('Login result:', loginResult);
        
        if (loginResult.success) {
          setSuccessMessage('Login successful! Redirecting to dashboard...');
          // Navigate to the app root so the App will re-evaluate auth state
          // Use assign to ensure a full reload and correct auth-provider initialization
          window.location.assign('/');
        } else {
          if (loginResult.message && loginResult.message.includes('not found')) {
            setError('Account not found. Please sign up first or use the account you registered with.');
          } else {
            setError(loginResult.message || 'Login failed. Please try again.');
          }
        }
      } catch (err) {
        console.error('Login error:', err);
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
      setError('Google login failed. Please try again.');
    },
    flow: 'implicit'
  });

  const handleEmailLogin = async () => {
    if (!emailInput || !passwordInput) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const res = await login(emailInput, null, passwordInput);
      console.log('Email login result:', res);
      if (res.success) {
        // Save credentials for auto-fill
        localStorage.setItem('lastLoginEmail', emailInput);
        localStorage.setItem('lastLoginPassword', passwordInput);
        
        setSuccessMessage('Login successful! Redirecting...');
        window.location.assign('/');
      } else {
        setError(res.message || 'Login failed');
      }
    } catch (e) {
      console.error('Email login error:', e);
      setError(e.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to continue to Cherry Berry</p>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="email-login-form">
          <input
            type="email"
            placeholder="Email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEmailLogin()}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleEmailLogin()}
            disabled={loading}
          />
          <button
            onClick={handleEmailLogin}
            className="primary-button"
            disabled={loading}
          >
            Sign in
          </button>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <div className="google-login-wrapper">
          <button 
            onClick={googleLogin} 
            className="google-login-button"
            disabled={loading}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {loading && <div className="loading">Signing in...</div>}

        <div className="switch-auth">
          <p>
            Don't have an account?{' '}
            <button onClick={onSwitchToSignup} className="link-button">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
