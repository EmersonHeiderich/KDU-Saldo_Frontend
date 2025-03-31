// src/pages/Fiscal/Fiscal.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
// Use frontend interfaces and service functions
import * as fiscalService from '../../services/fiscalService';
import { Invoice, InvoiceFilters, InvoiceKPIs, InvoiceSearchResult } from '../../services/fiscalService';

// Import AG Grid component and types
import AgGridTable from '../../components/AgGridTable/AgGridTable';
import {
    ColDef,
    GridApi,
    GridOptions,
    GridReadyEvent,
    PaginationChangedEvent,
    FilterChangedEvent, // To update KPIs on filter change
    SortChangedEvent // To update KPIs on sort change
} from 'ag-grid-community';

// Import Page Components
import FiscalFiltersComponent from './components/FiscalFilters';
import FiscalKPIsComponent from './components/FiscalKPIs';
import StatusCellRenderer from './components/StatusCellRenderer'; // Import new renderer
import ActionsCellRenderer from './components/ActionsCellRenderer'; // Import new renderer

// Import CSS
import styles from './Fiscal.module.css';
import '../../components/BaseModal/BaseModal.css'; // For potential future modals

const FiscalPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const gridApiRef = useRef<GridApi<Invoice> | null>(null); // Ref for AG Grid API

    // Extract initial filters from navigation state (if coming from Customer Panel)
    const initialCustomerFilter = location.state?.customerFilter || null;

    // State for filters
    const [filters, setFilters] = useState<InvoiceFilters>(() => {
        const today = new Date().toISOString().split('T')[0];
        return initialCustomerFilter
            ? { customer: initialCustomerFilter.value, startDate: null, endDate: null, status: null, invoiceNumber: null }
            : { startDate: today, endDate: today, customer: null, status: null, invoiceNumber: null };
    });

    // State for data and UI
    const [searchResult, setSearchResult] = useState<InvoiceSearchResult | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]); // Store current page invoices
    const [kpis, setKpis] = useState<InvoiceKPIs | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const PAGE_SIZE = 50; // Define page size

    // State for specific loading indicators
    const [danfeLoading, setDanfeLoading] = useState<string | null>(null); // Store access key being loaded

    // --- Permission Check ---
    useEffect(() => {
        const canAccess = user?.permissions.is_admin || user?.permissions.can_access_fiscal;
        if (user && !canAccess) {
            navigate('/');
        }
    }, [user, navigate]);

    // --- Data Fetching ---
    const fetchInvoices = useCallback(async (page = 1, currentFilters = filters) => {
        if (!user?.permissions.is_admin && !user?.permissions.can_access_fiscal) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await fiscalService.searchInvoices(currentFilters, page, PAGE_SIZE);
            setInvoices(result.invoices);
            setCurrentPage(result.currentPage);
            setTotalPages(result.totalPages);
            setTotalItems(result.totalItems);
            // KPIs will be calculated based on grid data after rendering
        } catch (err: any) {
            console.error('Erro ao buscar notas fiscais:', err);
            setError(err.message || 'Erro ao carregar notas fiscais.');
            setInvoices([]); // Clear data on error
            setKpis(null);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setIsLoading(false);
        }
    }, [user, filters]); // Adjusted dependencies

    // Trigger initial fetch on mount or when filters change
    useEffect(() => {
        fetchInvoices(1, filters); // Fetch page 1 with initial filters
    }, [filters, fetchInvoices]); // Added fetchInvoices as dependency

    // ======================================================================
    // Define Callbacks BEFORE useMemo that uses them
    // ======================================================================

    const updateKpisFromGrid = useCallback(() => {
        if (gridApiRef.current) {
            let count = 0;
            let totalValue = 0;
            let totalQuantity = 0;

            gridApiRef.current.forEachNodeAfterFilterAndSort(node => {
                if (node.data) {
                    count++;
                    totalValue += node.data.valorTotal ?? 0;
                    totalQuantity += node.data.quantidadeTotal ?? 0;
                }
            });

            setKpis({
                count: count,
                totalValue: totalValue,
                averageValue: count > 0 ? totalValue / count : 0,
                totalQuantity: totalQuantity,
                averageQuantity: count > 0 ? totalQuantity / count : 0,
            });
        } else {
            setKpis(fiscalService.calculateInvoiceKPIs(invoices));
        }
    }, [invoices]); // Dependency on invoices is correct here

    const handlePageChange = useCallback((newPage: number) => {
       // Added checks for isLoading and totalPages
       if (!isLoading && newPage >= 1 && newPage <= totalPages) {
           fetchInvoices(newPage, filters);
       }
    }, [isLoading, totalPages, filters, fetchInvoices]); // Dependencies look okay

    const handleCopyKey = useCallback((accessKey: string) => {
        navigator.clipboard.writeText(accessKey)
            .then(() => {
                alert('Chave de acesso copiada!'); // Replace with a better notification
            })
            .catch(err => {
                console.error('Falha ao copiar chave de acesso:', err);
                alert('Não foi possível copiar a chave.');
            });
    }, []); // No dependencies needed

    const handleGenerateDanfe = useCallback(async (accessKey: string) => {
        setDanfeLoading(accessKey);
        setError(null);
        try {
            const pdfBlob = await fiscalService.getDanfePdfBlob(accessKey);
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('Erro ao gerar DANFE:', error);
            setError(`Erro ao gerar DANFE: ${error.message || 'Erro desconhecido'}`);
            setTimeout(() => setError(null), 7000);
        } finally {
            setDanfeLoading(null);
        }
    }, []); // No dependencies needed

    // ======================================================================
    // AG Grid Configuration (Now uses callbacks defined above)
    // ======================================================================

    const columnDefs = useMemo<ColDef<Invoice>[]>(() => [
        {
            headerName: 'Status',
            field: 'status',
            cellRenderer: StatusCellRenderer,
            filter: 'agSetColumnFilter',
            filterParams: {
                values: fiscalService.STATUS_OPTIONS.map(opt => opt.value),
                valueFormatter: (params: {value: string}) => fiscalService.STATUS_OPTIONS.find(opt => opt.value === params.value)?.label || params.value,
            },
            sortable: true,
            width: 120,
            maxWidth: 130,
            resizable: false,
            cellStyle: { 
                textAlign: 'center', 
                paddingTop: '7px', 
                paddingBottom: '7px' 
            } as any,
        },
        {
            headerName: 'Destinatário',
            field: 'destinatario',
            filter: 'agTextColumnFilter',
            tooltipField: 'destinatario',
            sortable: true,
            flex: 2,
            minWidth: 200,
        },
        {
            headerName: 'Ped. Venda',
            field: 'pedidoVenda',
            filter: 'agNumberColumnFilter',
            sortable: true,
            width: 120,
            type: 'numericColumn',
        },
        {
            headerName: 'Num. NF',
            field: 'numeroNota',
            filter: 'agNumberColumnFilter',
            sortable: true,
            width: 110,
            type: 'numericColumn',
        },
        {
            headerName: 'Série',
            field: 'serieNota',
            filter: 'agTextColumnFilter',
            sortable: true,
            width: 70,
            type: 'numericColumn',
        },
        {
            headerName: 'Emissão',
            field: 'dataEmissao',
            valueFormatter: (params) => fiscalService.formatDate(params.value),
            filter: 'agDateColumnFilter',
            filterParams: {
                 comparator: (filterLocalDateAtMidnight: Date, cellValue: string) => {
                     if (!cellValue) return -1;
                     const cellDate = new Date(cellValue);
                      // Handle invalid date strings from API gracefully
                     if (isNaN(cellDate.getTime())) return -1;
                     // Compare dates only, ignoring time
                     const cellDateMidnight = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());

                     if (cellDateMidnight < filterLocalDateAtMidnight) return -1;
                     if (cellDateMidnight > filterLocalDateAtMidnight) return 1;
                     return 0;
                 },
                 browserDatePicker: true, // Use browser's date picker in filter
                 buttons: ['apply', 'reset'],
                 debounceMs: 200,
            },
            sortable: true,
            width: 110,
        },
        {
            headerName: 'Valor Total',
            field: 'valorTotal',
            valueFormatter: (params) => fiscalService.formatCurrency(params.value),
            filter: 'agNumberColumnFilter',
            sortable: true,
            width: 130,
            type: 'numericColumn',
            cellStyle: { fontWeight: 500 } as any
        },
        {
            headerName: 'Qtde. Itens',
            field: 'quantidadeTotal',
            valueFormatter: (params) => fiscalService.formatNumber(params.value),
            filter: 'agNumberColumnFilter',
            sortable: true,
            width: 110,
            type: 'numericColumn',
        },
        {
            headerName: 'Operação',
            field: 'operacao',
            filter: 'agTextColumnFilter',
            sortable: true,
            tooltipField: 'operacao',
            flex: 1,
            minWidth: 150,
        },
        {
            headerName: 'Transportadora',
            field: 'transportadora',
            filter: 'agTextColumnFilter',
            sortable: true,
            tooltipField: 'transportadora',
            flex: 1,
            minWidth: 150,
        },
        {
            headerName: 'Ações',
            colId: 'actions',
            cellRenderer: ActionsCellRenderer,
            filter: false,
            sortable: false,
            resizable: false,
            width: 100,
            minWidth: 100,
            maxWidth: 100,
            cellStyle: { 
                padding: '0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
            } as any,
            pinned: 'right',
            lockPinned: true,
        },
    ], []); // Dependencies remain empty

    const defaultColDef = useMemo<ColDef>(() => ({
        resizable: true,
        sortable: true,
        filter: true,
        floatingFilter: true,
        suppressMenu: false,
        minWidth: 80,
    }), []);

     // Define gridOptions separately to pass context
    const gridOptions = useMemo<GridOptions<Invoice>>(() => ({
        context: {
            // Pass handlers needed by cell renderers
            handleCopyKey: handleCopyKey, // Pass the memoized function directly
            handleGenerateDanfe: handleGenerateDanfe, // Pass the memoized function directly
        },
        pagination: true,
        paginationPageSize: PAGE_SIZE,
        suppressPaginationPanel: false,
        suppressRowClickSelection: true,
        animateRows: true,
        onPaginationChanged: (event: PaginationChangedEvent) => {
            // Check if the change was triggered by the API call itself or user interaction
            const newPageNumber = event.api.paginationGetCurrentPage() + 1;
            if (event.newPage && newPageNumber !== currentPage) {
                handlePageChange(newPageNumber); // Correctly reference memoized function
            }
        },
        rowHeight: 42,
        headerHeight: 40,
        floatingFiltersHeight: 35,
         // Optional: Handle DANFE loading state visually (e.g., disable action button)
         // This requires passing the `danfeLoading` state to the context or renderer
         // For simplicity, keeping it as is for now. A visual cue on the button itself might be better.

    }), [currentPage, handleCopyKey, handleGenerateDanfe, handlePageChange]); // Include memoized functions in dependency array


    // AG Grid API Ready Callback
    const onGridReady = useCallback((params: GridReadyEvent<Invoice>) => {
        gridApiRef.current = params.api;
        // KPIs will be updated by onFirstDataRendered in gridOptions
    }, []); // No dependencies needed


    // --- Other Handlers ---
    const handleSearch = (newFilters: InvoiceFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
        // fetchInvoices will be triggered by the useEffect watching 'filters'
    };

    const handleClearFilters = () => {
         const today = new Date().toISOString().split('T')[0];
         const defaultFilters = initialCustomerFilter
             ? { customer: initialCustomerFilter.value, startDate: null, endDate: null, status: null, invoiceNumber: null }
             : { startDate: today, endDate: today, customer: null, status: null, invoiceNumber: null };
        setFilters(defaultFilters);
        setCurrentPage(1);
        // fetchInvoices will be triggered by the useEffect watching 'filters'
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    // --- JSX ---
    return (
        <div className={styles.container}>
             <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1>Módulo Fiscal</h1>
                    <p className={styles.subtitle}>Consulta de Notas Fiscais Emitidas</p>
                </div>
                {initialCustomerFilter && (
                    <button onClick={handleGoBack} className={`btn secondary ${styles.backButton}`}>
                        <i className="fas fa-arrow-left"></i> Voltar ao Painel
                    </button>
                )}
            </header>

            <FiscalFiltersComponent
                initialFilters={filters}
                onSearch={handleSearch}
                onClear={handleClearFilters}
                isLoading={isLoading}
                disableCustomerFilter={!!initialCustomerFilter}
            />

            <FiscalKPIsComponent kpis={kpis} isLoading={isLoading && !invoices.length} />

             {/* Error Display Area */}
             {error && !isLoading && (
                <div className={styles.errorState} style={{minHeight: '50px', padding: '10px', marginBottom: '14px'}}>
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>{error}</p>
                </div>
            )}

            {/* AG Grid Table Wrapper */}
            <div className={`ag-theme-quartz ${styles.gridWrapper}`} style={{ flexGrow: 1, width: '100%' }}>
                <AgGridTable<Invoice>
                    gridId="fiscalInvoicesTable"
                    rowData={invoices}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    gridOptions={gridOptions}
                    isLoading={isLoading}
                    onGridReadyCallback={(api) => {
                        gridApiRef.current = api;
                        // KPIs will be updated by onFirstDataRendered
                    }}
                    pagination={true}
                    paginationPageSize={PAGE_SIZE}
                    onFilterChanged={() => updateKpisFromGrid()}
                    onSortChanged={() => updateKpisFromGrid()}
                    onFirstDataRendered={() => updateKpisFromGrid()}
                    onPaginationChanged={(event) => {
                        updateKpisFromGrid();
                        if (gridOptions.onPaginationChanged) {
                            gridOptions.onPaginationChanged(event);
                        }
                    }}
                    // Let AG Grid handle pagination UI based on fetched data
                    // paginationTotalRows={totalItems} // Total rows from backend (Optional: useful if backend provides it)
                    // AG Grid will calculate total pages based on totalRows / pageSize
                />
            </div>
        </div>
    );
};

export default FiscalPage;
