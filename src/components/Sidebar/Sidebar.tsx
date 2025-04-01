// src/components/Sidebar/Sidebar.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mobileToggleButtonRef = useRef<HTMLButtonElement>(null);

  // --- Permissions ---
  const defaultPermissions = {
    is_admin: false,
    can_access_products: false,
    can_access_fabrics: false,
    can_access_customer_panel: false,
    can_access_fiscal: false,
    can_access_accounts_receivable: false, // Add AR permission
  };
  // Ensure all expected permission keys exist in user?.permissions before destructuring or accessing
   const userPermissions = user?.permissions
       ? { ...defaultPermissions, ...user.permissions }
       : defaultPermissions;

  const isAdmin = userPermissions.is_admin;
  const canAccessProducts = isAdmin || userPermissions.can_access_products;
  const canAccessFabrics = isAdmin || userPermissions.can_access_fabrics;
  const canAccessCustomerPanel = isAdmin || userPermissions.can_access_customer_panel;
  const canAccessFiscal = isAdmin || userPermissions.can_access_fiscal;
  const canAccessAR = isAdmin || userPermissions.can_access_accounts_receivable; // Check AR permission

  // --- Actions ---
  const openMobileSidebar = () => setIsMobileOpen(true);
  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);

  const handleLogout = async () => {
    closeMobileSidebar();
    try { await logout(); } catch (error) { console.error('Erro ao fazer logout:', error); }
  };

  // --- Event Listeners for Mobile Closing ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        mobileToggleButtonRef.current &&
        !mobileToggleButtonRef.current.contains(event.target as Node)
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
  // (No changes needed here)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !isCollapsed &&
        !isMobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onToggleCollapse();
      }
    };
    if (!isCollapsed) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed, isMobileOpen, onToggleCollapse]);


  // --- Menu Items ---
  // Define menu structure explicitly
    const menuItems: { path: string; label: string; icon: string; requiresAuth: boolean }[] = [
        { path: '/', label: 'Início', icon: 'fas fa-home', requiresAuth: true },
        { path: '/products', label: 'Produtos Acabados', icon: 'fas fa-tshirt', requiresAuth: canAccessProducts },
        { path: '/fabrics', label: 'Tecidos', icon: 'fas fa-layer-group', requiresAuth: canAccessFabrics },
        { path: '/customer-panel', label: 'Painel do Cliente', icon: 'fas fa-address-card', requiresAuth: canAccessCustomerPanel },
        { path: '/fiscal', label: 'Módulo Fiscal', icon: 'fas fa-file-invoice-dollar', requiresAuth: canAccessFiscal },
        // --- NEW Accounts Receivable Item ---
        { path: '/accounts-receivable', label: 'Contas a Receber', icon: 'fas fa-hand-holding-usd', requiresAuth: canAccessAR },
        // --- Admin Item ---
        { path: '/users', label: 'Usuários', icon: 'fas fa-users-cog', requiresAuth: isAdmin }
    ];


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
        className={`${styles.sidebar} ${isMobileOpen ? styles.active : ''} ${isCollapsed ? styles.collapsed : ''}`}
        aria-label="Menu Principal"
      >
        <div className={styles.sidebarHeader}>
          {!isCollapsed && <h2>Menu</h2>}
          {isCollapsed && (
            <i
              className={`fas fa-bars ${styles.collapsedHeaderIcon}`}
              onClick={onToggleCollapse}
              style={{ cursor: 'pointer' }}
              title="Expandir menu"
            ></i>
          )}
          <button
            className={styles.sidebarClose}
            onClick={closeMobileSidebar}
            aria-label="Fechar menu"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Menu List */}
        <ul className={styles.sidebarMenu}>
           {/* Filter and map menu items based on permission */}
           {menuItems.filter(item => item.requiresAuth).map(item => (
              <li key={item.path} title={isCollapsed ? item.label : undefined}>
                 <NavLink
                    to={item.path}
                    className={({ isActive }) => isActive ? styles.activeLink : styles.inactiveLink}
                    end={item.path === '/'} // Ensure exact match for Home
                 >
                    <i className={item.icon}></i>
                    {!isCollapsed && <span>{item.label}</span>}
                 </NavLink>
              </li>
           ))}

          {/* Logout Item */}
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
          {!isCollapsed && user?.name && <p title={user.username}>Usuário: {user.name}</p>}
           {!isCollapsed && <p className={styles.appVersion}>v1.0.1</p>}
           {isCollapsed && <i className="fas fa-user-circle" title={`Usuário: ${user?.name || user?.username}`}></i>}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;