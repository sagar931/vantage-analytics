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
        if (isAuthenticated) logout();
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
          console.warn("Session expired. Logging out.");
          logout(); 
        }
      } catch (err) {
        console.error("Session validation failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
    const interval = setInterval(validateSession, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]); 

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

      sessionStorage.setItem('vantage_auth_token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setAuthError(err.message);
      return false;
    }
  };

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