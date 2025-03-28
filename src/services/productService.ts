// src/services/productService.ts

// Re-export ApiError from utils/api for consistency
export { ApiError } from '../utils/api';
import * as api from '../utils/api';

// --- Interfaces matching EXACT backend snake_case response ---

// -- Matrix related --
interface ApiMatrixColor {
  code: string;
  name: string;
}

export interface ApiMatrixCell {
  value: number;
  status: 'sufficient' | 'low' | 'critical' | 'error';
  product_code: number | null;
}

interface ApiMatrixValues {
  [colorCode: string]: {
    [size: string]: ApiMatrixCell | null;
  };
}

interface ApiMatrixTotals {
    base_balance: number;
    sales_orders: number;
    in_production: number;
}

export interface ApiProductMatrix {
  colors: ApiMatrixColor[];
  sizes: string[];
  values: ApiMatrixValues;
  totals: ApiMatrixTotals;
}

// -- ProductItem related (as returned by backend matrix endpoint) --
interface ApiBalance {
    branch_code: number;
    stock_code: number;
    stock_description: string;
    stock: number;
    sales_order: number;
    input_transaction: number;
    output_transaction: number;
    production_order_progress: number;
    production_order_wait_lib: number;
    stock_temp: number | null;
    production_planning: number | null;
    purchase_order: number | null;
}

// Raw item structure returned by the backend matrix endpoint
export interface ApiProductItem {
    product_code: number;
    product_name: string;
    product_sku: string;
    reference_code: string;
    color_code: string;
    color_name: string;
    size_name: string;
    balances: ApiBalance[]; // Expecting at least one balance object
    locations: any[] | null;
    max_change_filter_date: string | null;
}


// Interface for the full API response containing the matrix AND items
// This is the structure returned by the service now
export interface ProductMatrixApiResponse {
  calculation_mode: string;
  matrix: ApiProductMatrix;
  reference_code: string;
  product_items: ApiProductItem[]; // Added product_items
}

// --- Frontend Structure for Variant Details (derived from ApiProductItem) ---
export interface FormattedProductVariantDetails {
    product: {
        code: number;
        name: string;
        sku: string;
        reference_code: string;
        color: { code: string; name: string; };
        size: string;
    };
    balance_details: {
        branch_code: number;
        stock_type_code: number;
        stock_type_description: string;
        physical_stock: number;
        input_transactions: number;
        output_transactions: number;
        sales_orders: number;
        production_in_progress: number;
        production_awaiting_release: number;
        temp_stock?: number | null;
        purchase_orders?: number | null;
        production_planning?: number | null;
    };
    calculated_balances: {
        base: number;
        sales_available: number;
        production_available: number;
    }
}

// --- Helper Function to Calculate Balances from ApiProductItem ---
// (Similar logic as backend ProductItem domain model)
function calculateBalancesFromApiItem(item: ApiProductItem): { base: number; sales: number; production: number } {
    if (!item || !item.balances || item.balances.length === 0) {
        return { base: 0, sales: 0, production: 0 };
    }
    const balance = item.balances[0]; // Assume first balance entry is relevant
    const base = (balance.stock ?? 0) + (balance.input_transaction ?? 0) - (balance.output_transaction ?? 0);
    const sales = base - (balance.sales_order ?? 0);
    const production = sales + (balance.production_order_progress ?? 0) + (balance.production_order_wait_lib ?? 0);
    return { base, sales, production };
}


