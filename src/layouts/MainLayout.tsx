// src/layouts/MainLayout.tsx

import React, { useState, useEffect, useCallback } from 'react'; // Added useState, useCallback
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar/Sidebar';
import '../App.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();

  // --- Sidebar Collapse State ---
  // Start collapsed by default, read from localStorage if available
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
      const savedState = localStorage.getItem('sidebarCollapsed');
      return savedState ? JSON.parse(savedState) : true; // Default to true (collapsed)
  });

  // Function to toggle collapse state
  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prevState => {
        const newState = !prevState;
        localStorage.setItem('sidebarCollapsed', JSON.stringify(newState)); // Save state
        return newState;
    });
  }, []);

  // --- Apply Body Class for CSS Targeting ---
  useEffect(() => {
    const bodyClass = 'sidebar-desktop-collapsed';
    if (isSidebarCollapsed) {
      document.body.classList.add(bodyClass);
    } else {
      document.body.classList.remove(bodyClass);
    }
    // Optional cleanup if MainLayout unmounts (though unlikely)
    // return () => document.body.classList.remove(bodyClass);
  }, [isSidebarCollapsed]);


  // --- Authentication Handling ---
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log("MainLayout: Not authenticated, redirecting to login.");
      document.body.classList.remove('sidebar-desktop-collapsed'); // Clean up body class on logout redirect
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="app-loading-indicator">
        <i className="fas fa-spinner fa-spin fa-3x"></i>
        <p>Verificando Autenticação...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // --- Render ---
  return (
    <>
      {/* Pass collapse state and toggle function to Sidebar */}
      <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
      />
      {/* Apply content-wrapper class - CSS will handle margin based on body class */}
      <main className="content-wrapper">
        <div className="main-content-container">
          {children}
        </div>
        <footer className="app-footer">
            <p>© {new Date().getFullYear()} Sistema de Consulta - Têxteis</p>
            {user && <p className="footer-user-info">Logado como: {user.name || user.username}</p>}
        </footer>
      </main>
    </>
  );
};

export default MainLayout;