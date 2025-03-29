// src/services/fabricService.ts

// Import specific API functions and ApiError
import { getFabricBalances, clearFabricCache, ApiError } from '../utils/api'; // Added clearFabricCache

// --- Interfaces ---

// Interface matching the backend API response structure for a single fabric
export interface ApiFabric {
  code: number;
  description: string;
  balance: number;
  cost: number | null;
  width: number | null;
  grammage: number | null;
  shrinkage: number | null;
}

// Interface for the overall API response containing the list
interface ApiFabricResponse {
  fabrics: ApiFabric[];
  total_items: number;
}

// Interface used within the frontend components
export interface Fabric {
    codigo: number;
    descricao: string;
    custo: number | null;
    saldo: number;
    largura?: number | null;
    gramatura?: number | null;
    encolhimento?: number | null;
}

// --- Mapping Function ---
function mapApiFabricToFrontend(apiFabric: ApiFabric): Fabric {
    return {
        codigo: apiFabric.code,
        descricao: apiFabric.description,
        custo: apiFabric.cost,
        saldo: apiFabric.balance,
        largura: apiFabric.width,
        gramatura: apiFabric.grammage,
        encolhimento: apiFabric.shrinkage,
    };
}


// --- Service Functions ---

/**
 * Fetches fabric data from the API and maps it to the frontend structure.
 */
export async function getFabricData(filtro: string | null, forceRefresh: boolean = false): Promise<Fabric[]> { // Added forceRefresh param
  try {
    // Pass forceRefresh to the API call
    const response: ApiFabricResponse = await getFabricBalances(filtro, forceRefresh);

    if (!response || !Array.isArray(response.fabrics)) {
      console.error('Formato de resposta inválido da API de tecidos:', response);
      throw new Error('Formato de resposta inválido ao buscar tecidos.');
    }

    return response.fabrics.map(mapApiFabricToFrontend);

  } catch (error) {
    console.error(`Erro ao buscar dados de tecidos:`, error);
    if (error instanceof ApiError) {
        throw new Error(error.message || 'Erro ao buscar tecidos.');
    }
    throw new Error('Ocorreu um erro de rede ou servidor ao consultar os tecidos.');
  }
}

/** Clears the fabric cache on the backend. */
export async function forceClearFabricCache(): Promise<void> {
    try {
        await clearFabricCache();
    } catch (error) {
        console.error("Erro ao limpar o cache de tecidos:", error);
        if (error instanceof ApiError) {
            throw new Error(error.message || 'Erro ao forçar atualização do cache.');
        }
        throw new Error('Falha ao solicitar atualização forçada do cache.');
    }
}


// --- Utility/Formatting Functions ---
// Removed: filterFabrics, sortFabrics, exportarCSVTecido (Handled by AG Grid)
// REMOVED: calculateFabricTotalizers (Now handled in component using Grid API)

// KEEP: Formatting functions used by AG Grid ValueFormatters/CellRenderers
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    try {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    } catch (e) {
         console.error("Error formatting currency:", value, e);
         return String(value);
    }
}

export function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
     try {
        // Ensure it's treated as a number for formatting
        return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
     } catch (e) {
          console.error("Error formatting number:", value, e);
          return String(value);
     }
}