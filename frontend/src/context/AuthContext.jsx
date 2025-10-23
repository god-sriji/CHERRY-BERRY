import { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await userAPI.getCurrentUser();
      if (response.success) {
        setUser(response.data);
      } else {
        // Invalid response, clear auth
        console.warn('Invalid user response, clearing authentication');
        logout();
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      
      // If token is invalid or expired (401/403), clear it
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('Token expired or invalid, logging out');
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, googleId = null, password = null) => {
    try {
      const response = await userAPI.verify(email, googleId, password);
      console.log('Login response:', response);
      
      if (response.success) {
        const { user, token } = response.data;
        console.log('Setting token and user:', { user, token });
        
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);

        // Refresh user from backend to ensure the provider and any
        // interceptor-attached requests are synchronized with the token.
        try {
          await loadUser();
        } catch (e) {
          console.warn('loadUser after login failed:', e);
        }

        console.log('User state after login:', user);
        console.log('isAuthenticated should be:', !!user);
        
        return { success: true, user };
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await userAPI.getCurrentUser();
      if (response.success) {
        setUser(response.data);
        return { success: true, user: response.data };
      }
      return { success: false };
    } catch (error) {
      console.error('Failed to refresh user:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
      return { success: false };
    }
  };

  const register = async (userData) => {
    try {
      const response = await userAPI.register(userData);
      if (response.success) {
        // Auto-login after registration
        return await login(userData.email, userData.google_id, userData.password);
      }
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Registration failed:', error);
      console.error('Error details:', error.response?.data);
      
      // Return the specific error message from the API
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
