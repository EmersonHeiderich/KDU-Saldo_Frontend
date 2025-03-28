// src/services/customerPanelService.ts

// Import specific API functions and ApiError
import { getCustomerPanelData, getCustomerPanelStatistics, ApiError } from '../utils/api';

// --- Interfaces matching backend API responses (snake_case) ---

interface ApiAddress {
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    type: string | null;
    complement: string | null;
    reference: string | null;
}

interface ApiPhone {
    number: string | null;
    type: string | null;
    is_default: boolean;
}

interface ApiEmail {
    email: string | null;
    type: string | null;
    is_default: boolean;
}

interface ApiBaseCustomerData {
    code: number;
    status: 'Active' | 'Inactive';
    registered_at: string | null;
    address: ApiAddress | null;
    phones: ApiPhone[];
    emails: ApiEmail[];
    is_customer: boolean | null;
    is_supplier: boolean | null;
}

interface ApiIndividualCustomerData extends ApiBaseCustomerData {
    customer_type: 'PF';
    name: string;
    cpf: string;
    rg: string | null;
    rg_issuer: string | null;
    birth_date: string | null;
    is_employee: boolean | null;
    registered_by_branch: number | null;
}

interface ApiLegalEntityCustomerData extends ApiBaseCustomerData {
    customer_type: 'PJ';
    legal_name: string;
    trade_name: string | null;
    cnpj: string;
    state_registration: string | null;
    state_registration_uf: string | null;
    foundation_date: string | null;
    share_capital: number | null;
    is_representative: boolean | null;
}

type ApiCustomerDataResponse = ApiIndividualCustomerData | ApiLegalEntityCustomerData;

interface ApiCustomerStatisticsResponse {
    average_delay_days: number | null;
    max_delay_days: number | null;
    total_overdue_value: number | null;
    overdue_installments_count: number | null;
    average_installment_delay_days: number | null;
    total_purchases_count: number | null;
    total_purchases_value: number | null;
    average_purchase_value: number | null;
    first_purchase_date: string | null;
    first_purchase_value: number | null;
    last_purchase_date: string | null;
    last_purchase_value: number | null;
    biggest_purchase_date: string | null;
    biggest_purchase_value: number | null;
    total_paid_installments_value: number | null;
    paid_installments_count: number | null;
    average_paid_installment_value: number | null;
    total_open_installments_value: number | null;
    open_installments_count: number | null;
    average_open_installment_value: number | null;
    last_paid_invoice_value: number | null;
    last_paid_invoice_date: string | null;
}

// --- Interfaces for Frontend Data Structures (camelCase) ---

export interface CustomerAddress {
    logradouro: string | null;
    numero: string | null;
    bairro: string | null;
    municipio: string | null;
    uf: string | null;
    cep: string | null;
    tipo: string | null;
    complemento: string | null;
    referencia: string | null;
}

export interface CustomerPhone {
    numero: string | null;
    tipo: string | null;
    padrao: boolean;
}

export interface CustomerEmail {
    email: string | null;
    tipo: string | null;
    padrao: boolean;
}

interface BaseCustomerData {
    codigo: number;
    status: 'Ativo' | 'Inativo';
    dataCadastro: string | null;
    endereco: CustomerAddress | null;
    telefones: CustomerPhone[];
    emails: CustomerEmail[];
    ehCliente: boolean | null;
    ehFornecedor: boolean | null;
}

export interface IndividualCustomerData extends BaseCustomerData {
    tipoCliente: 'PF';
    nome: string;
    cpf: string;
    rg: string | null;
    ufRg: string | null;
    dataNascimento: string | null;
    empresaCadastro: number | null;
    ehFuncionario: boolean | null;
}

export interface LegalEntityCustomerData extends BaseCustomerData {
    tipoCliente: 'PJ';
    razaoSocial: string;
    nomeFantasia: string | null;
    cnpj: string;
    ie: string | null;
    estadoIe: string | null;
    dataFundacao: string | null;
    capitalSocial: number | null;
    ehRepresentante: boolean | null;
}

export type CustomerData = IndividualCustomerData | LegalEntityCustomerData;