// --- Helper Function to Format ApiProductItem into Details Structure ---
export function formatApiProductItemForDetails(item: ApiProductItem | null): FormattedProductVariantDetails | null {
    if (!item || !item.balances || item.balances.length === 0) {
        return null;
    }
    const balance = item.balances[0]; // Assume first balance entry
    const calculated = calculateBalancesFromApiItem(item);

    return {
        product: {
            code: item.product_code,
            name: item.product_name,
            sku: item.product_sku,
            reference_code: item.reference_code,
            color: { code: item.color_code, name: item.color_name },
            size: item.size_name,
        },
        balance_details: {
            branch_code: balance.branch_code,
            stock_type_code: balance.stock_code,
            stock_type_description: balance.stock_description,
            physical_stock: balance.stock,
            input_transactions: balance.input_transaction,
            output_transactions: balance.output_transaction,
            sales_orders: balance.sales_order,
            production_in_progress: balance.production_order_progress,
            production_awaiting_release: balance.production_order_wait_lib,
            // Only include optional fields if they are not null
            ...(balance.stock_temp !== null && { temp_stock: balance.stock_temp }),
            ...(balance.purchase_order !== null && { purchase_orders: balance.purchase_order }),
            ...(balance.production_planning !== null && { production_planning: balance.production_planning }),
        },
        calculated_balances: {
            base: calculated.base,
            sales_available: calculated.sales,
            production_available: calculated.production,
        }
    };
}


// --- Service Functions ---

/**
 * Fetches the product balance matrix and raw items from the API.
 * Returns the full API response structure including 'product_items'.
 */
export async function getProductMatrixData(referenceCode: string, calculationMode: string): Promise<ProductMatrixApiResponse> {
  try {
    const response: ProductMatrixApiResponse = await api.getProductMatrix(referenceCode, calculationMode);
    console.log("Service received matrix data:", response); // Log the full response
    // Validate the *new* expected structure
    if (!response || !response.matrix || !response.matrix.colors || !response.matrix.sizes || !response.matrix.values || !response.matrix.totals || !Array.isArray(response.product_items)) {
        console.error("Invalid structure received from API (missing matrix or product_items):", response);
        throw new api.ApiError('Resposta inválida da API de matriz de produtos (estrutura incorreta).', 500, response);
    }
    return response;
  } catch (error) {
    console.error('Erro no serviço getProductMatrixData:', error);
    if (error instanceof ApiError) {
       throw error; // Re-throw specific API errors
    }
    // Throw a generic error for other issues
    throw new Error("Falha ao buscar dados da matriz de produtos.");
  }
}

// --- REMOVED getProductVariantDetails service function ---
// The data is now obtained from the product_items returned by getProductMatrixData

// --- Utility Functions (used by components) ---

/** Maps backend status string to frontend CSS class name */
export function getStatusClass(status?: string | null): string {
    switch (status) {
      case 'sufficient': return 'suficiente';
      case 'low': return 'baixo';
      case 'critical': return 'critico';
      case 'error': return 'erro'; // Handle potential error status from backend
      default: return ''; // Default empty class
    }
}

// --- Export/Table Extraction Functions ---

export function exportarCSV(tableData: string[][], referencia: string = 'produto'): void {
  if (!tableData || tableData.length === 0) {
    console.error('Dados da tabela não fornecidos para exportação.');
    alert('Não há dados na tabela para exportar.');
    return;
  }

  const csvString = convertToCSV(tableData);
  const dataHora = new Date().toLocaleString('pt-BR').replace(/[\/\s:]/g, '_');
  const nomeArquivo = `saldos_${referencia}_${dataHora}.csv`;

  downloadCSV(csvString, nomeArquivo);
}

function convertToCSV(data: string[][]): string {
  return data.map(row =>
    row.map(cell => {
        const cellStr = String(cell ?? ''); // Ensure string, handle null/undefined
        const escapedCell = cellStr.replace(/"/g, '""'); // Escape double quotes
        // Enclose in double quotes if it contains semicolon, newline, or double quote
        return /[";\n]/.test(escapedCell) ? `"${escapedCell}"` : escapedCell;
    }).join(';') // Use semicolon delimiter
  ).join('\n');
}

function downloadCSV(csvString: string, filename: string): void {
  const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel UTF-8
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Clean up
}

export function extractTableData(tableElement: HTMLTableElement): string[][] {
  const rows = tableElement.querySelectorAll('tr');
  const data: string[][] = [];

  rows.forEach(row => {
    const rowData: string[] = [];
    // Query both th and td elements to include header row
    const cells = row.querySelectorAll('th, td');
    cells.forEach(cell => {
      // Prioritize reading `textContent` for better representation of displayed data
      rowData.push(cell.textContent?.trim() ?? '');
    });
    data.push(rowData);
  });

  return data;
}