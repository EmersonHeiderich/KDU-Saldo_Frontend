// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Correct import path

// Import Pages
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import Users from './pages/Users/Users';
import Fabrics from './pages/Fabrics/Fabrics';
import Products from './pages/Products/Products';
import CustomerPanel from './pages/CustomerPanel/CustomerPanel';

// Import Layout
import MainLayout from './layouts/MainLayout'; // Correct import path

// Import Global CSS
import './App.css';
import './index.css'; // Import base index.css

// Protected Route Component
const ProtectedRoute: React.FC<{ allowedRoles?: ('admin' | 'user')[] }> = ({ allowedRoles }) => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        // Optional: Show a more robust loading indicator for the whole app
        return (
            <div className="app-loading-indicator">
                <i className="fas fa-spinner fa-spin fa-3x"></i>
                <p>Carregando Aplicação...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    // Role-based access control (Optional)
    if (allowedRoles) {
        const isAdmin = user?.permissions?.is_admin ?? false;
        // Add more role checks based on `user.permissions` if needed
        const userRole = isAdmin ? 'admin' : 'user'; // Simplified role assignment

        if (!allowedRoles.includes(userRole)) {
             // Redirect to home or an unauthorized page if role not allowed
            console.warn(`User role '${userRole}' not allowed for this route. Allowed: ${allowedRoles.join(', ')}`);
            return <Navigate to="/" replace />;
        }
    }

    // If authenticated and role (if specified) is allowed, render the nested routes/component
    return <Outlet />; // Renders the child routes defined within the ProtectedRoute
};

// Define Layout Route Component
const LayoutRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <MainLayout>{children}</MainLayout>;
};


// AppRoutes Component
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth(); // Get auth state here if needed for public routes

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />

      {/* Protected Routes using MainLayout */}
      <Route element={<ProtectedRoute />}> {/* Wrap protected routes */}
          <Route path="/" element={<LayoutRoute><Home /></LayoutRoute>} />
          <Route path="/products" element={<LayoutRoute><Products /></LayoutRoute>} />
          <Route path="/fabrics" element={<LayoutRoute><Fabrics /></LayoutRoute>} />
          <Route path="/customer-panel" element={<LayoutRoute><CustomerPanel /></LayoutRoute>} />
          {/* Example Help Page */}
          <Route path="/help" element={<LayoutRoute><div><h2>Ajuda</h2><p>Conteúdo da página de ajuda...</p></div></LayoutRoute>} />
      </Route>

      {/* Admin Only Route */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}> {/* Admin specific routes */}
           <Route path="/users" element={<LayoutRoute><Users /></LayoutRoute>} />
      </Route>


      {/* Fallback Route - Redirects unknown paths to home if authenticated, or login if not */}
       <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />

    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;