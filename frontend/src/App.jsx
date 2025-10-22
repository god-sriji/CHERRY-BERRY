import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Onboarding from './components/Onboarding';
import Homepage from './components/Homepage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function AppContent() {
  const { isAuthenticated, user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Reset to login page when user logs out
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      setShowSignup(false);
      setShowOnboarding(false);
    }
  }, [isAuthenticated, loading]);

  // Check if user needs onboarding (missing profile_pic, username, or bio)
  useEffect(() => {
    if (isAuthenticated && user) {
      const needsOnboarding = !user.profile_pic || !user.username || !user.bio;
      setShowOnboarding(needsOnboarding);
    }
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If authenticated, check onboarding status
  if (isAuthenticated) {
    if (showOnboarding) {
      return (
        <ProtectedRoute>
          <Onboarding onComplete={() => setShowOnboarding(false)} />
        </ProtectedRoute>
      );
    }
    
    return (
      <ProtectedRoute>
        <Homepage />
      </ProtectedRoute>
    );
  }

  // If not authenticated, show login or signup
  return showSignup ? (
    <Signup onSwitchToLogin={() => setShowSignup(false)} />
  ) : (
    <Login onSwitchToSignup={() => setShowSignup(true)} />
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;