// src/components/Sidebar/Sidebar.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';

// --- New Props ---
interface SidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}
// -----------------

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => { // Use props
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mobileToggleButtonRef = useRef<HTMLButtonElement>(null); // Ref for Mobile toggle

  // --- Permissions (no changes needed) ---
  const defaultPermissions = {
    is_admin: false,
    can_access_products: false,
    can_access_fabrics: false,
    can_access_customer_panel: false,
    can_access_fiscal: false,
  };
  const permissions = user?.permissions || defaultPermissions;
  const isAdmin = permissions.is_admin;
  const canAccessProducts = isAdmin || permissions.can_access_products;
  const canAccessFabrics = isAdmin || permissions.can_access_fabrics;
  const canAccessCustomerPanel = isAdmin || permissions.can_access_customer_panel;
  const canAccessFiscal = isAdmin || permissions.can_access_fiscal;

  // --- Actions ---
  const openMobileSidebar = () => setIsMobileOpen(true);
  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);

  const handleLogout = async () => {
    closeMobileSidebar();
    try { await logout(); } catch (error) { console.error('Erro ao fazer logout:', error); }
  };

  // --- Event Listeners for Mobile Closing (no changes needed) ---
  // --- Event Listeners for Mobile Closing ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        mobileToggleButtonRef.current && // Check if mobile toggle exists
        !mobileToggleButtonRef.current.contains(event.target as Node) // Don't close if clicking mobile toggle
      ) {
        closeMobileSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileOpen, closeMobileSidebar]);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (isMobileOpen && event.key === 'Escape') {
        closeMobileSidebar();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isMobileOpen, closeMobileSidebar]);

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobileSidebar();
  }, [location, closeMobileSidebar]);

  // --- Effect to close Desktop Sidebar on outside click ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only run if sidebar is expanded and not on mobile view
      if (
        !isCollapsed &&
        !isMobileOpen && // Ensure mobile menu isn't open
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onToggleCollapse(); // Minimize the sidebar
      }
    };

    // Add listener only when sidebar is expanded
    if (!isCollapsed) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed, isMobileOpen, onToggleCollapse]); // Add isMobileOpen dependency


  // --- Menu Items (no changes needed) ---
  const menuItems: { path: string; label: string; icon: string; requiresAuth: boolean }[] = [];
   // Add items back
   menuItems.push(
       { path: '/', label: 'Início', icon: 'fas fa-home', requiresAuth: true },
       { path: '/products', label: 'Produtos Acabados', icon: 'fas fa-tshirt', requiresAuth: canAccessProducts },
       { path: '/fabrics', label: 'Tecidos', icon: 'fas fa-layer-group', requiresAuth: canAccessFabrics },
       { path: '/customer-panel', label: 'Painel do Cliente', icon: 'fas fa-address-card', requiresAuth: canAccessCustomerPanel },
       { path: '/fiscal', label: 'Módulo Fiscal', icon: 'fas fa-file-invoice-dollar', requiresAuth: canAccessFiscal },
       { path: '/users', label: 'Usuários', icon: 'fas fa-users-cog', requiresAuth: isAdmin }
   );


  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        ref={mobileToggleButtonRef}
        className={styles.menuToggle}
        onClick={isMobileOpen ? closeMobileSidebar : openMobileSidebar}
        aria-label={isMobileOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isMobileOpen}
        aria-controls="main-sidebar"
      >
        <i className={isMobileOpen ? "fas fa-times" : "fas fa-bars"}></i>
      </button>

      {/* Overlay for Mobile View */}
      <div
          className={`${styles.sidebarOverlay} ${isMobileOpen ? styles.active : ''}`}
          onClick={closeMobileSidebar}
          aria-hidden="true"
       />

      {/* Sidebar Navigation */}
      <nav
        ref={sidebarRef}
        id="main-sidebar"
        // Apply mobile active AND desktop collapsed classes
        className={`${styles.sidebar} ${isMobileOpen ? styles.active : ''} ${isCollapsed ? styles.collapsed : ''}`}
        aria-label="Menu Principal"
      >
        <div className={styles.sidebarHeader}>
          {/* Conditionally render Title or Icon with click handler */}
          {!isCollapsed && <h2>Menu</h2>}
          {isCollapsed && (
            <i
              className={`fas fa-bars ${styles.collapsedHeaderIcon}`}
              onClick={onToggleCollapse} // Add click handler here
              style={{ cursor: 'pointer' }} // Indicate it's clickable
              title="Expandir menu" // Add title for accessibility
            ></i>
          )}

          {/* Mobile Close Button */}
          <button
            className={styles.sidebarClose}
            onClick={closeMobileSidebar}
            aria-label="Fechar menu"
          >
            <i className="fas fa-times"></i>
          </button>

          {/* Desktop Collapse Button REMOVED */}

        </div>

        {/* Menu List */}
        <ul className={styles.sidebarMenu}>
           {menuItems.filter(item => item.requiresAuth).map(item => (
              <li key={item.path} title={isCollapsed ? item.label : undefined}> {/* Show label on hover when collapsed */}
                 <NavLink
                    to={item.path}
                    className={({ isActive }) => isActive ? styles.activeLink : styles.inactiveLink}
                    // onClick={closeMobileSidebar} // Close handled by location useEffect
                    end={item.path === '/'}
                 >
                    <i className={item.icon}></i>
                    {/* Conditionally render label text */}
                    {!isCollapsed && <span>{item.label}</span>}
                 </NavLink>
              </li>
           ))}

          <li className={styles.menuDivider}></li>
          <li title={isCollapsed ? "Sair" : undefined}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleLogout(); }}
              className={styles.inactiveLink}
            >
              <i className="fas fa-sign-out-alt"></i>
              {!isCollapsed && <span>Sair</span>}
            </a>
          </li>
        </ul>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          {/* Conditionally render content based on collapse */}
          {!isCollapsed && user?.name && <p title={user.username}>Usuário: {user.name}</p>}
           {!isCollapsed && <p className={styles.appVersion}>v1.0.1</p>}
           {isCollapsed && <i className="fas fa-user-circle" title={`Usuário: ${user?.name || user?.username}`}></i>} {/* Show user icon when collapsed */}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
