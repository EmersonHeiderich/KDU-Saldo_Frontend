// src/pages/Users/Users.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// Use frontend User interface and service functions
import * as userService from '../../services/userService';
import { User, UserCreatePayload, UserUpdatePayload } from '../../services/userService';
import UserModal from './components/UserModal';
import ConfirmModal from './components/ConfirmModal';
import styles from './Users.module.css';
import '../../components/BaseModal/BaseModal.css'; // Ensure BaseModal CSS is loaded

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]); // Store frontend User objects
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined); // Store frontend User object

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (currentUser && !currentUser.permissions.is_admin) {
      navigate('/'); // Redirect non-admins
    }
  }, [currentUser, navigate]);

  // --- Data Loading ---
  const loadUsers = useCallback(async () => {
    if (!currentUser?.permissions.is_admin) return; // Prevent loading if not admin

    setLoading(true);
    setError(null);
    try {
      const data = await userService.getAllUsers(); // Fetches and maps to frontend User[]
      setUsers(data);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      setError(error.message || 'Erro ao carregar usuários');
      setUsers([]); // Ensure state is empty array on error
    } finally {
      setLoading(false);
    }
  }, [currentUser]); // Depend on currentUser to ensure permissions are checked

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]); // Use the memoized loadUsers

  // --- Filtering ---
  const filterUsers = useCallback(() => {
    if (!searchText.trim()) {
      setFilteredUsers(users);
      return;
    }
    const lowerSearchText = searchText.toLowerCase();
    const filtered = users.filter(
      user =>
        user.username.toLowerCase().includes(lowerSearchText) ||
        user.name.toLowerCase().includes(lowerSearchText) ||
        (user.email && user.email.toLowerCase().includes(lowerSearchText))
    );
    setFilteredUsers(filtered);
  }, [searchText, users]); // Depend on searchText and users

  // Filter users whenever search text or the main users list changes
  useEffect(() => {
    filterUsers();
  }, [filterUsers]); // Use the memoized filterUsers

  // --- Event Handlers ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const openAddUserModal = () => {
    setUserModalMode('add');
    setSelectedUser(undefined); // Clear selected user
    setUserModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setUserModalMode('edit');
    setSelectedUser(user); // Set the selected frontend User object
    setUserModalOpen(true);
  };

  const closeUserModal = () => {
    setUserModalOpen(false);
    setSelectedUser(undefined); // Clear selection on close
  };

  const openDeleteConfirmModal = (userId: number) => {
    if (userId === currentUser?.id) {
       alert("Você não pode excluir sua própria conta.");
       return;
    }
    setUserToDelete(userId);
    setConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setUserToDelete(null);
  };

  // Saves user data (called from UserModal)
  // Expects payload in BACKEND format (snake_case)
  const handleSaveUser = async (payload: UserCreatePayload | UserUpdatePayload) => {
    // No need to map here, payload is already in backend format
    try {
      if (userModalMode === 'add') {
        await userService.createUser(payload as UserCreatePayload);
      } else if (selectedUser) {
        // Make sure not to include username in update payload
        const { username, ...updatePayload } = payload as UserUpdatePayload & { username?: string };
        await userService.updateUser(selectedUser.id, updatePayload);
      }
      await loadUsers(); // Reload user list after save
      closeUserModal(); // Close modal on success
    } catch (error: any) {
      console.error('Erro ao salvar usuário (handleSaveUser):', error);
      // Re-throw the error so the modal can display it
      throw error;
    }
  };


  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    try {
      await userService.deleteUser(userToDelete);
      await loadUsers(); // Reload user list
      closeConfirmModal();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      alert(`Erro ao excluir usuário: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Render Functions ---

  const renderUserRow = (user: User) => {
    // Use formatted dates directly from the User object if formatted in service
    const lastLoginDisplay = user.lastLogin || 'Nunca';
    const createdAtDisplay = user.createdAt || '-';

    return (
      <tr key={user.id}>
        <td>{user.username}</td>
        <td>{user.name}</td>
        <td>{user.email || '-'}</td>
        <td>{lastLoginDisplay}</td>
        <td>
          <span className={`${styles.statusBadge} ${user.isActive ? styles.active : styles.inactive}`}>
            {user.isActive ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td>
          <div className={styles.permissionsBadges}>
            {user.permissions.isAdmin && (
              <span className={`${styles.permissionBadge} ${styles.admin}`} title="Administrador">Admin</span>
            )}
            {user.permissions.canAccessProducts && (
              <span className={`${styles.permissionBadge} ${styles.products}`} title="Acesso a Produtos Acabados">Produtos</span>
            )}
            {user.permissions.canAccessFabrics && (
              <span className={`${styles.permissionBadge} ${styles.fabrics}`} title="Acesso a Tecidos">Tecidos</span>
            )}
            {user.permissions.canAccessCustomerPanel && (
              <span className={`${styles.permissionBadge} ${styles.customerPanel}`} title="Acesso ao Painel do Cliente">Cliente</span>
            )}
            {user.permissions.canAccessFiscal && (
              <span className={`${styles.permissionBadge} ${styles.fiscal}`} title="Acesso ao Módulo Fiscal">Fiscal</span>
            )}
            {/* Display '-' if no specific permissions and not admin */}
             {!user.permissions.isAdmin && !user.permissions.canAccessProducts && !user.permissions.canAccessFabrics && !user.permissions.canAccessCustomerPanel && !user.permissions.canAccessFiscal && (
                 <span>-</span>
             )}
          </div>
        </td>
        <td>
          <div className={styles.actions}>
            <button
              className={`${styles.btnIcon} ${styles.edit}`}
              onClick={() => openEditUserModal(user)}
              aria-label={`Editar usuário ${user.username}`}
              title="Editar Usuário"
            >
              <i className="fas fa-edit"></i>
            </button>
            {currentUser?.id !== user.id && ( // Don't show delete for self
                 <button
                    className={`${styles.btnIcon} ${styles.delete}`}
                    onClick={() => openDeleteConfirmModal(user.id)}
                    aria-label={`Excluir usuário ${user.username}`}
                    title="Excluir Usuário"
                >
                    <i className="fas fa-trash-alt"></i>
                </button>
            )}

          </div>
        </td>
      </tr>
    );
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={7} className={styles.loadingRow}>
            <div className={styles.spinnerSmall}></div>
            <span>Carregando usuários...</span>
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={7} className={styles.errorRow}>
            <i className="fas fa-exclamation-triangle"></i>
            <span>{error}</span>
          </td>
        </tr>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <tr>
          <td colSpan={7} className={styles.emptyRow}>
            <i className="fas fa-users-slash"></i>
            <span>{searchText ? 'Nenhum usuário encontrado para a busca.' : 'Nenhum usuário cadastrado.'}</span>
          </td>
        </tr>
      );
    }

    return filteredUsers.map(renderUserRow);
  };

  // --- JSX ---
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Gerenciamento de Usuários</h1>
        <p className={styles.subtitle}>Administração de usuários e permissões do sistema</p>
      </header>

      <div className={styles.usersContainer}>
        <div className={styles.actionsBar}>
          <button
            id="btn-add-user"
            className="btn primary"
            onClick={openAddUserModal}
          >
            <i className="fas fa-user-plus"></i> Novo Usuário
          </button>
          <div className={styles.searchBox}>
            <input
              type="text"
              id="search-users"
              placeholder="Buscar por nome, usuário ou email..."
              value={searchText}
              onChange={handleSearchChange}
              aria-label="Buscar usuários"
            />
            <i className="fas fa-search"></i>
          </div>
        </div>

        <div className={styles.usersTableContainer}>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Nome Completo</th>
                <th>Email</th>
                <th>Último Login</th>
                <th>Status</th>
                <th>Permissões</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {renderTableContent()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={userModalOpen}
        mode={userModalMode}
        user={selectedUser} // Pass the frontend User object
        onClose={closeUserModal}
        onSave={handleSaveUser} // Pass the save handler
      />

      <ConfirmModal
        isOpen={confirmModalOpen}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este usuário permanentemente? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDeleteUser}
        onCancel={closeConfirmModal}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default Users;