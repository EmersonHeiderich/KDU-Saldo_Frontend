// src/utils/api.ts

import { API_ENDPOINTS } from './config';

// Basic Frontend Logger (Replace with a more robust solution if needed)
const logger = {
  debug: (...args: any[]) => console.debug('[API]', ...args),
  info: (...args: any[]) => console.info('[API]', ...args),
  warn: (...args: any[]) => console.warn('[API]', ...args),
  error: (...args: any[]) => console.error('[API]', ...args),
};

// Custom Error for API issues
export class ApiError extends Error {
  status?: number;
  data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Base function for making API requests with authentication and retries.
 * Other exported functions use this internally.
 * @private DO NOT EXPORT DIRECTLY - Use specific functions below
 */
async function _apiRequest( // Renamed with underscore to indicate internal use
  url: string,
  method = 'GET',
  data: any = null,
  requiresAuth = true,
  maxRetries = 1
): Promise<any> {

  const createRequestOptions = (): RequestInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        logger.error(`Authentication required for ${method} ${url}, but no token found.`);
        // Simulate a 401 error to trigger logout/redirect logic
        throw new ApiError('Usuário não autenticado', 401);
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method: method.toUpperCase(),
      headers,
      signal: AbortSignal.timeout(20000), // Increased timeout (20 seconds)
    };

    const bodyMethods = ['POST', 'PUT', 'PATCH'];
    if (data && bodyMethods.includes(options.method!)) {
      try {
        options.body = JSON.stringify(data);
      } catch (stringifyError) {
        logger.error(`Failed to stringify request data for ${method} ${url}:`, stringifyError);
        throw new Error('Falha ao preparar dados da requisição.');
      }
    } else if (data && !bodyMethods.includes(options.method!)) {
      // Only log warning if data is not null or undefined
      if (data !== null && data !== undefined) {
        logger.warn(`Data provided for non-body method (${method}) ${url}. Ignoring data.`);
      }
    }

