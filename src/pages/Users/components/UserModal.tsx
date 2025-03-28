// src/pages/Users/components/UserModal.tsx

import React, { useState, useEffect } from 'react';
// Use frontend User interface for props, use Payloads for saving
import { User, UserCreatePayload, UserUpdatePayload } from '../../../services/userService';
import styles from '../Users.module.css';
import BaseModal from '../../../components/BaseModal/BaseModal';

interface UserModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  user?: User | null; // Receive frontend User type, allow null
  onClose: () => void;
  // Callback expects backend payload format
  onSave: (payload: UserCreatePayload | UserUpdatePayload) => Promise<void>;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, mode, user, onClose, onSave }) => {
  // State for form fields
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  // Permissions state
  const [isAdmin, setIsAdmin] = useState(false);
  const [canAccessProducts, setCanAccessProducts] = useState(false);
  const [canAccessFabrics, setCanAccessFabrics] = useState(false);
  const [canAccessCustomerPanel, setCanAccessCustomerPanel] = useState(false);
  const [canAccessFiscal, setCanAccessFiscal] = useState(false); // Add fiscal state

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens or user/mode changes while open
  useEffect(() => {
    if (isOpen) {
      resetForm(); // Clear previous state
      if (mode === 'edit' && user) {
        // Populate form with frontend User data (camelCase)
        setUsername(user.username);
        setName(user.name);
        setEmail(user.email || '');
        setIsActive(user.isActive);
        // Populate permissions from frontend User object
        setIsAdmin(user.permissions.isAdmin);
        setCanAccessProducts(user.permissions.canAccessProducts);
        setCanAccessFabrics(user.permissions.canAccessFabrics);
        setCanAccessCustomerPanel(user.permissions.canAccessCustomerPanel);
        setCanAccessFiscal(user.permissions.canAccessFiscal);
        // Password field remains empty for edits unless user types a new one
      }
    }
  }, [isOpen, mode, user]); // Rerun effect if these change

  const resetForm = () => {
    setUsername('');
    setName('');
    setEmail('');
    setPassword('');
    setIsActive(true);
    setIsAdmin(false);
    setCanAccessProducts(false);
    setCanAccessFabrics(false);
    setCanAccessCustomerPanel(false);
    setCanAccessFiscal(false); // Reset fiscal permission
    setError('');
    setLoading(false); // Ensure loading is reset
  };

  const handleSubmit = async () => {
    setError(''); // Clear previous errors

    // Basic Validations
    if (!username.trim() || !name.trim()) {
      setError('Nome de usuário e Nome completo são obrigatórios.');
      return;
    }
    if (mode === 'add' && !password.trim()) {
      setError('A senha é obrigatória para novos usuários.');
      return;
    }
    // Optional: Add email format validation if needed

    setLoading(true);

    // Prepare payload matching backend expectations (snake_case)
    const basePayload = {
      name: name.trim(),
      email: email.trim() || undefined, // Send undefined if empty/whitespace only
      is_active: isActive,
      is_admin: isAdmin,
      can_access_products: canAccessProducts,
      can_access_fabrics: canAccessFabrics,
      can_access_customer_panel: canAccessCustomerPanel,
      can_access_fiscal: canAccessFiscal, // Include fiscal permission
    };

    let payload: UserCreatePayload | UserUpdatePayload;

    if (mode === 'add') {
        payload = {
            ...basePayload,
            username: username.trim(),
            password: password, // Send password for creation
        } as UserCreatePayload;
    } else { // mode === 'edit'
         payload = { ...basePayload } as UserUpdatePayload;
         // Only include password if it was actually changed
         if (password.trim()) {
              payload.password = password;
         }
    }


    try {
      await onSave(payload); // Call the save function passed via props
      // No need to call onClose here, the parent component (Users.tsx) does it in its handler
    } catch (error: any) {
      console.error("Error saving user in modal:", error)
      // Display the error message thrown by the service
      setError(error.message || 'Erro desconhecido ao salvar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => (
    <>
      {/* Use a form element for better accessibility and potential Enter key submission */}
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate>

        <div className={styles.formGroup}>
          <label htmlFor="user-modal-username">Nome de Usuário *</label>
          <input
            type="text"
            id="user-modal-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={mode === 'edit' || loading} // Disable username on edit
            required
            aria-required="true"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="user-modal-name">Nome Completo *</label>
          <input
            type="text"
            id="user-modal-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            aria-required="true"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="user-modal-email">Email</label>
          <input
            type="email"
            id="user-modal-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="exemplo@dominio.com"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="user-modal-password">
            Senha {mode === 'add' ? '*' : ''}
          </label>
          <input
            type="password"
            id="user-modal-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={mode === 'add'}
            aria-required={mode === 'add'}
            disabled={loading}
            placeholder={mode === 'edit' ? 'Deixe em branco para não alterar' : 'Digite a senha'}
            autoComplete="new-password" // Prevent browser autofill issues
          />
          {mode === 'edit' && (
            <small className={styles.helpText}>Deixe em branco para manter a senha atual.</small>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>Status</label>
          <div className={styles.toggleSwitch}>
            <input
              type="checkbox"
              id="user-modal-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={loading}
            />
            {/* Associate label with input */}
            <label htmlFor="user-modal-active" className={styles.toggleLabel}></label>
            <span>{isActive ? 'Ativo' : 'Inativo'}</span>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Permissões</label>
          <div className={styles.permissionsContainer}>
            {/* Admin Permission */}
            <div className={styles.permissionItem}>
              <input
                type="checkbox"
                id="permission-modal-admin"
                className={styles.permissionCheckbox}
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="permission-modal-admin">Administrador (Acesso Total)</label>
            </div>

            {/* Specific Permissions (Conditionally disable if admin is checked) */}
            <div className={styles.permissionItem}>
              <input
                type="checkbox"
                id="permission-modal-products"
                className={styles.permissionCheckbox}
                checked={canAccessProducts || isAdmin} // Admin implies access
                onChange={(e) => setCanAccessProducts(e.target.checked)}
                disabled={loading || isAdmin} // Disable if admin checked
              />
              <label htmlFor="permission-modal-products">Produtos Acabados</label>
            </div>

            <div className={styles.permissionItem}>
              <input
                type="checkbox"
                id="permission-modal-fabrics"
                className={styles.permissionCheckbox}
                checked={canAccessFabrics || isAdmin}
                onChange={(e) => setCanAccessFabrics(e.target.checked)}
                disabled={loading || isAdmin}
              />
              <label htmlFor="permission-modal-fabrics">Tecidos</label>
            </div>

            <div className={styles.permissionItem}>
              <input
                type="checkbox"
                id="permission-modal-customer-panel"
                className={styles.permissionCheckbox}
                checked={canAccessCustomerPanel || isAdmin}
                onChange={(e) => setCanAccessCustomerPanel(e.target.checked)}
                disabled={loading || isAdmin}
              />
              <label htmlFor="permission-modal-customer-panel">Painel do Cliente</label>
            </div>

             <div className={styles.permissionItem}>
              <input
                type="checkbox"
                id="permission-modal-fiscal"
                className={styles.permissionCheckbox}
                checked={canAccessFiscal || isAdmin}
                onChange={(e) => setCanAccessFiscal(e.target.checked)}
                disabled={loading || isAdmin}
              />
              <label htmlFor="permission-modal-fiscal">Módulo Fiscal</label>
            </div>

          </div>
        </div>

        {error && (
          <div className={styles.formError}>
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

         {/* Footer Buttons - Moved outside the form to be handled by BaseModal structure */}
         {/* But kept logic here */}
         <div className={styles.modalFooter}>
            <button type="button" className="btn secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit" // Make this the submit button for the form
              className="btn primary"
            //   onClick={handleSubmit} // onClick removed, form onSubmit handles it
              disabled={loading || !username.trim() || !name.trim() || (mode === 'add' && !password.trim())} // Basic validation for disabling
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Salvando...
                </>
              ) : (
                mode === 'add' ? 'Criar Usuário' : 'Salvar Alterações'
              )}
            </button>
         </div>

      </form>

    </>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={!loading ? onClose : () => {}} // Prevent closing while loading
      title={mode === 'add' ? 'Adicionar Novo Usuário' : `Editar Usuário: ${username}`}
      className={styles.userModalContent} // Use a specific class for user modal styling
    >
      {renderContent()}
    </BaseModal>
  );
};

export default UserModal;