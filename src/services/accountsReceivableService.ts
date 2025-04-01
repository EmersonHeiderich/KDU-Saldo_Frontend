// src/services/accountsReceivableService.ts

import { searchReceivables as apiSearchReceivables, generateBoletoPdf as apiGenerateBoletoPdf, ApiError } from '../utils/api';

export { ApiError };

// --- Interfaces matching backend API responses (snake_case) ---
// Keep ApiReceivableListItem and ApiReceivableSearchResponse as before
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
    // Include branchCode if backend provides it, otherwise it needs to be handled differently
    branch_code?: number | null;
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
// Keep ReceivableListItem and ReceivableSearchResult as before
export interface ReceivableListItem {
    customerCode: number | null;
    customerCpfCnpj: string | null;
    customerName: string | null;
    invoiceNumber: number | null;
    documentNumber: number | null;
    installmentNumber: number | null;
    documentDisplay: string; // Custom field: documentNumber/installmentNumber
    bearerName: string | null;
    issueDate: string | null;
    expiredDate: string | null;
    daysLate: number | null;
    paymentDate: string | null;
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
    branchCode?: number | null; // Needed for Boleto
}

export interface ReceivableSearchResult {
    receivables: ReceivableListItem[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
}

// --- UPDATED ReceivableFilters Interface ---
// Includes both basic and advanced filter fields used in UI components
export interface ReceivableFilters {
    // Basic filters
    customerCode?: string | null; // String for UI input (handles comma separation)
    documentNumber?: string | null; // String for UI input (handles comma separation)
    startDate?: string | null; // YYYY-MM-DD (Issue Date Start)
    endDate?: string | null; // YYYY-MM-DD (Issue Date End)
    hasOpenInvoices?: boolean | null;

    // Advanced filters (mapped from AdvancedFiltersModal state)
    branchCodeList?: number[] | null;
    customerCpfCnpjList?: string[] | null;
    // receivableCodeList?: number[] | null; // Consider if this replaces/syncs with documentNumber
    // ourNumberList?: number[] | null; // Add if 'ourNumbers' state is added to modal
    statusList?: number[] | null;
    documentTypeList?: number[] | null;
    billingTypeList?: number[] | null;
    dischargeTypeList?: number[] | null;
    chargeTypeList?: number[] | null;
    startExpiredDate?: string | null; // YYYY-MM-DD
    endExpiredDate?: string | null; // YYYY-MM-DD
    startPaymentDate?: string | null; // YYYY-MM-DD
    endPaymentDate?: string | null; // YYYY-MM-DD
    startCreditDate?: string | null; // YYYY-MM-DD
    endCreditDate?: string | null; // YYYY-MM-DD

    // Add commission fields if implemented in modal
    // commissionedCode?: number | null;
    // commissionedCpfCnpj?: string | null;
    // ... other commission fields ...
}


// --- Mapping Function (API to Frontend) ---
// Keep mapApiReceivableToFrontend as before
function mapApiReceivableToFrontend(apiItem: ApiReceivableListItem): ReceivableListItem {
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
        documentDisplay: documentDisplay,
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
        branchCode: apiItem.branch_code, // Map branchCode if backend provides it
    };
}

