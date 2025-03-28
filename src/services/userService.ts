// src/services/userService.ts

// Import specific API functions and ApiError
import { getUsers, getUser, createUser as apiCreateUser, updateUser as apiUpdateUser, deleteUser as apiDeleteUser, ApiError } from '../utils/api';

// --- Interfaces ---

// Interface matching Backend API response for User Permissions
interface ApiUserPermissions {
    id?: number | null;
    user_id: number;
    is_admin: boolean;
    can_access_products: boolean;
    can_access_fabrics: boolean;
    can_access_customer_panel: boolean;
    can_access_fiscal: boolean;
}

// Interface matching Backend API response for a User
export interface ApiUser {
  id: number;
  username: string;
  name: string;
  email: string | null;
  created_at: string; // ISO string
  last_login: string | null; // ISO string or null
  is_active: boolean;
  permissions: ApiUserPermissions | null;
}

// Interface for the structure returned by the GET /api/users endpoint
interface ApiUserListResponse {
    users: ApiUser[];
}


// Frontend interface (using camelCase) - used by components
export interface User {
    id: number;
    username: string;
    name: string;
    email?: string | null;
    isActive: boolean;
    lastLogin?: string | null; // Store as formatted string or Date? Keep ISO string for now
    createdAt: string; // Store as ISO string
    permissions: {
      isAdmin: boolean;
      canAccessProducts: boolean;
      canAccessFabrics: boolean;
      canAccessCustomerPanel: boolean;
      canAccessFiscal: boolean;
    };
}

// Interface for creating a user (payload sent TO backend - snake_case)
export interface UserCreatePayload {
  username: string;
  name: string;
  email?: string;
  password?: string; // Required for creation
  is_active: boolean;
  is_admin: boolean;
  can_access_products: boolean;
  can_access_fabrics: boolean;
  can_access_customer_panel: boolean;
  can_access_fiscal: boolean; // Include fiscal permission
}

// Interface for updating a user (payload sent TO backend - snake_case)
export interface UserUpdatePayload extends Omit<UserCreatePayload, 'username' | 'password'> {
  password?: string; // Optional for update
}

// --- Mapping Function ---
function mapApiUserToFrontend(apiUser: ApiUser): User {
    const defaultPermissions = {
        isAdmin: false,
        canAccessProducts: false,
        canAccessFabrics: false,
        canAccessCustomerPanel: false,
        canAccessFiscal: false,
    };

    // Use API permissions if available, otherwise use defaults
    const apiPerms = apiUser.permissions;
    const frontendPermissions = apiPerms ? {
        isAdmin: apiPerms.is_admin,
        canAccessProducts: apiPerms.can_access_products,
        canAccessFabrics: apiPerms.can_access_fabrics,
        canAccessCustomerPanel: apiPerms.can_access_customer_panel,
        canAccessFiscal: apiPerms.can_access_fiscal,
    } : defaultPermissions;

     // Format dates immediately if desired, otherwise keep ISO strings
     const formatOptionalDate = (dateString: string | null): string | null => {
         if (!dateString) return null;
         try {
             return new Date(dateString).toLocaleString('pt-BR');
         } catch { return dateString; } // Fallback
     };
     const formatRequiredDate = (dateString: string): string => {
         try {
             return new Date(dateString).toLocaleString('pt-BR');
         } catch { return dateString; } // Fallback
     };


    return {
        id: apiUser.id,
        username: apiUser.username,
        name: apiUser.name,
        email: apiUser.email,
        isActive: apiUser.is_active,
        lastLogin: formatOptionalDate(apiUser.last_login), // Format date here
        createdAt: formatRequiredDate(apiUser.created_at), // Format date here
        permissions: frontendPermissions,
    };
}


// --- Service Functions ---

/** Fetches all users and maps them to the frontend structure. */
export async function getAllUsers(): Promise<User[]> {
  try {
    const response: ApiUserListResponse = await getUsers();
    if (!response || !Array.isArray(response.users)) {
      console.error("Invalid response format for getAllUsers:", response);
      throw new Error("Formato de resposta inválido ao buscar usuários.");
    }
    return response.users.map(mapApiUserToFrontend);
  } catch (error) {
    console.error('Erro no serviço getAllUsers:', error);
     return []; // Return empty array on error
  }
}

/** Fetches a single user and maps it to the frontend structure. */
export async function getUserById(userId: number): Promise<User | null> {
    try {
        const response: ApiUser = await getUser(userId);
        if (!response) return null;
        return mapApiUserToFrontend(response);
    } catch (error) {
         if (error instanceof ApiError && error.status === 404) {
            return null; // Not found
         }
        console.error(`Erro no serviço getUserById ${userId}:`, error);
        throw error; // Re-throw other errors
    }
}


/** Creates a new user. Expects payload in backend format (snake_case). */
export async function createUser(userData: UserCreatePayload): Promise<void> {
    if (!userData.password) {
        throw new Error("Senha é obrigatória para criar usuário.");
    }
    try {
        await apiCreateUser(userData);
    } catch (error) {
        console.error('Erro no serviço createUser:', error);
         if (error instanceof ApiError) {
            throw new Error(error.message || "Erro ao criar usuário.");
         }
        throw new Error("Falha ao criar usuário.");
    }
}

/** Updates an existing user. Expects payload in backend format (snake_case). */
export async function updateUser(userId: number, userData: UserUpdatePayload): Promise<void> {
    try {
        await apiUpdateUser(userId, userData);
    } catch (error) {
        console.error(`Erro no serviço updateUser ${userId}:`, error);
         if (error instanceof ApiError) {
            // Extract specific validation messages if backend provides them
            const detail = (error.data as any)?.detail; // Example if backend sends { "detail": "..." }
            throw new Error(detail || error.message || `Erro ao atualizar usuário ${userId}.`);
         }
        throw new Error(`Falha ao atualizar usuário ${userId}.`);
    }
}

/** Deletes a user. */
export async function deleteUser(userId: number): Promise<void> {
    try {
        await apiDeleteUser(userId);
    } catch (error) {
        console.error(`Erro no serviço deleteUser ${userId}:`, error);
         if (error instanceof ApiError) {
            throw new Error(error.message || `Erro ao excluir usuário ${userId}.`);
         }
        throw new Error(`Falha ao excluir usuário ${userId}.`);
    }
}