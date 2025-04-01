// src/pages/AccountsReceivable/AccountsReceivable.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import Service functions and types
import * as arService from '../../services/accountsReceivableService';
import {
    ReceivableListItem,
    ReceivableFilters,
    ReceivableSearchResult,
    BoletoRequestPayload,
    formatCurrency,
    formatDate,
    formatNumber,
    ApiError
} from '../../services/accountsReceivableService';

// Import AG Grid component and types
import AgGridTable from '../../components/AgGridTable/AgGridTable';
import {
    ColDef,
    GridApi,
    GridOptions,
    ICellRendererParams,
    ValueGetterParams,
    GridReadyEvent,
    PaginationChangedEvent,
    SortChangedEvent
} from 'ag-grid-community';

// Import Page Components --- NEW ---
import AccountsReceivableFiltersComponent from './components/AccountsReceivableFilters';
import AdvancedFiltersModal from './components/AdvancedFiltersModal';

// Import CSS
import styles from './AccountsReceivable.module.css';
import '../../components/BaseModal/BaseModal.css';

// --- Cell Renderers (Keep BoletoActionRenderer as before) ---
const BoletoActionRenderer: React.FC<ICellRendererParams<ReceivableListItem>> = ({ data, context }) => {
    const { handleGenerateBoleto, boletoLoadingState } = context;
    const branchCode = data?.branchCode || 1; // Default branch if necessary
    const canGenerate = data?.customerCode && data?.documentNumber && data?.installmentNumber && branchCode;
    const isLoadingThisBoleto = boletoLoadingState &&
                                boletoLoadingState.receivableCode === data?.documentNumber &&
                                boletoLoadingState.installmentNumber === data?.installmentNumber;

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (canGenerate && data) {
            const payload: BoletoRequestPayload = {
                branchCode: branchCode,
                customerCode: data.customerCode!,
                receivableCode: data.documentNumber!,
                installmentNumber: data.installmentNumber!,
                customerCpfCnpj: data.customerCpfCnpj || undefined,
            };
            handleGenerateBoleto(payload);
        } else {
            console.warn("Cannot generate boleto, missing required data:", { ...data, branchCode });
            alert("Informações insuficientes para gerar o boleto (código cliente, documento, parcela, filial).");
        }
    };

    return (
        <div className={styles.actionsCell}>
            <button
                className={`${styles.actionButton} ${styles.boletoButton}`}
                onClick={onClick}
                disabled={!canGenerate || isLoadingThisBoleto || !!boletoLoadingState}
                title={canGenerate ? "Gerar Boleto PDF" : "Dados insuficientes para gerar boleto"}
            >
                {isLoadingThisBoleto ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-barcode"></i>}
            </button>
        </div>
    );
};


