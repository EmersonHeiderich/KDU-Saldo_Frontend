// src/pages/Fiscal/Fiscal.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
// Use frontend interfaces and service functions
import * as fiscalService from '../../services/fiscalService';
import { Invoice, InvoiceFilters, InvoiceKPIs, InvoiceSearchResult } from '../../services/fiscalService';
// Import Components
import FiscalFiltersComponent from './components/FiscalFilters';
import FiscalKPIsComponent from './components/FiscalKPIs';
import InvoiceListComponent from './components/InvoiceList';
// Import CSS
import styles from './Fiscal.module.css';
import '../../components/BaseModal/BaseModal.css'; // For potential future modals

type SortField = keyof Invoice | null;
type SortDirection = 'asc' | 'desc';

const FiscalPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Extract initial filters from navigation state (if coming from Customer Panel)
    const initialCustomerFilter = location.state?.customerFilter || null; // e.g., { type: 'code' | 'cpf' | 'cnpj', value: '12345' }

    // State for filters
    const [filters, setFilters] = useState<InvoiceFilters>(() => {
        const today = new Date().toISOString().split('T')[0];
        // If coming from customer panel, use that filter, otherwise default to today's date
        return initialCustomerFilter
            ? { customer: initialCustomerFilter.value, startDate: null, endDate: null, status: null, invoiceNumber: null } // Start with only customer filter
            : { startDate: today, endDate: today, customer: null, status: null, invoiceNumber: null }; // Default to today
    });

    // State for data and UI
    const [searchResult, setSearchResult] = useState<InvoiceSearchResult | null>(null);
    const [kpis, setKpis] = useState<InvoiceKPIs | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isInitialLoad, setIsInitialLoad] = useState(true); // Track initial automatic load

    // State for sorting
    const [sortField, setSortField] = useState<SortField>('dataEmissao'); // Default sort
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // --- Permission Check ---
    useEffect(() => {
        const canAccess = user?.permissions.is_admin || user?.permissions.can_access_fiscal;
        if (user && !canAccess) {
            navigate('/'); // Redirect if no permission
        }
    }, [user, navigate]);

    // --- Data Fetching ---
    const fetchInvoices = useCallback(async (page = 1, currentFilters = filters, currentSortField = sortField, currentSortDirection = sortDirection) => {
        if (!user?.permissions.is_admin && !user?.permissions.can_access_fiscal) return;

        setIsLoading(true);
        setError(null);
        // Keep existing data while loading next page? Or clear? Clear for now.
        // If keeping, only clear on filter change, not page change.
        // setSearchResult(null); // Optional: clear results while loading
        // setKpis(null);

        try {
            const result = await fiscalService.searchInvoices(currentFilters, page, 50); // Use default page size from backend config if possible

            // Apply sorting after fetching (as backend sorting might not be implemented yet)
             const sortedInvoices = sortInvoicesLocally(result.invoices, currentSortField, currentSortDirection);
             result.invoices = sortedInvoices;

            setSearchResult(result);
            setCurrentPage(result.currentPage); // Update current page based on response

            // Calculate KPIs based on the *fetched* data for the current page
            // NOTE: KPIs calculated ONLY on the current page data. Full data KPIs would require fetching all pages.
            setKpis(fiscalService.calculateInvoiceKPIs(result.invoices));

        } catch (err: any) {
            console.error('Erro ao buscar notas fiscais:', err);
            setError(err.message || 'Erro ao carregar notas fiscais.');
            setSearchResult(null);
            setKpis(null);
        } finally {
            setIsLoading(false);
            setIsInitialLoad(false); // Mark initial load as done
        }
    }, [user, filters, sortField, sortDirection]); // Include dependencies that trigger a refetch

    // Trigger initial fetch on mount or when initial filters change
    useEffect(() => {
        fetchInvoices(1, filters); // Fetch page 1 with initial filters
    }, [filters]); // Rerun only if initial filters change (e.g., navigating back)


    // --- Sorting Logic (Client-side) ---
     const sortInvoicesLocally = (invoicesToSort: Invoice[], field: SortField, direction: SortDirection): Invoice[] => {
        if (!field) return invoicesToSort;

        const sorted = [...invoicesToSort].sort((a, b) => {
            let valA = a[field];
            let valB = b[field];

            // Handle null/undefined for sorting
            if (valA === null || valA === undefined) valA = direction === 'asc' ? Infinity : -Infinity;
            if (valB === null || valB === undefined) valB = direction === 'asc' ? Infinity : -Infinity;

            // Specific handling for date sorting
            if (field === 'dataEmissao' && typeof valA === 'string' && typeof valB === 'string') {
                 try {
                    const dateA = new Date(valA).getTime();
                    const dateB = new Date(valB).getTime();
                    if (!isNaN(dateA) && !isNaN(dateB)) {
                        if (dateA < dateB) return direction === 'asc' ? -1 : 1;
                        if (dateA > dateB) return direction === 'asc' ? 1 : -1;
                        return 0;
                    }
                 } catch { /* Fallback to string comparison if dates are invalid */ }
            }

            // Default comparison (numeric or string)
            if (typeof valA === 'number' && typeof valB === 'number') {
                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
            } else {
                 const strA = String(valA).toLowerCase();
                 const strB = String(valB).toLowerCase();
                 if (strA < strB) return direction === 'asc' ? -1 : 1;
                 if (strA > strB) return direction === 'asc' ? 1 : -1;
            }

            // Secondary sort by invoice number if primary values are equal
            const numA = a.numeroNota ?? 0;
            const numB = b.numeroNota ?? 0;
            if (numA < numB) return -1;
            if (numA > numB) return 1;

            return 0;
        });
        return sorted;
    };


    // --- Handlers ---
    const handleSearch = (newFilters: InvoiceFilters) => {
        setFilters(newFilters); // Update filters state
        setCurrentPage(1); // Reset to page 1 on new search
        // fetchInvoices will be triggered by the useEffect watching 'filters'
    };

    const handleClearFilters = () => {
         // Reset to default filters (today's date, unless coming from customer panel)
         const today = new Date().toISOString().split('T')[0];
         const defaultFilters = initialCustomerFilter
             ? { customer: initialCustomerFilter.value, startDate: null, endDate: null, status: null, invoiceNumber: null }
             : { startDate: today, endDate: today, customer: null, status: null, invoiceNumber: null };
        setFilters(defaultFilters);
        setCurrentPage(1);
        // fetchInvoices will be triggered by the useEffect watching 'filters'
    };

     const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= (searchResult?.totalPages || 1) && !isLoading) {
            setCurrentPage(newPage);
            fetchInvoices(newPage, filters, sortField, sortDirection); // Fetch the requested page
        }
    };

    const handleSort = (field: keyof Invoice) => {
         const newDirection = (field === sortField && sortDirection === 'asc') ? 'desc' : 'asc';
         setSortField(field);
         setSortDirection(newDirection);
         // Re-sort existing data or re-fetch? Re-sorting existing page data is faster
         if (searchResult) {
             const sortedInvoices = sortInvoicesLocally(searchResult.invoices, field, newDirection);
             setSearchResult({ ...searchResult, invoices: sortedInvoices });
         }
         // If backend sorting is implemented, trigger a refetch instead:
         // fetchInvoices(currentPage, filters, field, newDirection);
    };


    const handleCopyKey = (accessKey: string) => {
        navigator.clipboard.writeText(accessKey)
            .then(() => {
                alert('Chave de acesso copiada para a área de transferência!'); // Replace with a toast notification later
            })
            .catch(err => {
                console.error('Falha ao copiar chave de acesso:', err);
                alert('Não foi possível copiar a chave de acesso.');
            });
    };

    const handleGenerateDanfe = async (accessKey: string) => {
        // Add a loading indicator specifically for DANFE generation?
        const originalButtonText = 'Gerando DANFE...'; // Example, maybe target the specific button
        try {
            const pdfBlob = await fiscalService.getDanfePdfBlob(accessKey);
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `DANFE_${accessKey}.pdf`); // or target="_blank"
            link.target = '_blank'; // Open in new tab is usually preferred
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('Erro ao gerar DANFE:', error);
            setError(`Erro ao gerar DANFE: ${error.message || 'Erro desconhecido'}`);
            // Hide error after a delay?
            setTimeout(() => setError(null), 5000);
        } finally {
            // Reset button text/state if needed
        }
    };

    const handleViewDetails = (invoice: Invoice) => {
        // Placeholder for future implementation
        alert(`Detalhes da Nota Fiscal ${invoice.numeroNota} (Em breve)`);
    };

    const handleGoBack = () => {
        navigate(-1); // Go back to the previous page (e.g., Customer Panel)
    };


    return (
        <div className={styles.container}>
             <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1>Módulo Fiscal</h1>
                    <p className={styles.subtitle}>Consulta de Notas Fiscais Emitidas</p>
                </div>
                {/* Conditionally render Back button if navigated from Customer Panel */}
                {initialCustomerFilter && (
                    <button onClick={handleGoBack} className={`btn secondary ${styles.backButton}`}>
                        <i className="fas fa-arrow-left"></i> Voltar ao Painel
                    </button>
                )}
            </header>

            <FiscalFiltersComponent
                initialFilters={filters} // Pass current filters as initial state for controlled component
                onSearch={handleSearch}
                onClear={handleClearFilters}
                isLoading={isLoading}
                disableCustomerFilter={!!initialCustomerFilter} // Disable if customer was passed
            />

            <FiscalKPIsComponent kpis={kpis} isLoading={isLoading && !searchResult} />

            <InvoiceListComponent
                invoices={searchResult?.invoices || []}
                isLoading={isLoading}
                error={error}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onCopyKey={handleCopyKey}
                onGenerateDanfe={handleGenerateDanfe}
                onViewDetails={handleViewDetails}
            />

            {/* Pagination */}
            {searchResult && searchResult.totalPages > 1 && !isLoading && (
                <div className={styles.paginationContainer}>
                    <span className={styles.paginationInfo}>
                        Página {searchResult.currentPage} de {searchResult.totalPages} ({searchResult.totalItems} itens)
                    </span>
                    <div className={styles.paginationControls}>
                        <button
                            className="btn secondary small icon-only"
                            onClick={() => handlePageChange(searchResult.currentPage - 1)}
                            disabled={searchResult.currentPage <= 1 || isLoading}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <button
                            className="btn secondary small icon-only"
                            onClick={() => handlePageChange(searchResult.currentPage + 1)}
                            disabled={searchResult.currentPage >= searchResult.totalPages || isLoading}
                        >
                             <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FiscalPage;