// --- UPDATED mapFiltersToApiPayload Function ---
// Helper to convert combined frontend filters to backend payload structure
function mapFiltersToApiPayload(filters: ReceivableFilters): any {
    const apiFilter: any = {};

    // --- Helper to parse comma-separated numeric string ---
    const parseNumericList = (value: string | null | undefined): number[] | undefined => {
        if (!value) return undefined;
        const list = value.split(',').map(c => parseInt(c.trim(), 10)).filter(n => !isNaN(n));
        return list.length > 0 ? list : undefined;
    };

    // --- Helper to format date string to ISO with time ---
    const formatDateToISO = (dateString: string | null | undefined, endOfDay: boolean = false): string | undefined => {
        if (!dateString) return undefined;
        // Basic validation: check if it resembles YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            console.warn(`Invalid date format encountered: ${dateString}. Skipping.`);
            return undefined;
        }
        return `${dateString}T${endOfDay ? '23:59:59' : '00:00:00'}`; // Append time
    };

    // --- Map Basic Filters ---
    const customerCodes = parseNumericList(filters.customerCode);
    if (customerCodes) apiFilter.customerCodeList = customerCodes;

    const documentNumbers = parseNumericList(filters.documentNumber);
    if (documentNumbers) apiFilter.receivableCodeList = documentNumbers; // Map to receivableCodeList

    const startIssueDate = formatDateToISO(filters.startDate, false);
    if (startIssueDate) apiFilter.startIssueDate = startIssueDate;

    const endIssueDate = formatDateToISO(filters.endDate, true);
    if (endIssueDate) apiFilter.endIssueDate = endIssueDate;

    if (filters.hasOpenInvoices !== null && filters.hasOpenInvoices !== undefined) {
        apiFilter.hasOpenInvoices = filters.hasOpenInvoices;
    }

    // --- Map Advanced Filters ---
    if (filters.branchCodeList?.length) apiFilter.branchCodeList = filters.branchCodeList;
    if (filters.customerCpfCnpjList?.length) apiFilter.customerCpfCnpjList = filters.customerCpfCnpjList;

    // Add mapping for ourNumberList if implemented
    // const ourNumbers = parseNumericList(filters.ourNumbersString); // Assuming a string input
    // if (ourNumbers) apiFilter.ourNumberList = ourNumbers;

    if (filters.statusList?.length) apiFilter.statusList = filters.statusList;
    if (filters.documentTypeList?.length) apiFilter.documentTypeList = filters.documentTypeList;
    if (filters.billingTypeList?.length) apiFilter.billingTypeList = filters.billingTypeList;
    if (filters.dischargeTypeList?.length) apiFilter.dischargeTypeList = filters.dischargeTypeList;
    if (filters.chargeTypeList?.length) apiFilter.chargeTypeList = filters.chargeTypeList;

    const startExpired = formatDateToISO(filters.startExpiredDate, false);
    if (startExpired) apiFilter.startExpiredDate = startExpired;
    const endExpired = formatDateToISO(filters.endExpiredDate, true);
    if (endExpired) apiFilter.endExpiredDate = endExpired;

    const startPayment = formatDateToISO(filters.startPaymentDate, false);
    if (startPayment) apiFilter.startPaymentDate = startPayment;
    const endPayment = formatDateToISO(filters.endPaymentDate, true);
    if (endPayment) apiFilter.endPaymentDate = endPayment;

    const startCredit = formatDateToISO(filters.startCreditDate, false);
    if (startCredit) apiFilter.startCreditDate = startCredit;
    const endCredit = formatDateToISO(filters.endCreditDate, true);
    if (endCredit) apiFilter.endCreditDate = endCredit;

    // Add mapping for commission filters if implemented
    // if (filters.commissionedCode) apiFilter.commissionedCode = filters.commissionedCode;
    // if (filters.commissionedCpfCnpj) apiFilter.commissionedCpfCnpj = filters.commissionedCpfCnpj;
    // ...

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
        const apiPayload: any = { page, pageSize };

        // Map combined frontend filters to backend structure
        const mappedFilters = mapFiltersToApiPayload(filters);
        if (mappedFilters) {
            apiPayload.filter = mappedFilters;
        }

        if (sort) apiPayload.order = sort;

        // Expand is handled implicitly by backend service based on required fields
        // apiPayload.expand = 'invoice,calculatedValues'; // Only add if explicit control needed

        console.log("Sending AR Search payload:", JSON.stringify(apiPayload)); // Log cleaned payload

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
            throw error;
        }
        throw new Error('Falha ao buscar contas a receber.');
    }
};

/**
 * Generates the Boleto PDF blob for a specific installment.
 * @param params - Object containing branchCode, customerCode, receivableCode, installmentNumber.
 * @returns Promise resolving to a Blob containing the PDF data.
 */
export const generateBoleto = async (params: BoletoRequestPayload): Promise<Blob> => {
    try {
        console.log("Sending Boleto Request payload:", params);
        const pdfBytes: ArrayBuffer = await apiGenerateBoletoPdf(params);
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error(`Erro no serviço generateBoleto:`, error);
        if (error instanceof ApiError) {
            if (error.status === 404) {
                throw new ApiError("Boleto não encontrado ou não pôde ser gerado.", error.status);
            }
            throw error;
        }
        throw new Error('Falha ao gerar Boleto.');
    }
};


// --- Formatting/Utility Functions ---
// Keep formatCurrency, formatDate, formatNumber as before
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${day}/${month}/${year}`;
    } catch { return dateString; }
}
export function formatNumber(value: number | null | undefined, fractionDigits = 0): string {
    if (value === null || value === undefined) return '-';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
}