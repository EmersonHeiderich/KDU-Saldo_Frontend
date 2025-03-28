// src/services/authService.ts

// Re-export ApiError from utils/api for consistency
export { ApiError } from '../utils/api';
import * as api from '../utils/api';

// Interface matching the 'user' object returned by the backend login/verify endpoints
export interface ApiUser {
  id: number;
  username: string;
  name?: string; // Assuming backend might return this
  email?: string; // Assuming backend might return this
  is_active: boolean;
  permissions: {
    id?: number; // Permissions might have their own ID from the DB
    user_id: number;
    is_admin: boolean;
    can_access_products: boolean;
    can_access_fabrics: boolean;
    can_access_customer_panel: boolean;
    can_access_fiscal: boolean; // Ensure this is included
  };
}

interface LoginApiResponse {
  message: string;
  token: string;
  user: ApiUser;
}

interface VerifyApiResponse {
    message: string;
    user: ApiUser;
}


export async function login(username: string, password: string): Promise<boolean> {
  try {
    const response: LoginApiResponse = await api.login(username, password);
    if (response && response.token && response.user) {
      localStorage.setItem('token', response.token);
      // Store the user object exactly as received from the backend
      localStorage.setItem('user', JSON.stringify(response.user));
      return true;
    }
    // Throw error if response structure is unexpected
    throw new Error('Resposta de login inválida recebida do servidor.');

  } catch (error) {
    console.error("Erro no serviço de login:", error);
    // Enhance error message based on status if available
     if (error instanceof api.ApiError) {
         if (error.status === 401) {
             throw new Error('Credenciais inválidas ou usuário inativo.');
         }
         // Use the specific message from ApiError if available
         throw new Error(error.message || 'Erro desconhecido durante o login.');
     }
    throw new Error('Falha ao tentar fazer login.'); // Generic fallback
  }
}

export async function verifyToken(): Promise<boolean> {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    // No need to pass token, apiRequest handles it via localStorage
    const response: VerifyApiResponse = await api.verifyToken();
    if (response && response.user) {
        // Update user data in localStorage with the latest from the server
        localStorage.setItem('user', JSON.stringify(response.user));
        return true;
    }
    // If verify succeeds but response is weird, treat as failure
    throw new Error('Resposta de verificação inválida.');

  } catch (error) {
    console.error('Erro ao verificar token no serviço:', error);
    // Clear local storage on verification failure (invalid/expired token)
    // This happens automatically in apiRequest for 401, but do it here too just in case
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
}

export async function logout(): Promise<void> {
    // The API call might fail if token is already invalid, but we still want to clear local storage
    try {
      await api.logout();
    } catch (error) {
      // Log the error but don't prevent local cleanup
      console.warn("Erro ao chamar API de logout (pode ser normal se o token já for inválido):", error);
    } finally {
        // Always clear local storage regardless of API call success/failure
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use useNavigate hook in component instead of direct reload
        // For simplicity matching original request, keep reload for now.
        // If navigation issues arise, move navigation logic to component.
        // window.location.reload(); // Removed - navigation should handle this
    }
}

// Helper function to get user data from localStorage
export function getCurrentUser(): ApiUser | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        // Add basic validation for the parsed object
        const parsedUser = JSON.parse(userStr);
        if (parsedUser && typeof parsedUser === 'object' && parsedUser.id && parsedUser.username && parsedUser.permissions) {
           return parsedUser as ApiUser;
        }
        console.warn("Invalid user data format found in localStorage.");
        localStorage.removeItem('user'); // Clear invalid data
        return null;
    } catch (e) {
        console.error("Error parsing user data from localStorage", e);
         localStorage.removeItem('user'); // Clear corrupted data
        return null;
    }
}