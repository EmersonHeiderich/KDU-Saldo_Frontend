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
async function _apiRequest(
  url: string,
  method = 'GET',
  data: any = null,
  requiresAuth = true,
  maxRetries = 1,
  responseType: 'json' | 'arrayBuffer' = 'json' // Added responseType
): Promise<any> { // Return type is now 'any' as it could be JSON or ArrayBuffer

  const createRequestOptions = (): RequestInit => {
    const headers: HeadersInit = {
      // Adjust Accept header based on expected response
      'Accept': responseType === 'json' ? 'application/json' : 'application/pdf',
    };
    // Set Content-Type only for methods that typically have a body
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        // Only set Content-Type if data is being sent
        if (data) {
            headers['Content-Type'] = 'application/json';
        }
    }

    if (requiresAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        logger.error(`Authentication required for ${method} ${url}, but no token found.`);
        // Automatically redirect or handle logout? For now, throw.
        throw new ApiError('Usuário não autenticado. Por favor, faça login novamente.', 401);
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method: method.toUpperCase(),
      headers,
      signal: AbortSignal.timeout(method.toUpperCase() === 'GET' ? 20000 : 60000), // Increased POST/PUT timeout for potentially longer operations like Boleto
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
      // Only log warning if data is not null/undefined
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
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.warn(`Retrying ${method} ${url} (Attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const options = createRequestOptions();
      logger.debug(`Requesting: ${method} ${url}`, data ? `with data: ${JSON.stringify(data).substring(0, 100)}...` : '');

      const response = await fetch(url, options);
      logger.debug(`Response Status: ${response.status} for ${method} ${url}`);

      // Check for Authentication Failure first
      if (response.status === 401) {
          logger.error(`Authentication error (401) for ${method} ${url}. Redirecting/logging out...`);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Consider throwing a specific error or navigating to login
          // For now, throw ApiError which AuthContext might handle
          throw new ApiError('Sessão inválida ou expirada. Por favor, faça login novamente.', 401);
      }
      // Check for other Forbidden errors
      if (response.status === 403) {
          logger.error(`Authorization error (403) for ${method} ${url}. User lacks permission.`);
          throw new ApiError('Você não tem permissão para realizar esta ação.', 403);
      }


      if (!response.ok) {
        let errorMessage = `Erro na API: ${response.status}`;
        let errorData: any = null;
        let responseBodyText: string | null = null;
        try {
            responseBodyText = await response.text(); // Attempt to read error body
             if (responseBodyText) {
                try {
                    errorData = JSON.parse(responseBodyText);
                    // Prefer 'error' key if backend sends { "error": "..." }
                    if (errorData && errorData.error && typeof errorData.error === 'string') {
                        errorMessage = errorData.error;
                    } else {
                        // Fallback to generic message with status and beginning of text
                        errorMessage = `Erro na API (${response.status}): ${responseBodyText.substring(0, 200)}`;
                    }
                } catch (jsonError) {
                    logger.debug('Error response body was not JSON:', responseBodyText.substring(0, 200));
                    // Use status and beginning of text
                    errorMessage = `Erro na API (${response.status}): ${responseBodyText.substring(0, 200)}`;
                }
            } else {
                errorMessage = `Erro ${response.status} - ${response.statusText || 'Erro desconhecido na API'}`;
            }
        } catch (readError) {
            logger.warn(`Could not read error response body for ${method} ${url} (Status: ${response.status})`);
            errorMessage = `Erro ${response.status} - ${response.statusText || 'Não foi possível ler a resposta de erro da API'}`;
        }
        logger.error(`API Error (${method} ${url}): Status ${response.status}, Message: ${errorMessage}`, errorData);
        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Handle successful responses based on expected type
       if (response.status === 204 || response.headers.get('content-length') === '0') {
         logger.debug(`Received empty success response (Status ${response.status}) for ${method} ${url}. Returning null.`);
         return null; // No content, successful
       }

      // Handle ArrayBuffer specifically (e.g., for PDF)
      if (responseType === 'arrayBuffer') {
          const contentType = response.headers.get('content-type');
          // Add a check for expected PDF content type
          if (contentType && contentType.toLowerCase().includes('application/pdf')) {
                const buffer = await response.arrayBuffer();
                logger.debug(`Received successful PDF response (Length: ${buffer.byteLength}) for ${method} ${url}`);
                return buffer;
          } else {
              logger.error(`Expected PDF but received Content-Type: ${contentType} for ${method} ${url}`);
              // Attempt to read as text to see if it's an error message disguised as success
              const textResponse = await response.text();
              logger.error(`Non-PDF response body: ${textResponse.substring(0, 500)}`);
              throw new ApiError(`Resposta inesperada do servidor ao gerar PDF. Tipo: ${contentType}`, response.status, { responseText: textResponse });
          }
      }

      // Handle JSON (default)
       const contentType = response.headers.get('content-type');
       if (contentType && contentType.includes('application/json')) {
           try {
                const jsonData = await response.json();
                logger.debug(`Received successful JSON response for ${method} ${url}:`, JSON.stringify(jsonData).substring(0, 200) + (JSON.stringify(jsonData).length > 200 ? '...' : ''));
                return jsonData;
           } catch (jsonError) {
                logger.error(`Failed to parse successful JSON response (Status ${response.status}) for ${method} ${url}:`, jsonError, 'Content-Type:', contentType);
                throw new Error('Formato de resposta JSON inválido recebido do servidor.');
           }
       } else {
           // Handle unexpected successful content types if necessary
           logger.warn(`Received successful response with unexpected Content-Type (${contentType}) for ${method} ${url}. Reading as text.`);
           const textData = await response.text(); // Read as text as fallback
           logger.debug(`Response text: ${textData.substring(0, 500)}`);
           // Throwing error is safer than returning unexpected text
           throw new Error(`Tipo de conteúdo inesperado (${contentType}) recebido do servidor.`);
       }

    } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`Error during API request ${method} ${url} (Attempt ${attempt + 1}):`, lastError);

        // Re-throw auth errors immediately, no retry
        if (lastError instanceof ApiError && (lastError.status === 401 || lastError.status === 403)) {
           throw lastError;
        }
        // Don't retry other client-side errors (4xx except 401/403)
        if (lastError instanceof ApiError && (lastError.status && lastError.status >= 400 && lastError.status < 500)) {
          logger.warn(`Client error (${lastError.status}). Not retrying.`);
          throw lastError;
        }

        // Check for retryable network/timeout errors
        const retryableErrorMessages = ['Failed to fetch', 'network error', 'Load failed'];
        const isTimeout = (error instanceof DOMException && error.name === 'AbortError');
        const isRetryableNetworkError = retryableErrorMessages.some(msg => lastError!.message.toLowerCase().includes(msg.toLowerCase()));

        if (!(isTimeout || isRetryableNetworkError)) {
           logger.warn(`Non-retryable error encountered: ${lastError.message}. Aborting retries.`);
           throw lastError; // Don't retry other errors
        }

        // If max retries reached, throw the last encountered error
        if (attempt === maxRetries) {
          logger.error(`API request failed after ${maxRetries + 1} attempts for ${method} ${url}. Last error:`, lastError);
          throw lastError;
        }
        // Otherwise, the loop continues to the next attempt
    }
  }
    // Should technically be unreachable if loop completes, but satisfy TS
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

// --- Fabrics ---
export const getFabricBalances = (filterText: string | null, forceRefresh: boolean = false): Promise<any> =>
  _apiRequest(API_ENDPOINTS.FABRIC_BALANCES, 'POST', { filter: filterText, force_refresh: forceRefresh }, true);

export const clearFabricCache = (): Promise<any> =>
  _apiRequest(API_ENDPOINTS.FABRIC_CACHE_CLEAR, 'POST', {}, true);

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

// --- Fiscal ---
export const searchFiscalInvoices = (payload: any): Promise<any> =>
  _apiRequest(API_ENDPOINTS.FISCAL_INVOICES_SEARCH, 'POST', payload, true);

export const generateDanfePdf = (accessKey: string): Promise<ArrayBuffer> =>
  _apiRequest(API_ENDPOINTS.FISCAL_DANFE_GENERATE(accessKey), 'GET', null, true, 1, 'arrayBuffer');

// --- Accounts Receivable --- NEW ---
/**
 * Searches Accounts Receivable documents.
 * @param payload - The search payload including filters, pagination, expand, order.
 */
export const searchReceivables = (payload: any): Promise<any> =>
  _apiRequest(API_ENDPOINTS.AR_SEARCH, 'POST', payload, true);

/**
 * Generates a Boleto (Bank Slip) PDF. Expects ArrayBuffer as response.
 * @param payload - The request payload containing branchCode, customerCode, receivableCode, installmentNumber.
 */
export const generateBoletoPdf = (payload: any): Promise<ArrayBuffer> =>
  _apiRequest(API_ENDPOINTS.AR_BOLETO, 'POST', payload, true, 0, 'arrayBuffer'); // No retries for Boleto generation