import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component - Ensures only authenticated users can access wrapped content
 * Usage: <ProtectedRoute><YourComponent /></ProtectedRoute>
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  // If not authenticated, this component won't render
  // The parent App.jsx will handle showing Login/Signup
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, render the protected content
  return children;
};

export default ProtectedRoute;
