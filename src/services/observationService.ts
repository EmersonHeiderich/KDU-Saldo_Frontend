// src/services/observationService.ts

// Import specific API functions and ApiError
import {
  getProductObservations,
  getProductObservationsCount,
  postProductObservation,
  resolveProductObservation,
  getPendingObservationsRefs,
  ApiError
} from '../utils/api';

// Re-exportando o ApiError para que os componentes possam importá-lo daqui
export { ApiError };

// --- Interfaces ---

// Interface matching backend API response for a single observation
export interface ApiObservation {
id: number;
reference_code: string;
observation_text: string;
user: string;
timestamp: string; // ISO Format String
resolved: boolean;
resolved_user: string | null;
resolved_timestamp: string | null; // ISO Format String or null
}

// Interface matching backend API response for pending references
export interface ApiPendingReference {
reference_code: string;
user: string;
timestamp: string; // ISO Format String
}

// Interface used within the frontend components (camelCase)
export interface Observation {
id: number;
referenceCode: string;
observationText: string;
user: string;
timestamp: string; // Keep as string, format in component
resolved: boolean;
resolvedUser?: string | null;
resolvedTimestamp?: string | null;
}

// Interface for Frontend Pending Reference (camelCase)
export interface PendingReference {
referenceCode: string;
user: string;
timestamp: string;
}


// --- Mapping Functions ---

function mapApiObservationToFrontend(apiObs: ApiObservation): Observation {
  return {
      id: apiObs.id,
      referenceCode: apiObs.reference_code,
      observationText: apiObs.observation_text,
      user: apiObs.user,
      timestamp: apiObs.timestamp,
      resolved: apiObs.resolved,
      resolvedUser: apiObs.resolved_user,
      resolvedTimestamp: apiObs.resolved_timestamp,
  };
}

function mapApiPendingReferenceToFrontend(apiRef: ApiPendingReference): PendingReference {
  return {
      referenceCode: apiRef.reference_code,
      user: apiRef.user,
      timestamp: apiRef.timestamp,
  };
}


// --- Service Functions ---

/** Fetches observations and maps them to the frontend structure. */
export async function getObservations(referenceCode: string): Promise<Observation[]> {
try {
  // API returns the array directly
  const response: ApiObservation[] = await getProductObservations(referenceCode);
  if (!Array.isArray(response)) {
       console.error("Invalid response format for getObservations:", response);
       throw new Error("Formato de resposta inválido ao buscar observações.");
  }
  return response.map(mapApiObservationToFrontend);
} catch (error) {
  console.error('Erro no serviço getObservations:', error);
  if (error instanceof ApiError) {
     throw new Error(error.message || "Erro ao buscar observações.");
  }
  throw new Error("Falha ao buscar observações."); // Generic fallback
}
}

/** Fetches the count of unresolved observations. */
export async function getUnresolvedObservationsCount(referenceCode: string, retryCount = 0): Promise<{ count: number }> {
const maxRetries = 1;

try {
  if (retryCount > 0) {
    await new Promise(resolve => setTimeout(resolve, 300 * retryCount));
  }
  const response = await getProductObservationsCount(referenceCode);
   if (response && typeof response.unresolved_count === 'number') {
      return { count: response.unresolved_count };
   }
   console.error("Invalid response format for getUnresolvedObservationsCount:", response);
   throw new Error("Formato de resposta inválido ao buscar contagem de observações.");

} catch (error) {
  console.error(`Erro ao buscar contagem (tentativa ${retryCount + 1}):`, error);
  if (retryCount < maxRetries) {
    return getUnresolvedObservationsCount(referenceCode, retryCount + 1);
  }
   // Return 0 count on final failure
   console.error("Falha final ao buscar contagem de observações após retentativas.");
   return { count: 0 };
}
}

/** Marks an observation as resolved. */
export async function resolveObservation(observationId: number): Promise<void> {
try {
  await resolveProductObservation(observationId);
} catch (error) {
  console.error('Erro no serviço resolveObservation:', error);
  if (error instanceof ApiError) {
     throw new Error(error.message || "Erro ao marcar observação como resolvida.");
  }
  throw new Error("Falha ao resolver observação.");
}
}

/** Creates a new observation. */
export async function createObservation(referenceCode: string, observationText: string): Promise<void> {
if (!observationText.trim()) {
    throw new Error("O texto da observação não pode estar vazio.");
}
try {
  // API function expects { observation_text: ... }
  await postProductObservation(referenceCode, observationText);
} catch (error) {
  console.error('Erro no serviço createObservation:', error);
  if (error instanceof ApiError) {
     throw new Error(error.message || "Erro ao criar observação.");
  }
  throw new Error("Falha ao salvar observação.");
}
}

/** Fetches references with pending observations and maps them. */
export async function getPendingObservationsReferences(searchTerm: string = ''): Promise<PendingReference[]> {
try {
  const response: ApiPendingReference[] = await getPendingObservationsRefs();
   if (!Array.isArray(response)) {
       console.error("Invalid response format for getPendingObservationsReferences:", response);
       throw new Error("Formato de resposta inválido ao buscar referências pendentes.");
   }

  let references = response.map(mapApiPendingReferenceToFrontend);

  if (searchTerm.trim()) {
    const term = searchTerm.trim().toLowerCase();
    references = references.filter(ref =>
      ref.referenceCode.toLowerCase().includes(term) ||
      ref.user.toLowerCase().includes(term)
    );
  }

  // Sort by timestamp descending
  references.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return references;
} catch (error) {
  console.error('Erro no serviço getPendingObservationsReferences:', error);
  if (error instanceof ApiError) {
     throw new Error(error.message || "Erro ao buscar referências pendentes.");
  }
  throw new Error("Falha ao buscar referências com observações pendentes.");
}
}

// --- Utility Functions ---
export function formatDate(dateString: string | null | undefined): string {
if (!dateString) return '-';
try {
    const date = new Date(dateString);
     if (isNaN(date.getTime())) {
          console.warn(`Invalid date string for formatDate: ${dateString}`);
          return dateString;
      }
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
} catch (e) {
    console.error(`Error formatting date: ${dateString}`, e);
    return dateString;
}
}
