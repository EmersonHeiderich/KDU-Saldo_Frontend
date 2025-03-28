// src/services/fiscalService.ts

// Import specific API functions and ApiError
import { searchFiscalInvoices, generateDanfePdf, ApiError } from '../utils/api';

// Re-export ApiError for components
export { ApiError };

// --- Interfaces matching backend API responses (snake_case) ---

// Interface for a single invoice item in the API response list
// (Simplified based on required fields for the list)
interface ApiInvoiceListItem {
    status: string | null; // eletronicInvoiceStatus
    recipient_name: string | null; // personName from person expand
    sales_order_code: number | null; // orderCode from salesOrder expand
    invoice_number: number | null; // invoiceCode
    invoice_series: string | null; // serialCode
    issue_date: string | null; // receivementDate from eletronic expand OR issueDate
    total_value: number | null; // totalValue
    total_quantity: number | null; // quantity
    operation_name: string | null; // operatioName
    shipping_company_name: string | null; // shippingCompanyName from shippingCompany expand
    access_key: string | null; // accessKey from eletronic expand
}

// Interface for the API pagination response
interface ApiInvoiceSearchResponse {
    items: ApiInvoiceListItem[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// --- Interfaces for Frontend Data Structures (camelCase) ---

// Interface used within the frontend components for the list
export interface Invoice {
    status: string | null;
    destinatario: string | null;
    pedidoVenda: number | null;
    numeroNota: number | null;
    serieNota: string | null;
    dataEmissao: string | null; // Keep as string, format in component
    valorTotal: number | null;
    quantidadeTotal: number | null;
    operacao: string | null;
    transportadora: string | null;
    chaveAcesso: string | null;
}

// Interface for the structured search results including pagination
export interface InvoiceSearchResult {
    invoices: Invoice[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

// Interface for the filters used in the UI and sent to the service
export interface InvoiceFilters {
    customer?: string | null; // Combined code/cpf/cnpj list/single
    status?: string[] | null; // List of selected status keys (e.g., ["authorized", "canceled"])
    invoiceNumber?: string | null; // Single, comma-list, or range string
    startDate?: string | null; // ISO Date string YYYY-MM-DD
    endDate?: string | null; // ISO Date string YYYY-MM-DD
}

// Interface for calculated KPIs
export interface InvoiceKPIs {
    count: number;
    totalValue: number;
    averageValue: number;
    totalQuantity: number;
    averageQuantity: number;
}

// --- Mapping Function ---

function mapApiInvoiceToFrontend(apiInvoice: ApiInvoiceListItem): Invoice {
    return {
        status: apiInvoice.status,
        destinatario: apiInvoice.recipient_name,
        pedidoVenda: apiInvoice.sales_order_code,
        numeroNota: apiInvoice.invoice_number,
        serieNota: apiInvoice.invoice_series,
        dataEmissao: apiInvoice.issue_date, // Keep ISO string, format in component
        valorTotal: apiInvoice.total_value,
        quantidadeTotal: apiInvoice.total_quantity,
        operacao: apiInvoice.operation_name,
        transportadora: apiInvoice.shipping_company_name,
        chaveAcesso: apiInvoice.access_key,
    };
}

// --- Service Functions ---

/**
 * Searches for fiscal invoices based on filters and pagination.
 * @param filters - Object containing filter criteria.
 * @param page - Page number.
 * @param pageSize - Items per page.
 * @returns Promise resolving to InvoiceSearchResult.
 */
export const searchInvoices = async (
    filters: InvoiceFilters,
    page: number = 1,
    pageSize: number = 50
): Promise<InvoiceSearchResult> => {
    try {
        // Backend expects snake_case, map filters here or in api.ts (handling in api.ts is complex, map here)
        const apiPayload = {
            page,
            pageSize,
            customer_code_cpf_cnpj: filters.customer, // Backend needs to handle parsing this combined field
            status: filters.status ? filters.status.join(',') : undefined, // Send as comma-separated string if needed, or handle array in backend
            invoice_number: filters.invoiceNumber,
            start_date: filters.startDate ? `${filters.startDate}T00:00:00` : undefined, // Add time part if needed by backend
            end_date: filters.endDate ? `${filters.endDate}T23:59:59` : undefined,
        };

        // Remove undefined keys before sending
        Object.keys(apiPayload).forEach(key => apiPayload[key as keyof typeof apiPayload] === undefined && delete apiPayload[key as keyof typeof apiPayload]);


        // Log the payload being sent (sensitive data like CPF/CNPJ might be logged if not careful)
        // console.log("Sending payload to backend:", apiPayload);

        // Assume backend endpoint /api/fiscal/invoices/search handles these filters
        const response: ApiInvoiceSearchResponse = await searchFiscalInvoices(apiPayload);

        if (!response || !Array.isArray(response.items)) {
            console.error('Formato de resposta inválido da API de busca de notas:', response);
            throw new Error('Formato de resposta inválido ao buscar notas fiscais.');
        }

        return {
            invoices: response.items.map(mapApiInvoiceToFrontend),
            currentPage: response.page,
            pageSize: response.pageSize,
            totalItems: response.totalItems,
            totalPages: response.totalPages,
        };

    } catch (error) {
        console.error('Erro no serviço searchInvoices:', error);
        if (error instanceof ApiError) {
            throw error; // Re-throw specific API errors
        }
        throw new Error('Falha ao buscar notas fiscais.'); // Generic fallback
    }
};

/**
 * Fetches the DANFE PDF blob for a given access key.
 * @param accessKey - The 44-digit invoice access key.
 * @returns Promise resolving to a Blob containing the PDF data.
 */
export const getDanfePdfBlob = async (accessKey: string): Promise<Blob> => {
    try {
        // The api.ts function already handles fetching and expects PDF bytes
        const pdfBytes: ArrayBuffer = await generateDanfePdf(accessKey); // Assuming api.ts returns ArrayBuffer
        return new Blob([pdfBytes], { type: 'application/pdf' });
    } catch (error) {
        console.error(`Erro no serviço getDanfePdfBlob para chave ${accessKey}:`, error);
        if (error instanceof ApiError) {
            throw error; // Re-throw specific API errors
        }
        throw new Error('Falha ao gerar DANFE.'); // Generic fallback
    }
};

// --- Utility / Calculation Functions ---

/**
 * Calculates KPIs from a list of invoices.
 */
export function calculateInvoiceKPIs(invoices: Invoice[]): InvoiceKPIs {
    const count = invoices.length;
    let totalValue = 0;
    let totalQuantity = 0;

    invoices.forEach(invoice => {
        totalValue += invoice.valorTotal ?? 0;
        totalQuantity += invoice.quantidadeTotal ?? 0;
    });

    const averageValue = count > 0 ? totalValue / count : 0;
    const averageQuantity = count > 0 ? totalQuantity / count : 0;

    return {
        count,
        totalValue,
        averageValue,
        totalQuantity,
        averageQuantity,
    };
}

/**
 * Formats numbers for display.
 */
export function formatNumber(value: number | null | undefined, fractionDigits = 0): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * Formats currency values.
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formats date strings (expects ISO format).
 */
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
         if (isNaN(date.getTime())) return dateString; // Return original if invalid
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return dateString; // Fallback
    }
}

// Status mapping for the filter dropdown
export const STATUS_OPTIONS = [
    { value: 'Authorized', label: 'Autorizada' },
    { value: 'Canceled', label: 'Cancelada' },
    { value: 'Denied', label: 'Denegada' },
    { value: 'Sent', label: 'Enviada' },
    { value: 'Generated', label: 'Gerada' },
    { value: 'Rejected', label: 'Rejeitada' },
];