// --- Main Component ---
const AccountsReceivablePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const gridApiRef = useRef<GridApi<ReceivableListItem> | null>(null);

    // Define default initial filters (basic only)
    const getDefaultFilters = (): ReceivableFilters => {
        const today = new Date().toISOString().split('T')[0];
        return { startDate: today, endDate: today, customerCode: null, documentNumber: null, hasOpenInvoices: null };
    };

    // State for ALL filters (basic + advanced)
    const [filters, setFilters] = useState<ReceivableFilters>(getDefaultFilters());

    // State for data and UI
    const [searchResult, setSearchResult] = useState<ReceivableSearchResult | null>(null);
    const [receivables, setReceivables] = useState<ReceivableListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gridSortModel, setGridSortModel] = useState<any[] | null>(null);

    // State for boleto generation
    const [boletoLoadingState, setBoletoLoadingState] = useState<{ receivableCode: number; installmentNumber: number } | null>(null);
    const [boletoError, setBoletoError] = useState<string | null>(null);

    // State for Advanced Filters Modal --- NEW ---
    const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);


    // --- Permission Check ---
    useEffect(() => {
        const canAccess = user?.permissions.is_admin || true; // TODO: Replace with actual permission
        if (user && !canAccess) {
            console.warn("User does not have permission to access Accounts Receivable.");
            navigate('/');
        }
    }, [user, navigate]);

    // --- Data Fetching ---
    // fetchReceivables remains largely the same, now reads combined filters from state
    const fetchReceivables = useCallback(async (
        currentFilters: ReceivableFilters, // Takes the combined filter state
        page: number = 1,
        pageSize: number = 50,
        sortModel: any[] | null = gridSortModel
    ) => {
        setIsLoading(true);
        setError(null);
        setBoletoError(null);

        const sortString = sortModel?.map(s => `${s.sort === 'desc' ? '-' : ''}${s.colId}`).join(',') || null;

        try {
            // Pass the combined filters state directly to the service
            const result = await arService.searchAccountsReceivable(currentFilters, page, pageSize, sortString);
            setSearchResult(result);
            setReceivables(result.receivables);
        } catch (err: any) {
            console.error('Erro ao buscar contas a receber:', err);
            setError(err.message || 'Erro ao carregar contas a receber.');
            setReceivables([]);
            setSearchResult(null);
        } finally {
            setIsLoading(false);
        }
    }, [gridSortModel]); // Dependency only on sortModel, as filters are passed directly

    // Initial fetch on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReceivables(filters, 1, 50, null);
        }, 0);
        return () => clearTimeout(timer);
    }, []); // Run only once

    // --- Filter Handlers ---

    // Update specific filter field (basic or advanced)
    const handleFilterChange = useCallback((field: keyof ReceivableFilters, value: any) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    }, []);

    // Trigger search with current combined filters
    const handleSearch = useCallback(() => {
        if (gridApiRef.current) {
            if (gridApiRef.current.paginationIsLastPageFound()) {
                gridApiRef.current.paginationGoToFirstPage();
            }
        }
        fetchReceivables(filters, 1, gridApiRef.current?.paginationGetPageSize() ?? 50, gridSortModel);
    }, [filters, gridSortModel, fetchReceivables]); // Depend on filters and sort

    // Clear ALL filters (basic and advanced)
    const handleClearAllFilters = useCallback(() => {
        const defaultFilters = getDefaultFilters();
        setFilters(defaultFilters);
        setGridSortModel(null);
        if (gridApiRef.current) {
            if (gridApiRef.current.paginationIsLastPageFound()) {
                gridApiRef.current.paginationGoToFirstPage();
            }
            gridApiRef.current.setFilterModel(null);
            gridApiRef.current.setSortModel(null);
        }
        // Fetch immediately with default filters
        fetchReceivables(defaultFilters, 1, gridApiRef.current?.paginationGetPageSize() ?? 50, null);
    }, [fetchReceivables]); // Dependency on fetchReceivables

    // --- Advanced Filter Modal Handlers --- NEW ---

    const handleOpenAdvancedFilters = useCallback(() => {
        setIsAdvancedModalOpen(true);
    }, []);

    const handleCloseAdvancedFilters = useCallback(() => {
        setIsAdvancedModalOpen(false);
    }, []);

    // Apply only the advanced filters received from the modal
    const handleApplyAdvancedFilters = useCallback((advancedFilters: Partial<ReceivableFilters>) => {
        // Merge advanced filters into the main filter state
        // This preserves existing basic filters
        setFilters(prev => ({
            ...prev, // Keep existing filters (basic or previously applied advanced)
            ...advancedFilters // Overwrite/add advanced filters from modal
        }));
        // Important: Don't trigger fetch here, let the user click "Pesquisar" after applying
        handleCloseAdvancedFilters(); // Close modal after applying
    }, [handleCloseAdvancedFilters]);

    // Clear only the advanced filters
    const handleClearAdvancedFilters = useCallback(() => {
        // Create a new filter object keeping only the basic ones
        const basicFilters = getDefaultFilters(); // Get defaults which only contain basic
        const currentBasicValues: Partial<ReceivableFilters> = {
             customerCode: filters.customerCode,
             documentNumber: filters.documentNumber,
             startDate: filters.startDate,
             endDate: filters.endDate,
             hasOpenInvoices: filters.hasOpenInvoices
        };
        // Set the state to only the current basic filter values
        setFilters(currentBasicValues);
        // Note: This doesn't trigger a search immediately.
        // User needs to click "Pesquisar" or "Limpar Tudo" if they want to refetch.
        // Or, optionally trigger handleSearch() here if desired.
    }, [filters]); // Dependency on current filters to preserve basic ones

    // Calculate the count of *applied* advanced filters
    const appliedAdvancedFilterCount = useMemo(() => {
        let count = 0;
        const defaultBasic = getDefaultFilters();
        for (const key in filters) {
            // Check if the key is NOT one of the basic filters
            if (!Object.prototype.hasOwnProperty.call(defaultBasic, key)) {
                // Check if the filter has a non-null/non-empty value
                const value = filters[key as keyof ReceivableFilters];
                if (value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)) {
                    count++;
                }
            }
        }
        return count;
    }, [filters]);


    // --- Other Handlers (Pagination, Sort, Boleto) ---
    // These remain the same as the previous version
    const onPaginationChanged = useCallback((event: PaginationChangedEvent) => {
        if (gridApiRef.current) { console.log("Pagination Changed (Client-Side): New Page=", gridApiRef.current.paginationGetCurrentPage() + 1); }
    }, []);
    const onSortChanged = useCallback((event: SortChangedEvent) => {
        if (!gridApiRef.current) return;
        const newSortModel = gridApiRef.current.getSortModel();
        setGridSortModel(newSortModel);
        console.log("Sort Changed (Client-Side): New Model=", newSortModel);
    }, []);
    const handleGenerateBoleto = useCallback(async (payload: BoletoRequestPayload) => {
        setBoletoLoadingState({ receivableCode: payload.receivableCode, installmentNumber: payload.installmentNumber });
        setBoletoError(null); setError(null);
        try {
            const pdfBlob = await arService.generateBoleto(payload);
            const url = window.URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error: any) {
            console.error('Erro ao gerar Boleto:', error);
            const errorMsg = error.message || 'Erro desconhecido ao gerar o boleto.';
            setBoletoError(`Falha ao gerar boleto para Título ${payload.receivableCode}/${payload.installmentNumber}: ${errorMsg}`);
        } finally {
            setBoletoLoadingState(null);
        }
    }, []);


    // --- AG Grid Configuration (Keep as before) ---
    const documentValueGetter = (params: ValueGetterParams<ReceivableListItem>): string => {
        const docNum = params.data?.documentNumber ?? '?';
        const instNum = params.data?.installmentNumber ?? '?';
        return `${docNum}/${instNum}`;
    };
    const columnDefs = useMemo<ColDef<ReceivableListItem>[]>(() => [
         { headerName: 'Cliente', field: 'customerCode', width: 100, filter: 'agNumberColumnFilter', tooltipValueGetter: (params) => params.data?.customerName ? `${params.data.customerCode} - ${params.data.customerName}` : params.value?.toString(), sortable: true },
         { headerName: 'Nome', field: 'customerName', flex: 2, minWidth: 200, filter: 'agTextColumnFilter', sortable: true },
         { headerName: 'Nota Fiscal', field: 'invoiceNumber', width: 110, filter: 'agNumberColumnFilter', type: 'numericColumn', cellStyle: { textAlign: 'right' }, sortable: true },
         { headerName: 'Documento', colId: 'documentDisplay', valueGetter: documentValueGetter, filter: 'agTextColumnFilter', sortable: false, width: 130, tooltipValueGetter: (params) => `Documento: ${params.data?.documentNumber ?? '?'} | Parcela: ${params.data?.installmentNumber ?? '?'}` },
         { headerName: 'Portador', field: 'bearerName', width: 150, filter: 'agTextColumnFilter', sortable: true },
         { headerName: 'Emissão', field: 'issueDate', valueFormatter: (params) => formatDate(params.value), filter: 'agDateColumnFilter', filterParams: { comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => { if (!cellValue) return -1; const cellDate = new Date(cellValue); if (isNaN(cellDate.getTime())) return -1; const cellDateMidnight = new Date(Date.UTC(cellDate.getUTCFullYear(), cellDate.getUTCMonth(), cellDate.getUTCDate())); if (cellDateMidnight < filterLocalDateAtMidnight) return -1; if (cellDateMidnight > filterLocalDateAtMidnight) return 1; return 0; } }, width: 120, sortable: true },
         { headerName: 'Vencimento', field: 'expiredDate', valueFormatter: (params) => formatDate(params.value), filter: 'agDateColumnFilter', filterParams: { comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => { if (!cellValue) return -1; const cellDate = new Date(cellValue); if (isNaN(cellDate.getTime())) return -1; const cellDateMidnight = new Date(Date.UTC(cellDate.getUTCFullYear(), cellDate.getUTCMonth(), cellDate.getUTCDate())); if (cellDateMidnight < filterLocalDateAtMidnight) return -1; if (cellDateMidnight > filterLocalDateAtMidnight) return 1; return 0; } }, width: 120, sortable: true },
         { headerName: 'Atraso', field: 'daysLate', headerTooltip: 'Dias em atraso (se vencido e não pago)', width: 90, type: 'numericColumn', cellStyle: (params) => (params.value && params.value > 0 ? { color: 'var(--danger-dark)', fontWeight: 'bold', textAlign: 'center' } : { textAlign: 'center' }), valueFormatter: (params) => (params.value !== null && params.value !== undefined) ? params.value.toString() : '-', filter: 'agNumberColumnFilter', sortable: true },
         { headerName: 'Pagamento', field: 'paymentDate', valueFormatter: (params) => formatDate(params.value), filter: 'agDateColumnFilter', filterParams: { comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => { if (!cellValue) return -1; const cellDate = new Date(cellValue); if (isNaN(cellDate.getTime())) return -1; const cellDateMidnight = new Date(Date.UTC(cellDate.getUTCFullYear(), cellDate.getUTCMonth(), cellDate.getUTCDate())); if (cellDateMidnight < filterLocalDateAtMidnight) return -1; if (cellDateMidnight > filterLocalDateAtMidnight) return 1; return 0; } }, width: 120, sortable: true },
         { headerName: 'Vlr Original', field: 'valueOriginal', valueFormatter: (params) => formatCurrency(params.value), type: 'numericColumn', width: 130, filter: 'agNumberColumnFilter', sortable: true, cellStyle: { textAlign: 'right' }, },
         { headerName: 'Acréscimo', field: 'valueIncrease', valueFormatter: (params) => formatCurrency(params.value), type: 'numericColumn', width: 120, filter: 'agNumberColumnFilter', sortable: true, cellStyle: (params) => ({ textAlign: 'right', color: (params.value && params.value > 0 ? 'var(--success-dark)' : 'inherit') }) as any, },
         { headerName: 'Abatimento', field: 'valueRebate', valueFormatter: (params) => formatCurrency(params.value), type: 'numericColumn', width: 120, filter: 'agNumberColumnFilter', sortable: true, cellStyle: (params) => ({ textAlign: 'right', color: (params.value && params.value > 0 ? 'var(--danger-dark)' : 'inherit') }) as any, },
         { headerName: 'Vlr Pago', field: 'valuePaid', valueFormatter: (params) => formatCurrency(params.value), type: 'numericColumn', width: 130, filter: 'agNumberColumnFilter', sortable: true, cellStyle: { textAlign: 'right' }, },
         { headerName: 'Vlr Corrigido', field: 'valueCorrected', valueFormatter: (params) => formatCurrency(params.value), headerTooltip: 'Valor original + acréscimos - abatimentos', type: 'numericColumn', width: 130, filter: 'agNumberColumnFilter', sortable: true, cellStyle: { fontWeight: 'bold', textAlign: 'right' } as any, },
         { headerName: 'Boleto', colId: 'actions', cellRenderer: BoletoActionRenderer, filter: false, sortable: false, resizable: false, width: 80, minWidth: 80, maxWidth: 80, cellStyle: { textAlign: 'center', padding: '0' }, pinned: 'right', lockPinned: true },
    ], []);
    const defaultColDef = useMemo<ColDef>(() => ({ resizable: true, sortable: true, filter: true, floatingFilter: true, suppressMenu: false, minWidth: 90, cellDataType: false, }), []);
    const gridOptions = useMemo<GridOptions<ReceivableListItem>>(() => ({ context: { handleGenerateBoleto: handleGenerateBoleto, boletoLoadingState: boletoLoadingState, }, pagination: true, paginationPageSize: 50, paginationPageSizeSelector: [25, 50, 100, 200], suppressPaginationPanel: false, suppressRowClickSelection: true, animateRows: true, rowHeight: 40, headerHeight: 40, floatingFiltersHeight: 35, onPaginationChanged: onPaginationChanged, onSortChanged: onSortChanged, localeText: { page: 'Página', to: 'a', of: 'de', firstPage: 'Primeira', lastPage: 'Última', nextPage: 'Próxima', previousPage: 'Anterior', contains: 'Contém', notContains: 'Não contém', equals: 'Igual a', notEqual: 'Diferente de', startsWith: 'Começa com', endsWith: 'Termina com', }, }), [handleGenerateBoleto, boletoLoadingState, onPaginationChanged, onSortChanged]);


    // --- JSX ---
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Contas a Receber</h1>
                <p className={styles.subtitle}>Consulta e gerenciamento de títulos a receber</p>
            </header>

            {/* Use the new Filters Component */}
            <AccountsReceivableFiltersComponent
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                onClear={handleClearAllFilters} // Use the clear all handler
                onOpenAdvancedFilters={handleOpenAdvancedFilters}
                isLoading={isLoading}
                appliedAdvancedFilterCount={appliedAdvancedFilterCount}
            />

            {/* Error Display Area */}
            {error && !isLoading && (
                <div className={styles.errorState}>
                    <i className="fas fa-exclamation-triangle"></i> <p>{error}</p>
                </div>
            )}
            {boletoError && (
                 <div className={`${styles.errorState} ${styles.boletoErrorState}`}>
                    <i className="fas fa-exclamation-circle"></i> <p>{boletoError}</p>
                    <button onClick={() => setBoletoError(null)} className={styles.closeErrorButton} title="Fechar erro">×</button>
                 </div>
            )}

            {/* AG Grid Table Wrapper */}
            <div className={`ag-theme-quartz ${styles.gridWrapper}`} style={{ flexGrow: 1, width: '100%' }}>
                <AgGridTable<ReceivableListItem>
                    gridId="accountsReceivableTable"
                    rowData={receivables}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    gridOptions={gridOptions}
                    isLoading={isLoading}
                    onGridReadyCallback={(api) => { gridApiRef.current = api; }}
                    onPaginationChanged={onPaginationChanged}
                    onSortChanged={onSortChanged}
                />
            </div>

            {/* Advanced Filters Modal */}
            <AdvancedFiltersModal
                isOpen={isAdvancedModalOpen}
                onClose={handleCloseAdvancedFilters}
                initialFilters={filters} // Pass current full filter state
                onApplyFilters={handleApplyAdvancedFilters}
                onClearAdvancedFilters={handleClearAdvancedFilters}
            />

        </div>
    );
};

export default AccountsReceivablePage;