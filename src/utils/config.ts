// src/utils/config.ts

// Use environment variable if available, otherwise fallback
// Ensure you have VITE_API_BASE_URL in your .env file at the project root
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5004';
console.log("Using API Base URL:", API_BASE_URL); // Log the URL being used

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  VERIFY_TOKEN: `${API_BASE_URL}/api/auth/verify`,

  // Users
  USERS: `${API_BASE_URL}/api/users`, // Base for GET (all), POST
  USER_DETAIL: (userId: number) => `${API_BASE_URL}/api/users/${userId}`, // For GET (one), PUT, DELETE

  // Products
  PRODUCT_MATRIX: `${API_BASE_URL}/api/products/balance_matrix`,

  // Fabrics
  FABRIC_BALANCES: `${API_BASE_URL}/api/fabrics/balances`,
  FABRIC_CACHE_CLEAR: `${API_BASE_URL}/api/fabrics/cache/clear`,

  // Observations
  PRODUCT_OBSERVATIONS: (referenceCode: string) => `${API_BASE_URL}/api/observations/product/${encodeURIComponent(referenceCode)}`, // For POST, GET
  OBSERVATION_COUNT: (referenceCode: string) => `${API_BASE_URL}/api/observations/product/${encodeURIComponent(referenceCode)}/unresolved_count`, // For GET
  RESOLVE_OBSERVATION: (observationId: number) => `${API_BASE_URL}/api/observations/${observationId}/resolve`, // For PUT
  PENDING_OBSERVATIONS_REFERENCES: `${API_BASE_URL}/api/observations/pending_references`, // For GET

  // Customer Panel
  CUSTOMER_DATA: `${API_BASE_URL}/api/customer_panel/data`, // For POST
  CUSTOMER_STATISTICS: `${API_BASE_URL}/api/customer_panel/statistics`, // For GET (uses query params)

  // Fiscal --- NEW ---
  FISCAL_INVOICES_SEARCH: `${API_BASE_URL}/api/fiscal/invoices/search`, // For POST search
  // DANFE generation might involve multiple steps handled by the service,
  // but if the backend exposes a direct endpoint for the final PDF:
  FISCAL_DANFE_GENERATE: (accessKey: string) => `${API_BASE_URL}/api/fiscal/danfe/${encodeURIComponent(accessKey)}`, // For GET PDF

};

// Ensure VITE_API_BASE_URL is defined in .env (create if not exists)
// Example .env file content:
// VITE_API_BASE_URL=http://localhost:5004