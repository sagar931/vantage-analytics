import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // 1. Check for existing session on App Load
  useEffect(() => {
    const validateSession = async () => {
      const token = sessionStorage.getItem('vantage_auth_token');
      
      if (!token) {
        setIsLoading(false);
        if (isAuthenticated) logout(); // Force clear state if token is gone
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/auth/validate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (data.valid) {
          if (!isAuthenticated) {
             setUser(data.user);
             setIsAuthenticated(true);
          }
        } else {
          // Token expired or invalid -> Kick user out
          console.warn("Session expired. Logging out.");
          logout(); 
        }
      } catch (err) {
        console.error("Session validation failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Run immediately on load
    validateSession();

    // Run check every 30 seconds (Active Security)
    const interval = setInterval(validateSession, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]); // Re-run if auth state changes

  // 2. Login Function
  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barclaysId: email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Success
      sessionStorage.setItem('vantage_auth_token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  };

  // 3. Logout Function
  const logout = () => {
    sessionStorage.removeItem('vantage_auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      login, 
      logout, 
      authError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};