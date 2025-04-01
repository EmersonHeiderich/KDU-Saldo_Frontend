// src/services/accountsReceivableService.ts

// Import specific API functions and ApiError
import { searchReceivables as apiSearchReceivables, generateBoletoPdf as apiGenerateBoletoPdf, ApiError } from '../utils/api';

// Re-export ApiError for components
export { ApiError };

// --- Interfaces matching backend API responses (snake_case) ---

interface ApiReceivableListItem {
    customer_code: number | null;
    customer_cpf_cnpj: string | null;
    customer_name: string | null;
    invoice_number: number | null;
    document_number: number | null; // receivableCode
    installment_number: number | null;
    bearer_name: string | null;
    issue_date: string | null; // ISO Date string
    expired_date: string | null; // ISO Date string
    days_late: number | null;
    payment_date: string | null; // ISO Date string
    value_original: number | null;
    value_increase: number | null;
    value_rebate: number | null;
    value_paid: number | null;
    value_corrected: number | null;
    status: number | null;
    document_type: number | null;
    billing_type: number | null;
    discharge_type: number | null;
    charge_type: number | null;
}

interface ApiReceivableSearchResponse {
    items: ApiReceivableListItem[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
}

// Interface for Boleto Request Payload (snake_case - matching backend)
export interface BoletoRequestPayload {
    branchCode: number;
    customerCode: number;
    receivableCode: number;
    installmentNumber: number;
    customerCpfCnpj?: string; // Optional
}


// --- Interfaces for Frontend Data Structures (camelCase) ---

export interface ReceivableListItem {
    customerCode: number | null;
    customerCpfCnpj: string | null;
    customerName: string | null;
    invoiceNumber: number | null;
    documentNumber: number | null;
    installmentNumber: number | null;
    documentDisplay: string; // Custom field: documentNumber/installmentNumber
    bearerName: string | null;
    issueDate: string | null; // Keep as string, format in component
    expiredDate: string | null; // Keep as string, format in component
    daysLate: number | null;
    paymentDate: string | null; // Keep as string, format in component
    valueOriginal: number | null;
    valueIncrease: number | null;
    valueRebate: number | null;
    valuePaid: number | null;
    valueCorrected: number | null;
    status: number | null;
    documentType: number | null;
    billingType: number | null;
    dischargeType: number | null;
    chargeType: number | null;
    // Add fields needed for boleto generation if not present
    branchCode?: number; // Assuming it might be needed, fetch if not included
}

export interface ReceivableSearchResult {
    receivables: ReceivableListItem[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
}

// Interface for the filters used in the UI and sent to the service
// Note: Keep structure flat for easier handling in UI forms
export interface ReceivableFilters {
    // Basic filters
    customerCode?: string | null; // Allow comma-separated string or single code
    documentNumber?: string | null; // Allow comma-separated string or single number
    startDate?: string | null; // YYYY-MM-DD
    endDate?: string | null; // YYYY-MM-DD
    hasOpenInvoices?: boolean | null; // Use null for "all"