export interface CustomerStatistics {
    atrasoMedio: number | null;
    atrasoMaximo: number | null;
    totalParcelasEmAtraso: number | null;
    quantidadeParcelasEmAtraso: number | null;
    mediaAtrasoParcelas: number | null;
    quantidadeCompras: number | null;
    valorTotalCompras: number | null;
    valorMedioCompras: number | null;
    dataPrimeiraCompra: string | null;
    valorPrimeiraCompra: number | null;
    dataUltimaCompra: string | null;
    valorUltimaCompra: number | null;
    dataMaiorCompra: string | null;
    valorMaiorCompra: number | null;
    totalParcelasPagas: number | null;
    quantidadeParcelasPagas: number | null;
    valorMedioParcelasPagas: number | null;
    totalParcelasEmAberto: number | null;
    quantidadeParcelasEmAberto: number | null;
    valorMedioParcelasEmAberto: number | null;
    valorUltimaFaturaPaga: number | null;
    dataUltimaFaturaPaga: string | null;
}

// --- Mapping Functions ---

function mapApiAddressToFrontend(apiAddress: ApiAddress | null): CustomerAddress | null {
    if (!apiAddress) return null;
    return {
        logradouro: apiAddress.street,
        numero: apiAddress.number,
        bairro: apiAddress.neighborhood,
        municipio: apiAddress.city,
        uf: apiAddress.state,
        cep: apiAddress.zip_code,
        tipo: apiAddress.type,
        complemento: apiAddress.complement,
        referencia: apiAddress.reference,
    };
}

function mapApiPhonesToFrontend(apiPhones: ApiPhone[]): CustomerPhone[] {
    return (apiPhones || []).map(p => ({ // Add default empty array
        numero: p.number,
        tipo: p.type,
        padrao: p.is_default,
    }));
}

function mapApiEmailsToFrontend(apiEmails: ApiEmail[]): CustomerEmail[] {
    return (apiEmails || []).map(e => ({ // Add default empty array
        email: e.email,
        tipo: e.type,
        padrao: e.is_default,
    }));
}

function mapApiCustomerToFrontend(apiData: ApiCustomerDataResponse): CustomerData {
    const baseFrontendData = {
        codigo: apiData.code,
        status: apiData.status === 'Active' ? 'Ativo' : 'Inativo',
        dataCadastro: apiData.registered_at,
        endereco: mapApiAddressToFrontend(apiData.address),
        telefones: mapApiPhonesToFrontend(apiData.phones),
        emails: mapApiEmailsToFrontend(apiData.emails),
        ehCliente: apiData.is_customer,
        ehFornecedor: apiData.is_supplier,
    };

    if (apiData.customer_type === 'PF') {
        const apiPf = apiData as ApiIndividualCustomerData;
        return {
            ...baseFrontendData,
            tipoCliente: 'PF',
            nome: apiPf.name,
            cpf: apiPf.cpf,
            rg: apiPf.rg,
            ufRg: apiPf.rg_issuer,
            dataNascimento: apiPf.birth_date,
            empresaCadastro: apiPf.registered_by_branch,
            ehFuncionario: apiPf.is_employee,
        } as IndividualCustomerData;
    } else { // PJ
        const apiPj = apiData as ApiLegalEntityCustomerData;
        return {
            ...baseFrontendData,
            tipoCliente: 'PJ',
            razaoSocial: apiPj.legal_name,
            nomeFantasia: apiPj.trade_name,
            cnpj: apiPj.cnpj,
            ie: apiPj.state_registration,
            estadoIe: apiPj.state_registration_uf,
            dataFundacao: apiPj.foundation_date,
            capitalSocial: apiPj.share_capital,
            ehRepresentante: apiPj.is_representative,
        } as LegalEntityCustomerData;
    }
}

function mapApiStatsToFrontend(apiStats: ApiCustomerStatisticsResponse): CustomerStatistics {
    return {
        atrasoMedio: apiStats.average_delay_days,
        atrasoMaximo: apiStats.max_delay_days,
        totalParcelasEmAtraso: apiStats.total_overdue_value,
        quantidadeParcelasEmAtraso: apiStats.overdue_installments_count,
        mediaAtrasoParcelas: apiStats.average_installment_delay_days,
        quantidadeCompras: apiStats.total_purchases_count,
        valorTotalCompras: apiStats.total_purchases_value,
        valorMedioCompras: apiStats.average_purchase_value,
        dataPrimeiraCompra: apiStats.first_purchase_date,
        valorPrimeiraCompra: apiStats.first_purchase_value,
        dataUltimaCompra: apiStats.last_purchase_date,
        valorUltimaCompra: apiStats.last_purchase_value,
        dataMaiorCompra: apiStats.biggest_purchase_date,
        valorMaiorCompra: apiStats.biggest_purchase_value,
        totalParcelasPagas: apiStats.total_paid_installments_value,
        quantidadeParcelasPagas: apiStats.paid_installments_count,
        valorMedioParcelasPagas: apiStats.average_paid_installment_value,
        totalParcelasEmAberto: apiStats.total_open_installments_value,
        quantidadeParcelasEmAberto: apiStats.open_installments_count,
        valorMedioParcelasEmAberto: apiStats.average_open_installment_value,
        valorUltimaFaturaPaga: apiStats.last_paid_invoice_value,
        dataUltimaFaturaPaga: apiStats.last_paid_invoice_date,
    };
}

