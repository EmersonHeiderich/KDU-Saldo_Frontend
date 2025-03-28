// src/contexts/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import * as authService from '../services/authService';
import { ApiUser } from '../services/authService'; // Import the specific user type from the service

interface AuthContextType {
  isAuthenticated: boolean;
  user: ApiUser | null; // Use the ApiUser type directly
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  // verifyTokenAuthContext: () => Promise<boolean>; // Keep internal if not needed outside
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to check auth status (used on mount and potentially elsewhere)
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const isValid = await authService.verifyToken();
      if (isValid) {
        setUser(authService.getCurrentUser()); // Update state from localStorage
        return true;
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('AuthContext: Error during token verification:', error);
      setUser(null);
      // No need to clear localStorage here, verifyToken service does it on error
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial authentication check on component mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const success = await authService.login(username, password);
      if (success) {
        setUser(authService.getCurrentUser()); // Update state from localStorage
      } else {
        setUser(null); // Should not happen if service throws, but safety measure
      }
       return success;
    } catch (error) {
        console.error('AuthContext: Login failed', error);
        setUser(null);
        throw error; // Re-throw for component to handle UI feedback
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    // setLoading(true); // No loading state needed as service handles redirect/reload
    try {
        await authService.logout(); // Service handles API call, cleanup, and reload/redirect logic
        setUser(null); // Set state immediately, though reload will override
    } catch (error) {
        console.error('AuthContext: Logout failed', error);
        // Attempt cleanup again just in case
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Maybe force reload if service failed?
        // window.location.reload();
        throw error; // Re-throw if component needs to know
    }
    // No finally setLoading(false) needed due to reload/redirect
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user, // Simpler check: user exists means authenticated
        user, // Provide the ApiUser object directly
        loading,
        login,
        logout,
        // verifyTokenAuthContext: checkAuthStatus, // Expose check function if needed by components
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};