    // Advanced filters (add more as needed from backend spec)
    branchCodeList?: number[] | null;
    customerCpfCnpjList?: string[] | null;
    startExpiredDate?: string | null; // YYYY-MM-DD
    endExpiredDate?: string | null; // YYYY-MM-DD
    statusList?: number[] | null; // e.g., [1, 2] for Normal and Devolvido
    // ... add other filters based on `DocumentFilterModel` ...
}

// --- Mapping Function ---

function mapApiReceivableToFrontend(apiItem: ApiReceivableListItem): ReceivableListItem {
    // Create the custom display string
    const docNum = apiItem.document_number ?? '?';
    const instNum = apiItem.installment_number ?? '?';
    const documentDisplay = `${docNum}/${instNum}`;

    return {
        customerCode: apiItem.customer_code,
        customerCpfCnpj: apiItem.customer_cpf_cnpj,
        customerName: apiItem.customer_name,
        invoiceNumber: apiItem.invoice_number,
        documentNumber: apiItem.document_number,
        installmentNumber: apiItem.installment_number,
        documentDisplay: documentDisplay, // Assign custom field
        bearerName: apiItem.bearer_name,
        issueDate: apiItem.issue_date,
        expiredDate: apiItem.expired_date,
        daysLate: apiItem.days_late,
        paymentDate: apiItem.payment_date,
        valueOriginal: apiItem.value_original,
        valueIncrease: apiItem.value_increase,
        valueRebate: apiItem.value_rebate,
        valuePaid: apiItem.value_paid,
        valueCorrected: apiItem.value_corrected,
        status: apiItem.status,
        documentType: apiItem.document_type,
        billingType: apiItem.billing_type,
        dischargeType: apiItem.discharge_type,
        chargeType: apiItem.charge_type,
        // Note: branchCode might need to be fetched or assumed if not in list item
    };
}

// Helper to convert frontend filters to backend payload structure
function mapFiltersToApiPayload(filters: ReceivableFilters): any {
    const apiFilter: any = {};

    // Basic Filters
    if (filters.customerCode) {
        // Assuming backend expects customerCodeList as array of numbers
        const codes = filters.customerCode.split(',').map(c => parseInt(c.trim(), 10)).filter(n => !isNaN(n));
        if (codes.length > 0) apiFilter.customerCodeList = codes;
    }
    if (filters.documentNumber) {
        // Assuming backend expects receivableCodeList as array of numbers
        const codes = filters.documentNumber.split(',').map(c => parseInt(c.trim(), 10)).filter(n => !isNaN(n));
        if (codes.length > 0) apiFilter.receivableCodeList = codes;
    }
     if (filters.startDate) {
         // Append time if backend expects datetime
         apiFilter.startIssueDate = `${filters.startDate}T00:00:00`;
     }
     if (filters.endDate) {
          // Append time if backend expects datetime
         apiFilter.endIssueDate = `${filters.endDate}T23:59:59`;
     }
     if (filters.hasOpenInvoices !== null && filters.hasOpenInvoices !== undefined) {
         apiFilter.hasOpenInvoices = filters.hasOpenInvoices;
     }


    // Advanced Filters (map directly if names match snake_case)
    if (filters.branchCodeList?.length) apiFilter.branchCodeList = filters.branchCodeList;
    if (filters.customerCpfCnpjList?.length) apiFilter.customerCpfCnpjList = filters.customerCpfCnpjList;
    if (filters.startExpiredDate) apiFilter.startExpiredDate = `${filters.startExpiredDate}T00:00:00`;
    if (filters.endExpiredDate) apiFilter.endExpiredDate = `${filters.endExpiredDate}T23:59:59`;
    if (filters.statusList?.length) apiFilter.statusList = filters.statusList;
    // ... map other advanced filters ...

    // Return null if no filters were added, otherwise return the filter object
    return Object.keys(apiFilter).length > 0 ? apiFilter : null;
}


// --- Service Functions ---

/**
 * Searches for Accounts Receivable documents based on filters and pagination.
 * @param filters - Object containing filter criteria (frontend format).
 * @param page - Page number.
 * @param pageSize - Items per page.
 * @param sort - Optional sort string (e.g., '-expiredDate,receivableCode').
 * @returns Promise resolving to ReceivableSearchResult.
 */
export const searchAccountsReceivable = async (
    filters: ReceivableFilters,
    page: number = 1,
    pageSize: number = 50,
    sort?: string | null
): Promise<ReceivableSearchResult> => {
    try {
        // Prepare the full payload for the backend
        const apiPayload: any = {
            page,
            pageSize,
        };

        // Map frontend filters to backend structure
        const mappedFilters = mapFiltersToApiPayload(filters);
        if (mappedFilters) {
            apiPayload.filter = mappedFilters;
        }

        // Add optional parameters
        if (sort) {
            apiPayload.order = sort;
        }
        // Add expand if needed (backend implicitly adds necessary ones)
        // apiPayload.expand = 'invoice'; // Example if frontend needs specific expansion control

        console.log("Sending AR Search payload:", apiPayload); // Log for debugging

        const response: ApiReceivableSearchResponse = await apiSearchReceivables(apiPayload);

        if (!response || !Array.isArray(response.items)) {
            console.error('Formato de resposta inválido da API de busca de contas a receber:', response);
            throw new Error('Formato de resposta inválido ao buscar contas a receber.');
        }

        return {
            receivables: response.items.map(mapApiReceivableToFrontend),
            currentPage: response.page,
            pageSize: response.pageSize,
            totalItems: response.totalItems,
            totalPages: response.totalPages,
            hasNext: response.hasNext,
        };

    } catch (error) {
        console.error('Erro no serviço searchAccountsReceivable:', error);
        if (error instanceof ApiError) {
            throw error; // Re-throw specific API errors
        }
        throw new Error('Falha ao buscar contas a receber.'); // Generic fallback
    }
};

/**
 * Generates the Boleto PDF blob for a specific installment.
 * @param params - Object containing branchCode, customerCode, receivableCode, installmentNumber.
 * @returns Promise resolving to a Blob containing the PDF data.
 */
export const generateBoleto = async (params: BoletoRequestPayload): Promise<Blob> => {
    try {
        // The payload structure already matches the backend (snake_case)
        console.log("Sending Boleto Request payload:", params);
        const pdfBytes: ArrayBuffer = await apiGenerateBoletoPdf(params);
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error(`Erro no serviço generateBoleto:`, error);
        if (error instanceof ApiError) {
            // Customize error message based on status if needed
            if (error.status === 404) {
                throw new ApiError("Boleto não encontrado ou não pôde ser gerado.", error.status);
            }
            throw error; // Re-throw specific API errors
        }
        throw new Error('Falha ao gerar Boleto.'); // Generic fallback
    }
};


// --- Formatting/Utility Functions ---
// (Share or import from other services like fiscalService or create a common util)

/** Formats currency values. */
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Formats date strings (expects ISO format). */
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid
        // Ensure time part is ignored by using UTC methods for date parts
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${day}/${month}/${year}`;
    } catch {
        return dateString; // Fallback
    }
}

/** Formats numbers for display. */
export function formatNumber(value: number | null | undefined, fractionDigits = 0): string {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
}