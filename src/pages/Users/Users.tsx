// src/pages/Users/Users.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// Use frontend User interface and service functions
import * as userService from '../../services/userService';
import { User, UserCreatePayload, UserUpdatePayload } from '../../services/userService';

// AG Grid Imports
import AgGridTable from '../../components/AgGridTable/AgGridTable';
import {
    ColDef,
    GridApi,
    GridOptions,
    ICellRendererParams,
    ValueGetterParams, // <-- Keep ValueGetterParams if used
    GridReadyEvent // <-- Added for onGridReady typing clarity
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css'; // Core CSS
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Theme

// Child Components
import UserModal from './components/UserModal';
import ConfirmModal from './components/ConfirmModal';
import PermissionsCellRenderer from './components/PermissionsCellRenderer'; // <-- Import the moved component

// Styles
import styles from './Users.module.css';
import '../../components/BaseModal/BaseModal.css'; // Ensure BaseModal CSS is loaded

// --- Custom Cell Renderer Components (Defined Inline, except Permissions) ---

// Status Cell Renderer (Could be moved to its own file)
const StatusCellRenderer: React.FC<ICellRendererParams<User, boolean>> = ({ value }) => {
    if (value === undefined || value === null) return null;
    return (
        <span className={`${styles.statusBadge} ${value ? styles.active : styles.inactive}`}>
            {value ? 'Ativo' : 'Inativo'}
        </span>
    );
};

// Actions Cell Renderer (Could be moved to its own file)
// Note: Uses context passed via gridOptions to access handlers
const ActionsCellRenderer: React.FC<ICellRendererParams<User>> = ({ data, context }) => {
    const { handleEdit, handleDelete, currentUserId } = context;

    if (!data) return null; // Should not happen if rowData is valid

    const onEditClick = () => handleEdit(data);
    const onDeleteClick = () => handleDelete(data.id);

    return (
        <div className={styles.actions}>
            <button
                className={`${styles.btnIcon} ${styles.edit}`}
                onClick={onEditClick}
                aria-label={`Editar usuário ${data.username}`}
                title="Editar Usuário"
            >
                <i className="fas fa-edit"></i>
            </button>
            {/* Do not allow deleting the currently logged-in user */}
            {currentUserId !== data.id && (
                <button
                    className={`${styles.btnIcon} ${styles.delete}`}
                    onClick={onDeleteClick}
                    aria-label={`Excluir usuário ${data.username}`}
                    title="Excluir Usuário"
                >
                    <i className="fas fa-trash-alt"></i>
                </button>
            )}
        </div>
    );
};


// --- Main Users Component ---
const Users: React.FC = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const gridApiRef = useRef<GridApi<User> | null>(null); // Ref for AG Grid API

    // State
    const [users, setUsers] = useState<User[]>([]); // Store all users
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [userModalMode, setUserModalMode] = useState<'add' | 'edit'>('add');
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Permission Check
    useEffect(() => {
        if (currentUser && !currentUser.permissions.is_admin) {
            navigate('/'); // Redirect non-admins
        }
    }, [currentUser, navigate]);

    // --- Data Loading ---
    const loadUsers = useCallback(async () => {
        if (!currentUser?.permissions.is_admin) return;
        setLoading(true);
        setError(null);
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (error: any) {
            console.error('Erro ao carregar usuários:', error);
            setError(error.message || 'Erro ao carregar usuários');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // --- AG Grid Configuration ---

    // Column Definitions
    const columnDefs = useMemo<ColDef<User>[]>(() => [
        {
            headerName: 'Usuário',
            field: 'username',
            filter: 'agTextColumnFilter',
            sortable: true,
            resizable: true,
            width: 150,
            minWidth: 120,
            suppressSizeToFit: true, // Don't shrink this column too much
        },
        {
            headerName: 'Nome Completo',
            field: 'name',
            filter: 'agTextColumnFilter',
            sortable: true,
            resizable: true,
            flex: 2, // Allow more space
            minWidth: 200,
        },
        {
            headerName: 'Email',
            field: 'email',
            filter: 'agTextColumnFilter',
            sortable: true,
            resizable: true,
            valueFormatter: (params) => params.value || '-', // Display '-' if null/undefined
            flex: 2,
            minWidth: 200,
        },
        {
            headerName: 'Último Login',
            field: 'lastLogin', // Assumes service formats this
            filter: 'agTextColumnFilter', // Use text filter as it's likely a formatted string
            sortable: true,
            resizable: true,
            width: 170,
            minWidth: 150,
            suppressSizeToFit: true,
        },
        {
            headerName: 'Status',
            field: 'isActive',
            cellRenderer: StatusCellRenderer, // Use inline/imported renderer
            filter: 'agSetColumnFilter', // Allow filtering by Active/Inactive
            filterParams: { // Optional: customize set filter values
                 values: [true, false],
                 valueFormatter: (params: {value: boolean}) => params.value ? 'Ativo' : 'Inativo',
            },
            sortable: true,
            resizable: false, // Usually fixed width
            width: 100,
            maxWidth: 110,
            cellStyle: { textAlign: 'center' },
        },
        {
            headerName: 'Permissões',
            field: 'permissions',
            cellRenderer: PermissionsCellRenderer, // Use imported renderer
            filter: false, // Filtering on this object is complex
            sortable: false, // Sorting on this object is not meaningful
            resizable: true,
            flex: 1,
            minWidth: 180,
            autoHeight: true, // Allow row height to adjust for wrapped badges (if wrapping occurs)
            wrapText: true, // Allow text wrapping in case tooltip fails or for future expansion
        },
        {
            headerName: 'Ações',
            colId: 'actions', // Important for context/params
            cellRenderer: ActionsCellRenderer, // Use inline/imported renderer
            filter: false,
            sortable: false,
            resizable: false,
            width: 100,
            minWidth: 100,
            maxWidth: 100,
            cellStyle: { textAlign: 'center' },
            pinned: 'right', // Keep actions visible on scroll
            lockPinned: true, // Prevent unpinning
        },
    ], []); // Empty dependency array as definitions are static

    // Default Column Definitions
    const defaultColDef = useMemo<ColDef>(() => ({
        resizable: true,
        sortable: true,
        filter: true, // Enable filtering by default
        floatingFilter: true, // Show filter below header
        suppressMenu: false, // Allow column menu (pinning, etc.)
    }), []);

    // Grid Options - includes context for ActionsCellRenderer
    const gridOptions = useMemo<GridOptions<User>>(() => ({
        context: {
            handleEdit: (user: User) => openEditUserModal(user),
            handleDelete: (userId: number) => openDeleteConfirmModal(userId),
            currentUserId: currentUser?.id ?? null,
        },
        pagination: true,
        paginationPageSize: 20, // Adjust as needed
        paginationPageSizeSelector: [10, 20, 50, 100],
        domLayout: 'autoHeight', // Adjust height automatically
        suppressCellFocus: true, // Improves keyboard navigation focus behavior
        animateRows: true, // Enable row animations
        // Optional: Provide a specific row ID to help preserve state
        // getRowId: params => params.data.id.toString(),
    }), [currentUser?.id]); // Recreate options if currentUserId changes


    // AG Grid API Ready Callback
    const onGridReady = useCallback((api: GridApi<User>) => {
        gridApiRef.current = api;
        // Optional: Auto-size columns after grid is ready and data is loaded
        // api.sizeColumnsToFit(); // Be careful with this
    }, []);


    // --- Event Handlers ---
    const openAddUserModal = () => {
        setUserModalMode('add');
        setSelectedUser(undefined);
        setUserModalOpen(true);
    };

    const openEditUserModal = (user: User) => {
        setUserModalMode('edit');
        setSelectedUser(user);
        setUserModalOpen(true);
    };

    const closeUserModal = () => {
        setUserModalOpen(false);
        setSelectedUser(undefined);
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
        setDeleteLoading(false); // Reset delete loading state
    };

    // Save Handler (called from UserModal via props)
    const handleSaveUser = async (payload: UserCreatePayload | UserUpdatePayload) => {
        try {
            if (userModalMode === 'add') {
                await userService.createUser(payload as UserCreatePayload);
            } else if (selectedUser) {
                // The modal prepares the correct payload format (snake_case, no username for update)
                await userService.updateUser(selectedUser.id, payload as UserUpdatePayload);
            }
            await loadUsers(); // Reload user list after save
            closeUserModal(); // Close modal on success
        } catch (error: any) {
            console.error('Erro ao salvar usuário (handleSaveUser):', error);
            throw error; // Re-throw error for the modal to display
        }
    };

    // Delete Handler (called from ConfirmModal via props)
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setDeleteLoading(true);
        try {
            await userService.deleteUser(userToDelete);
            await loadUsers(); // Reload user list
            closeConfirmModal();
        } catch (error: any) {
            console.error('Erro ao excluir usuário:', error);
            // Show error within confirm modal or as an alert
            alert(`Erro ao excluir usuário: ${error.message || 'Erro desconhecido'}`);
            // Optionally keep the modal open if deletion fails, but reset loading
            setDeleteLoading(false);
        }
    };

    // --- JSX ---
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Gerenciamento de Usuários</h1>
                <p className={styles.subtitle}>Administração de usuários e permissões do sistema</p>
            </header>

            <div className={styles.actionsBar}>
                <button
                    id="btn-add-user"
                    className="btn primary"
                    onClick={openAddUserModal}
                    disabled={loading} // Disable if initial load is happening
                >
                    <i className="fas fa-user-plus"></i> Novo Usuário
                </button>
            </div>

            {/* Display error above grid if load failed */}
            {error && !loading && (
                <div className={styles.errorRow}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <span> {error}</span>
                </div>
            )}


            {/* AG Grid Table */}
            {/* Ensure wrapper has theme class and takes space */}
            <div className={`ag-theme-quartz ${styles.gridWrapper}`} style={{ flexGrow: 1, width: '100%' }}>
                <AgGridTable<User>
                    gridId="usersTable" // ID único para salvar estado da grid
                    rowData={users} // Pass the full user list
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    gridOptions={gridOptions} // Pass context via gridOptions
                    isLoading={loading} // Pass loading state
                    onGridReadyCallback={onGridReady}
                    pagination={true}
                    paginationPageSize={20}
                    paginationPageSizeSelector={[10, 20, 50, 100]}
                    domLayout="autoHeight"
                />
            </div>


            {/* Modals */}
            <UserModal
                isOpen={userModalOpen}
                mode={userModalMode}
                user={selectedUser}
                onClose={closeUserModal}
                onSave={handleSaveUser}
            />

            <ConfirmModal
                isOpen={confirmModalOpen}
                title="Confirmar Exclusão"
                message={
                    <>
                        Tem certeza que deseja excluir o usuário{' '}
                        <strong>{users.find(u => u.id === userToDelete)?.username || ''}</strong> permanentemente?
                        <br />
                        Esta ação não pode ser desfeita.
                    </>
                }
                confirmLabel="Excluir"
                onConfirm={handleDeleteUser}
                onCancel={closeConfirmModal}
                isLoading={deleteLoading}
            />
        </div>
    );
};

export default Users;
