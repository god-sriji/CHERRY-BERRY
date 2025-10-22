import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = ({ onSwitchToSignup }) => {
  const { login } = useAuth();
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

      // Try to login
      const loginResult = await login(decoded.email, decoded.sub);
      
      if (loginResult.success) {
        setSuccessMessage('Login successful! Redirecting to dashboard...');
        // AuthContext will automatically update isAuthenticated
        // App.jsx will detect this and show Dashboard
      } else {
        // User doesn't exist, show message to sign up
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
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to continue to Cherry Berry</p>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="google-login-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            shape="rectangular"
            theme="filled_blue"
            size="large"
            width="300"
          />
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
