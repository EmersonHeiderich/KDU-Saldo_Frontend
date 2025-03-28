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
    codigo: number; // Keep as number
    descricao: string;
    custo: number | null;
    saldo: number;
    largura?: number | null;
    gramatura?: number | null;
    encolhimento?: number | null;
}

// --- State for Sorting ---
// Moved sorting state management entirely to the component (Fabrics.tsx)
// export const ordenacaoAtual = { campo: 'saldo' as keyof Fabric, direcao: 'desc' as 'asc' | 'desc' };

// --- Mapping Function ---
function mapApiFabricToFrontend(apiFabric: ApiFabric): Fabric {
    return {
        codigo: apiFabric.code, // Keep as number
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

/**
 * Filters the fabric list based on search text (client-side).
 */
export function filterFabrics(fabrics: Fabric[], filterText: string): Fabric[] { // <-- ADDED and EXPORTED filter function
    if (!filterText.trim()) {
        return fabrics;
    }
    const lowerFilter = filterText.toLowerCase();
    return fabrics.filter(fabric =>
        fabric.descricao.toLowerCase().includes(lowerFilter) ||
        String(fabric.codigo).toLowerCase().includes(lowerFilter) // Filter by code as string
    );
}

export function sortFabrics(fabrics: Fabric[], campo: keyof Fabric, direcao: 'asc' | 'desc'): Fabric[] {
    const validSortFields: (keyof Fabric)[] = ['codigo', 'descricao', 'custo', 'saldo', 'largura', 'gramatura', 'encolhimento'];

    if (!(validSortFields as string[]).includes(campo)) {
        console.warn(`Attempted to sort by invalid field: ${campo}. Defaulting to 'saldo'.`);
        campo = 'saldo';
    }

    const sortField = campo;

    return [...fabrics].sort((a, b) => {
        let valorA = a[sortField];
        let valorB = b[sortField];

        const numericFields: (keyof Fabric)[] = ['codigo', 'saldo', 'custo', 'largura', 'gramatura', 'encolhimento'];
        if (numericFields.includes(sortField)) {
            valorA = Number(valorA ?? (direcao === 'asc' ? Infinity : -Infinity));
            valorB = Number(valorB ?? (direcao === 'asc' ? Infinity : -Infinity));
        } else {
            valorA = String(valorA ?? '').toLowerCase();
            valorB = String(valorB ?? '').toLowerCase();
        }

        if (valorA < valorB) return direcao === 'asc' ? -1 : 1;
        if (valorA > valorB) return direcao === 'asc' ? 1 : -1;

        if (sortField !== 'descricao') {
             const descA = String(a.descricao ?? '').toLowerCase();
             const descB = String(b.descricao ?? '').toLowerCase();
             if (descA < descB) return -1;
             if (descA > descB) return 1;
        }
        if (sortField !== 'codigo' && sortField !== 'descricao') {
            const codeA = Number(a.codigo ?? 0);
            const codeB = Number(b.codigo ?? 0);
            if (codeA < codeB) return -1;
            if (codeA > codeB) return 1;
        }

        return 0;
    });
}

export function calculateFabricTotalizers(fabrics: Fabric[]): { totalSaldo: number; totalValor: number } {
  if (!fabrics || fabrics.length === 0) {
    return { totalSaldo: 0, totalValor: 0 };
  }

  let totalSaldo = 0;
  let totalValor = 0;

  fabrics.forEach(tecido => {
    const saldo = Number(tecido.saldo) || 0;
    const custo = Number(tecido.custo ?? 0);

    totalSaldo += saldo;
    totalValor += saldo * custo;
  });

  return { totalSaldo, totalValor };
}

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
        return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
     } catch (e) {
          console.error("Error formatting number:", value, e);
          return String(value);
     }
}

function formatNumberForCSV(value: number | null | undefined, decimalPlaces: number = 2): string {
    if (value === null || value === undefined) return '';
    try {
        // Use toFixed for consistent decimal places, then replace dot with comma
        return value.toFixed(decimalPlaces).replace('.', ',');
    } catch {
        return String(value);
    }
}


export function exportarCSVTecido(fabrics: Fabric[]): void {
    if (!fabrics || fabrics.length === 0) {
      console.error('Não há dados de tecidos para exportar.');
      alert('Não há dados para exportar.');
      return;
    }

    const headers = [
      'Código',
      'Descrição',
      'Custo Unitário',
      'Saldo',
      'Largura (m)',
      'Gramatura (g/m²)',
      'Encolhimento (%)',
      'Valor Total (Saldo * Custo)'
    ];

    const csvRows = [headers];

    fabrics.forEach(tecido => {
      const custo = tecido.custo ?? 0;
      const saldo = tecido.saldo ?? 0;
      const valorTotal = saldo * custo;
      const row = [
        String(tecido.codigo ?? ''),
        String(tecido.descricao ?? ''),
        formatNumberForCSV(tecido.custo, 2),
        saldo.toString(), // Saldo usually doesn't need decimal formatting for CSV
        formatNumberForCSV(tecido.largura, 2),
        formatNumberForCSV(tecido.gramatura, 0),
        formatNumberForCSV(tecido.encolhimento, 1),
        formatNumberForCSV(valorTotal, 2)
      ];
      csvRows.push(row);
    });

    const csvContent = csvRows.map(row =>
      row.map(cell => {
        const cellStr = cell.replace(/"/g, '""');
        return /[";\n]/.test(cellStr) ? `"${cellStr}"` : cellStr;
      }).join(';')
    ).join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `tecidos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}