    return options;
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
        logger.warn(`Retrying ${method} ${url} (Attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const options = createRequestOptions();
      logger.debug(`Requesting: ${method} ${url}`, data ? `with data: ${JSON.stringify(data).substring(0, 100)}...` : '');

      const response = await fetch(url, options);
      logger.debug(`Response Status: ${response.status} for ${method} ${url}`);

      let responseBodyText: string | null = null; // For logging errors
      try {
          // Try reading text first for better error logging regardless of content type
          responseBodyText = await response.text();
      } catch (textError) {
          logger.warn(`Could not read response body as text for ${method} ${url} (Status: ${response.status})`);
      }

      if (!response.ok) {
        let errorMessage = `Erro na API: ${response.status}`;
        let errorData: any = null;
        if (responseBodyText) {
            try {
                errorData = JSON.parse(responseBodyText);
                if (errorData && errorData.error) {
                    errorMessage = errorData.error; // Use specific error from backend if available
                } else {
                    // If no specific 'error' key, use the truncated text response
                    errorMessage = `Erro na API (${response.status}): ${responseBodyText.substring(0, 200)}`;
                }
            } catch (jsonError) {
                 logger.debug('Error response body was not JSON:', responseBodyText.substring(0, 200));
                 errorMessage = `Erro na API (${response.status}): ${responseBodyText.substring(0, 200)}`;
            }
        }
        logger.error(`API Error (${method} ${url}): Status ${response.status}, Message: ${errorMessage}`, errorData);
        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Handle successful responses
      if (response.status === 204 || response.headers.get('content-length') === '0' || !responseBodyText) {
        logger.debug(`Received empty success response (Status ${response.status}) for ${method} ${url}. Returning null.`);
        return null;
      }

      try {
        const jsonData = JSON.parse(responseBodyText);
        logger.debug(`Received successful JSON response for ${method} ${url}:`, JSON.stringify(jsonData).substring(0, 200) + (JSON.stringify(jsonData).length > 200 ? '...' : ''));
        return jsonData;
      } catch (jsonError) {
        logger.error(`Failed to parse successful JSON response (Status ${response.status}) for ${method} ${url}:`, jsonError, 'Body text:', responseBodyText?.substring(0, 500));
        throw new Error('Formato de resposta JSON inválido recebido do servidor.');
      }

    } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`Error during API request ${method} ${url} (Attempt ${attempt + 1}):`, lastError);

      // Handle specific errors
      if (lastError instanceof ApiError && lastError.status === 401) {
           logger.error('Authentication error (401). Aborting retries.');
           // Consider triggering logout or redirect here
           localStorage.removeItem('token');
           localStorage.removeItem('user');
           // Avoid hard reload if possible, let AuthContext handle state
           // window.location.href = '/login'; // Force redirect
           throw lastError; // Throw to stop further execution in the original caller
      }
      if (lastError instanceof ApiError && (lastError.status && lastError.status >= 400 && lastError.status < 500 && lastError.status !== 401)) {
          logger.warn(`Client error (${lastError.status}). Not retrying.`);
          throw lastError; // Don't retry other 4xx client errors
      }

      // Check for retryable network/timeout errors ONLY
      const retryableErrorMessages = ['Failed to fetch', 'network error', 'Load failed'];
      const isTimeout = (error instanceof DOMException && error.name === 'AbortError');
      const isRetryableNetworkError = retryableErrorMessages.some(msg => lastError!.message.toLowerCase().includes(msg.toLowerCase())); // Case-insensitive check

      if (!(isTimeout || isRetryableNetworkError)) {
           logger.warn(`Non-retryable error encountered: ${lastError.message}. Aborting retries.`);
           throw lastError; // Don't retry non-network errors
      }

      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        logger.error(`API request failed after ${maxRetries + 1} attempts for ${method} ${url}. Last error:`, lastError);
        throw lastError;
      }
    }
  }
    // Fallback throw (should not be reached)
    throw lastError || new Error('Erro desconhecido na requisição API');
}

// ===============================================
// EXPORTED API Function Definitions
// ===============================================

// --- Auth ---
export const login = (username: string, password: string): Promise<any> =>
  _apiRequest(API_ENDPOINTS.LOGIN, 'POST', { username, password }, false);

export const logout = (): Promise<any> =>
  _apiRequest(API_ENDPOINTS.LOGOUT, 'POST', {}, true);

export const verifyToken = (): Promise<any> =>
  _apiRequest(API_ENDPOINTS.VERIFY_TOKEN, 'GET', null, true);

// --- Users ---
export const getUsers = (): Promise<any> =>
  _apiRequest(API_ENDPOINTS.USERS, 'GET', null, true);

export const getUser = (userId: number): Promise<any> =>
  _apiRequest(API_ENDPOINTS.USER_DETAIL(userId), 'GET', null, true);

export const createUser = (userData: any): Promise<any> =>
  _apiRequest(API_ENDPOINTS.USERS, 'POST', userData, true);

export const updateUser = (userId: number, userData: any): Promise<any> =>
  _apiRequest(API_ENDPOINTS.USER_DETAIL(userId), 'PUT', userData, true);

export const deleteUser = (userId: number): Promise<any> =>
  _apiRequest(API_ENDPOINTS.USER_DETAIL(userId), 'DELETE', null, true);

// --- Products ---
export const getProductMatrix = (referenceCode: string, calculationMode: string): Promise<any> =>
  _apiRequest(API_ENDPOINTS.PRODUCT_MATRIX, 'POST', { reference_code: referenceCode, calculation_mode: calculationMode }, true);

// --- REMOVED getProductVariantDetails ---
// export const getProductVariantDetails = (referenceCode: string, colorCode: string, sizeName: string): Promise<any> => {
//   const params = new URLSearchParams({
//     reference_code: referenceCode,
//     color_code: colorCode,
//     size_name: sizeName,
//   }).toString();
//   return _apiRequest(`${API_ENDPOINTS.PRODUCT_VARIANT_DETAILS}?${params}`, 'GET', null, true);
// };

// --- Fabrics ---
// Updated to include force_refresh
export const getFabricBalances = (filterText: string | null, forceRefresh: boolean = false): Promise<any> =>
  _apiRequest(API_ENDPOINTS.FABRIC_BALANCES, 'POST', { filter: filterText, force_refresh: forceRefresh }, true);

// New endpoint for clearing cache
export const clearFabricCache = (): Promise<any> =>
  _apiRequest(API_ENDPOINTS.FABRIC_CACHE_CLEAR, 'POST', {}, true); // Added endpoint

// --- Observations ---
export const getProductObservations = (referenceCode: string): Promise<any> =>
  _apiRequest(API_ENDPOINTS.PRODUCT_OBSERVATIONS(referenceCode), 'GET', null, true);

export const getProductObservationsCount = (referenceCode: string): Promise<any> =>
  _apiRequest(API_ENDPOINTS.OBSERVATION_COUNT(referenceCode), 'GET', null, true);

export const postProductObservation = (referenceCode: string, observationText: string): Promise<any> =>
  _apiRequest(API_ENDPOINTS.PRODUCT_OBSERVATIONS(referenceCode), 'POST', { observation_text: observationText }, true);

export const resolveProductObservation = (observationId: number): Promise<any> =>
  _apiRequest(API_ENDPOINTS.RESOLVE_OBSERVATION(observationId), 'PUT', {}, true);

export const getPendingObservationsRefs = (): Promise<any> =>
  _apiRequest(API_ENDPOINTS.PENDING_OBSERVATIONS_REFERENCES, 'GET', null, true);

// --- Customer Panel ---
export const getCustomerPanelData = (searchTerm: string, searchType?: 'PF' | 'PJ'): Promise<any> =>
  _apiRequest(API_ENDPOINTS.CUSTOMER_DATA, 'POST', { search_term: searchTerm, search_type: searchType }, true);

export const getCustomerPanelStatistics = (customerCode: number): Promise<any> => {
  const params = new URLSearchParams({ customer_code: String(customerCode) }).toString();
  return _apiRequest(`${API_ENDPOINTS.CUSTOMER_STATISTICS}?${params}`, 'GET', null, true);
};