// --- Service Functions ---

export interface CustomerSearchParams {
  termo_busca: string;
  tipo_busca?: 'PF' | 'PJ';
}

/** Fetches customer data and maps it to the frontend structure. */
export const getCustomerData = async (params: CustomerSearchParams): Promise<CustomerData | null> => {
  try {
    const response: ApiCustomerDataResponse = await getCustomerPanelData(params.termo_busca, params.tipo_busca);

    if (response) {
       return mapApiCustomerToFrontend(response);
    }
    return null;
  } catch (error) {
    console.error('Erro no serviço getCustomerData:', error);
     if (error instanceof ApiError && error.status === 404) {
         return null; // Return null if backend explicitly says Not Found
     }
    throw error; // Re-throw other errors for the component to handle
  }
};

/** Fetches customer statistics and maps them to the frontend structure. */
export const getCustomerStatistics = async (codigo_cliente: number): Promise<CustomerStatistics | null> => {
  try {
    const response: ApiCustomerStatisticsResponse = await getCustomerPanelStatistics(codigo_cliente);

    if (response) {
      return mapApiStatsToFrontend(response);
    }
    return null;
  } catch (error) {
    console.error('Erro no serviço getCustomerStatistics:', error);
     if (error instanceof ApiError && error.status === 404) {
         return null; // Return null if backend explicitly says Not Found
     }
    throw error; // Re-throw other errors
  }
};


// --- Formatting/Utility Functions ---
/**
 * Formats a monetary value to Brazilian format (R$ 1.234,56)
 */
export const formatCurrency = (value?: number | null): string => {
    if (value === undefined || value === null) return '-';
    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    } catch (e) {
        console.error("Error formatting currency:", value, e);
        return String(value); // Fallback
    }
};

/**
 * Formats a date (ISO string or Date object) to Brazilian format (DD/MM/YYYY)
 */
export const formatDate = (dateInput?: string | Date | null): string => {
    if (!dateInput) return '-';

    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date input for formatDate: ${dateInput}`);
            return String(dateInput); // Return original if invalid
        }
        // Return only Date part DD/MM/YYYY
        return new Intl.DateTimeFormat('pt-BR', {
             day: '2-digit',
             month: '2-digit',
             year: 'numeric'
         }).format(date);

    } catch (error) {
        console.error('Erro ao formatar data:', dateInput, error);
        return String(dateInput); // Fallback
    }
};

/**
 * Formats a CPF string (000.000.000-00)
 */
export const formatCPF = (cpf: string | null | undefined): string => {
    if (!cpf) return '-';
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) return cpf; // Return original if not 11 digits
    return cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formats a CNPJ string (00.000.000/0000-00)
 */
export const formatCNPJ = (cnpj: string | null | undefined): string => {
    if (!cnpj) return '-';
    const cnpjClean = cnpj.replace(/\D/g, '');
    if (cnpjClean.length !== 14) return cnpj; // Return original if not 14 digits
    return cnpjClean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Removes non-digit characters from a string.
 */
export const cleanDocument = (value: string | null | undefined): string => {
    if (!value) return '';
    return value.replace(/\D/g, '');
};

/**
 * Detects input type (code, CPF, CNPJ, invalid) based on cleaned digits.
 */
export const detectInputType = (value: string): 'codigo' | 'cpf' | 'cnpj' | 'invalido' => {
    const cleanValue = cleanDocument(value);

    if (!cleanValue) return 'invalido';
    if (!/^\d+$/.test(cleanValue)) return 'invalido';

    if (cleanValue.length <= 9) return 'codigo';
    if (cleanValue.length === 11) return 'cpf';
    if (cleanValue.length === 14) return 'cnpj';

    return 'invalido';
};