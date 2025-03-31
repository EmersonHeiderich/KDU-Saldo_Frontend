// src/pages/Fabrics/Fabrics.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// Use frontend Fabric interface and service functions
import * as fabricService from '../../services/fabricService';
import { Fabric } from '../../services/fabricService'; // Import frontend type only
import HelpModal from './components/HelpModal';
// Import AG Grid component and types
import AgGridTable from '../../components/AgGridTable/AgGridTable';
import {
    ColDef,
    GridApi,
    ValueFormatterParams,
    CsvExportParams,
    GridOptions,
    FilterChangedEvent,
    SortChangedEvent,
    GridReadyEvent,
    FirstDataRenderedEvent
} from 'ag-grid-community';
// Import CSS
import styles from './Fabrics.module.css';
import '../../components/BaseModal/BaseModal.css'; // BaseModal styles

const Fabrics: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const gridApiRef = useRef<GridApi<Fabric> | null>(null); // Ref to store Grid API

    // State for data
    const [allFabrics, setAllFabrics] = useState<Fabric[]>([]); // Holds all fetched data

    // State for UI control
    const [loading, setLoading] = useState(false); // Combined loading state
    const [error, setError] = useState<string | null>(null);
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false); // Track if initial load completed

    // State for totalizers (calculated from AG Grid data)
    const [totalItems, setTotalItems] = useState<number>(0);
    const [totalSaldo, setTotalSaldo] = useState<number>(0);
    const [totalValor, setTotalValor] = useState<number>(0);

    // --- Effects ---

    // Permission Check
    useEffect(() => {
        if (user && !user.permissions.is_admin && !user.permissions.can_access_fabrics) {
            navigate('/');
        }
    }, [user, navigate]);

    // --- Data Fetching ---
    const handleFabricSearch = useCallback(async (force = false) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fabricService.getFabricData(null, force); // Fetch all data
            setAllFabrics(data);
            setInitialLoadDone(true);
        } catch (error: any) {
            console.error('Falha na busca de tecidos:', error);
            setError(error.message || 'Ocorreu um erro ao consultar os tecidos.');
            setAllFabrics([]); // Ensure empty on error
            setInitialLoadDone(true); // Mark load as done even on error
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array, this function is stable

    // Automatic initial load on mount
    useEffect(() => {
        handleFabricSearch();
    }, [handleFabricSearch]);


    // --- AG Grid Configuration ---

    const currencyFormatter = (params: ValueFormatterParams<Fabric, number | null>) => {
        return fabricService.formatCurrency(params.value);
    };

    const numberFormatter = (params: ValueFormatterParams<Fabric, number | null>) => {
        return fabricService.formatNumber(params.value);
    };

    // Define renderers for consistent formatting (handles null/undefined)
    const numericCellRenderer = (params: { value: number | null | undefined }) => { 
        if (params.value === null || params.value === undefined) return '-';
        return params.value.toLocaleString('pt-BR');
    };
    
    const decimal2CellRenderer = (params: { value: number | null | undefined }) => {
        if (params.value === null || params.value === undefined) return '-';
        return params.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    
    const decimal1CellRenderer = (params: { value: number | null | undefined }) => {
        if (params.value === null || params.value === undefined) return '-';
        return params.value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    };


    // Definições de estilo de célula como funções
    const rightAlignedCell = () => ({ textAlign: 'right' as const });
    const centerAlignedCell = () => ({ textAlign: 'center' as const });
    const boldRightAlignedCell = () => ({ textAlign: 'right' as const, fontWeight: '600' as const });

    // Column Definitions for AG Grid
    const columnDefs = useMemo<ColDef<Fabric>[]>(() => [
        {
            headerName: 'Código',
            field: 'codigo',
            filter: 'agNumberColumnFilter',
            width: 110,
            maxWidth: 110,
            type: 'numericColumn',
            cellStyle: rightAlignedCell,
        },
        {
            headerName: 'Descrição',
            field: 'descricao',
            filter: 'agTextColumnFilter',
            flex: 3,
            minWidth: 300,
            suppressSizeToFit: false,
            wrapText: false,
            autoHeight: false,
        },
        {
            headerName: 'R$ Custo',
            field: 'custo',
            filter: 'agNumberColumnFilter',
            valueFormatter: currencyFormatter,
            width: 110,
            maxWidth: 110,
            type: 'numericColumn',
            cellStyle: rightAlignedCell,
        },
        {
            headerName: 'Saldo',
            field: 'saldo',
            filter: 'agNumberColumnFilter',
            valueFormatter: numberFormatter,
            width: 110,
            maxWidth: 110,
            type: 'numericColumn',
            cellStyle: boldRightAlignedCell,
            cellClassRules: {
                'cell-saldo-danger': params => params.value !== null && params.value <= 0,
                'cell-saldo-warning': params => params.value !== null && params.value > 0 && params.value < 10,
            },
        },
        {
            headerName: 'Larg. (m)',
            field: 'largura',
            filter: 'agNumberColumnFilter',
            cellRenderer: decimal2CellRenderer,
            width: 100,
            maxWidth: 100,
            type: 'numericColumn',
            cellStyle: centerAlignedCell,
        },
        {
            headerName: 'Gram. (g/m²)',
            field: 'gramatura',
            filter: 'agNumberColumnFilter',
            cellRenderer: numericCellRenderer,
            width: 110,
            maxWidth: 110,
            type: 'numericColumn',
            cellStyle: centerAlignedCell,
        },
        {
            headerName: 'Enc. (%)',
            field: 'encolhimento',
            filter: 'agNumberColumnFilter',
            cellRenderer: decimal1CellRenderer,
            width: 100,
            maxWidth: 100,
            type: 'numericColumn',
            cellStyle: centerAlignedCell,
        },
    ], []);

    // Default Column Definition com melhorias de layout
    const defaultColDef = useMemo<ColDef>(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        floatingFilter: true,
        suppressMovable: false, // Impede ou não que as colunas sejam reorganizadas por drag-and-drop
        suppressSizeToFit: false, // Permite que as colunas se ajustem automaticamente
        suppressMenu: true, // Mantém o menu de coluna
        minWidth: 80, // Largura mínima para qualquer coluna
        suppressAutoSize: false, // Permite auto-dimensionamento quando necessário
        autoHeight: false, // Evita auto-altura desnecessária
        wrapText: false, // Evita quebra de texto para garantir layout melhor
    }), []);

    // Grid Options including initial sort state
    const gridOptions = useMemo<GridOptions<Fabric>>(() => ({
        initialState: {
            sort: {
                sortModel: [{ colId: 'saldo', sort: 'desc' }],
            },
        },
        overlayLoadingTemplate:
            '<span class="ag-overlay-loading-center">Carregando tecidos...</span>',
        overlayNoRowsTemplate:
            '<span class="ag-overlay-no-rows-center">Nenhum tecido encontrado para os filtros aplicados.</span>',
    }), []);


    // --- Event Handlers ---

    // Function to calculate totals from visible grid data
    const updateTotals = useCallback((api: GridApi<Fabric> | null) => {
        if (!api) {
            console.warn("updateTotals called with null API. Resetting totals.");
            setTotalItems(0); setTotalSaldo(0); setTotalValor(0);
            return;
        }
        let items = 0;
        let saldo = 0;
        let valor = 0;
        api.forEachNodeAfterFilterAndSort(node => {
            if (node.data) {
                items++;
                const nodeSaldo = Number(node.data.saldo) || 0;
                const nodeCusto = Number(node.data.custo ?? 0);
                saldo += nodeSaldo;
                valor += nodeSaldo * nodeCusto;
            }
        });
        console.log(`Totals Updated: Items=${items}, Saldo=${saldo}, Valor=${valor}`);
        setTotalItems(items);
        setTotalSaldo(saldo);
        setTotalValor(valor);
    }, []);


    // Callback function when Grid API is ready
    const onGridReady = useCallback((api: GridApi<Fabric>) => {
        console.log("Fabrics Grid Ready - API Assigned");
        gridApiRef.current = api;
    }, []);

    // Handle First Data Rendered
    const handleFirstDataRendered = useCallback((event: FirstDataRenderedEvent<Fabric>) => {
        console.log("Fabrics Grid First Data Rendered - Calculating initial totals");
        updateTotals(event.api);
        // Optional: Auto-size columns after first data is rendered and sorted
        // event.api.sizeColumnsToFit(); // Be careful with this if you have many columns or flexible ones
    }, [updateTotals]);


    // Call updateTotals whenever filter or sort changes
    const handleGridFilterOrSortChanged = useCallback((event: FilterChangedEvent<Fabric> | SortChangedEvent<Fabric>) => {
        console.log("Fabrics Grid Filter or Sort Changed");
        updateTotals(event.api);
    }, [updateTotals]);


    // Handler for AG Grid's CSV Export
    const handleExport = useCallback(() => {
        if (gridApiRef.current) {
            const params: CsvExportParams = {
                fileName: `tecidos_saldo_${new Date().toISOString().split('T')[0]}.csv`,
                columnSeparator: ';',
                processCellCallback: (params) => {
                    // Format values for CSV export
                    if (params.column.getColId() === 'custo' && params.value !== null && params.value !== undefined) {
                        return params.value.toString().replace('.', ',');
                    }
                    if (params.column.getColId() === 'saldo' && params.value !== null && params.value !== undefined) {
                        return params.value.toString().replace('.', ',');
                    }
                    if (params.column.getColId() === 'largura' && params.value !== null && params.value !== undefined) {
                        return params.value.toString().replace('.', ',');
                    }
                    if (params.column.getColId() === 'gramatura' && params.value !== null && params.value !== undefined) {
                        return params.value.toString().replace('.', ',');
                    }
                    if (params.column.getColId() === 'encolhimento' && params.value !== null && params.value !== undefined) {
                        return params.value.toString().replace('.', ',');
                    }
                    // Return value as string or empty string if null/undefined
                    return params.value !== null && params.value !== undefined ? params.value.toString() : '';
                }
            };
            gridApiRef.current.exportDataAsCsv(params);
        } else {
            alert('A grade não está pronta para exportar.');
            console.warn("Export button clicked but grid API not available.");
        }
    }, []);

    const handleForceRefresh = useCallback(async () => {
        setError(null);
        try {
            await fabricService.forceClearFabricCache();
            await handleFabricSearch(true); // Fetch with force=true
        } catch (error: any) {
            console.error("Erro ao forçar atualização:", error);
            setError(error.message || "Erro ao forçar atualização do cache.");
        }
    }, [handleFabricSearch]);


    // --- Render Functions ---

    const renderControlsAndTotalizers = () => {
        const valorFormatado = fabricService.formatCurrency(totalValor);
        const saldoFormatado = fabricService.formatNumber(totalSaldo);
        const itemsFormatado = fabricService.formatNumber(totalItems);

        return (
            <div className={styles.controlsAndTotalsContainer}>
                {/* Action Buttons */}
                <div className={styles.actionButtons}>
                    {/* ... Buttons remain the same ... */}
                    <button className="btn primary" onClick={() => handleFabricSearch(false)} disabled={loading} title="Buscar dados atualizados do servidor">
                        {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>} Atualizar
                    </button>
                    <button className="btn secondary icon-only" onClick={handleForceRefresh} disabled={loading} title="Limpar Cache e Atualizar Forçado do Servidor">
                        <i className={`fas fa-database ${loading ? 'fa-spin' : ''}`}></i>
                    </button>
                    <button className="btn secondary icon-only" onClick={handleExport} disabled={loading || totalItems === 0} title="Exportar Lista Atual (Filtrada/Ordenada) para CSV">
                        <i className="fas fa-file-csv"></i>
                    </button>
                    <button className="btn info icon-only" onClick={() => setHelpModalOpen(true)} title="Ajuda" disabled={loading}>
                        <i className="fas fa-question-circle"></i>
                    </button>
                </div>

                {/* Totalizers */}
                {initialLoadDone && (
                    <div className={styles.totalizers}>
                       {/* ... Totalizer elements remain the same ... */}
                        <div className={styles.totalizador} title={`Total de ${itemsFormatado} itens listados/filtrados`}>
                            <i className="fas fa-list-ol"></i> <span>{itemsFormatado} itens</span>
                        </div>
                        <div className={styles.totalizador} title="Saldo Total dos Itens Listados/Filtrados">
                            <i className="fas fa-boxes"></i> <span>{saldoFormatado}</span>
                        </div>
                        <div className={styles.totalizador} title="Valor Total em Estoque (Saldo * Custo) dos Itens Listados/Filtrados">
                            <i className="fas fa-dollar-sign"></i> <span>{valorFormatado}</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // --- JSX ---
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Tecidos</h1>
                <p className={styles.subtitle}>Consulta de saldos e custos de matérias-primas</p>
            </header>

            {/* Combined Controls and Totalizers Bar */}
            {renderControlsAndTotalizers()}

            {/* Error Display */}
            {error && !loading && (
                <div className={styles.errorState}>
                   {/* ... Error message remains the same ... */}
                </div>
            )}

            {/* AG Grid Table */}
            {(!error || initialLoadDone) && (
                <div className={styles.gridWrapper}>
                    <AgGridTable<Fabric>
                        gridId="fabricsTable" // <-- PROVIDE UNIQUE ID HERE
                        rowData={allFabrics}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        gridOptions={gridOptions}
                        pagination={true}
                        paginationPageSize={50}
                        paginationPageSizeSelector={[25, 50, 100, 200]}
                        domLayout='autoHeight' // Make sure this matches your desired layout
                        isLoading={loading}
                        onGridReadyCallback={onGridReady}
                        onFilterChanged={handleGridFilterOrSortChanged}
                        onSortChanged={handleGridFilterOrSortChanged}
                        onFirstDataRendered={handleFirstDataRendered}
                    />
                </div>
            )}

            {/* Initial Loading Message */}
            {!initialLoadDone && !loading && !error && (
                <div className={styles.loadingOrInitialState}>
                   {/* ... Initial loading message remains the same ... */}
                </div>
            )}

            {/* Help Modal */}
            <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
        </div>
    );
};

export default Fabrics;
