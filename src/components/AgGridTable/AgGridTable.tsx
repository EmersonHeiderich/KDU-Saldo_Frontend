// src/components/AgGridTable/AgGridTable.tsx

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    ColDef,
    GridApi,
    GridReadyEvent,
    PaginationChangedEvent,
    FilterChangedEvent,
    SortChangedEvent,
    CsvExportParams,
    GridOptions,
    FirstDataRenderedEvent,
    ColumnMovedEvent,
    ColumnVisibleEvent,
    ColumnResizedEvent,
    ColumnState,
    Column,
    DragStoppedEvent, // <-- Import DragStoppedEvent
} from 'ag-grid-community';
import { debounce } from 'lodash'; // <-- Import debounce
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import styles from './AgGridTable.module.css';

// --- Helper Functions for localStorage Key ---
const getGridStateKey = (gridId: string): string => `agGridState_${gridId}`;
const SAVE_DEBOUNCE_MS = 500; // Debounce time in milliseconds

// Interface for the complete grid state
interface GridState {
    columnState: ColumnState[];
    filterModel: any;
    sortModel: any;
}

interface AgGridTableProps<TData> {
    gridId: string;
    rowData: TData[] | null | undefined;
    columnDefs: ColDef<TData>[];
    domLayout?: 'normal' | 'autoHeight' | 'print';
    rowHeight?: number;
    headerHeight?: number;
    pagination?: boolean;
    paginationPageSize?: number;
    paginationPageSizeSelector?: number[] | boolean;
    suppressPaginationPanel?: boolean;
    defaultColDef?: ColDef;
    gridOptions?: GridOptions<TData>;
    isLoading?: boolean;
    onGridReadyCallback?: (params: GridApi<TData>) => void;
    onFilterChanged?: (event: FilterChangedEvent<TData>) => void;
    onSortChanged?: (event: SortChangedEvent<TData>) => void;
    onPaginationChanged?: (event: PaginationChangedEvent<TData>) => void;
    onFirstDataRendered?: (event: FirstDataRenderedEvent<TData>) => void;
    quickFilterText?: string;
}

const AgGridTable = <TData extends {} = any>({
    gridId,
    rowData,
    columnDefs,
    domLayout = 'autoHeight',
    rowHeight = 40,
    headerHeight = 45,
    pagination = true,
    paginationPageSize = 50,
    paginationPageSizeSelector = [25, 50, 100, 200],
    suppressPaginationPanel = false,
    defaultColDef: userDefaultColDef,
    gridOptions: userGridOptions,
    isLoading = false,
    onGridReadyCallback,
    onFilterChanged,
    onSortChanged,
    onPaginationChanged,
    onFirstDataRendered,
    quickFilterText,
}: AgGridTableProps<TData>) => {
    const gridRef = useRef<AgGridReact<TData>>(null);
    const [gridApi, setGridApi] = useState<GridApi<TData> | null>(null);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
    const [menuColumns, setMenuColumns] = useState<Column[]>([]);

    // --- Column State Persistence (Save/Load/Reset) com StateManager ---
    
    // Usar a API direta do AG Grid para gerenciar o estado
    const saveState = useCallback(() => {
        if (gridApi && gridId) {
            try {
                // Capturar o estado completo da grid diretamente
                const columnState = gridApi.getColumnState();
                // Para obter o modelo de ordenação, precisamos filtrar as colunas que têm sort definido
                const sortModel = columnState.filter(col => col.sort !== null && col.sort !== undefined);
                
                const state = {
                    columnState: columnState,
                    filterModel: gridApi.getFilterModel(),
                    sortModel: sortModel
                };
                
                // Serializar e salvar no localStorage de forma direta
                const json = JSON.stringify(state);
                localStorage.setItem(getGridStateKey(gridId), json);
                
                console.log(`ESTADO SALVO: ${gridId}`, state);
                return true;
            } catch (err) {
                console.error('Erro ao salvar estado:', err);
                return false;
            }
        }
        return false;
    }, [gridApi, gridId]);
    
    // Carregar estado diretamente com mais logs detalhados
    const loadState = useCallback(() => {
        if (!gridApi || !gridId) {
            console.warn(`Não foi possível carregar o estado - gridApi ou gridId ausente: ${gridId}`);
            return false;
        }
        
        try {
            // Verificar se existe um estado salvo
            const key = getGridStateKey(gridId);
            const savedStateString = localStorage.getItem(key);
            
            if (!savedStateString) {
                console.log(`Nenhum estado encontrado para ${gridId} com chave ${key}`);
                return false;
            }
            
            console.log(`Estado encontrado para ${gridId}, tamanho: ${savedStateString.length} caracteres`);
            
            // Analisar e validar o estado
            const state = JSON.parse(savedStateString);
            console.log(`Estado ANALISADO para ${gridId}:`, state);
            
            // Verificar se o estado contém dados válidos
            if (!state || !state.columnState || !Array.isArray(state.columnState)) {
                console.warn(`Estado inválido para ${gridId} - sem columnState válido`);
                return false;
            }
            
            // Processar o estado das colunas
            console.log(`Aplicando estado para ${gridId} com ${state.columnState.length} colunas`);
            
            // Primeiro, aplicar a ordenação das colunas e visibilidade
            const result = gridApi.applyColumnState({
                state: state.columnState,
                applyOrder: true  // Isto é crucial para manter a ordem das colunas
            });
            
            console.log(`Resultado de applyColumnState: ${result ? 'Sucesso' : 'Falha'}`);
            
            // Em seguida, aplicar os filtros
            if (state.filterModel && typeof state.filterModel === 'object') {
                console.log(`Aplicando filtros para ${gridId}`);
                gridApi.setFilterModel(state.filterModel);
            }
            
            // Log de confirmação
            console.log(`✅ Estado carregado com sucesso para ${gridId}`);
            return true;
        } catch (err) {
            console.error(`❌ Erro ao carregar estado para ${gridId}:`, err);
            return false;
        }
    }, [gridApi, gridId]);
    
    // Função debounced para salvar o estado - usando debounce diretamente
    const debouncedSaveState = useMemo(() => debounce(() => {
        saveState();
    }, SAVE_DEBOUNCE_MS), [saveState]);
    
    // Função para acionar o save com debounce
    const triggerSaveState = useCallback(() => {
        debouncedSaveState();
    }, [debouncedSaveState]);

    const resetGridState = useCallback(() => {
        if (gridApi && gridId) {
            localStorage.removeItem(getGridStateKey(gridId));
            
            // Reset usando as definições de coluna originais
            gridApi.setGridOption('columnDefs', columnDefs);
            
            // Limpar filtros
            gridApi.setFilterModel(null);
            
            // Limpar ordenação usando applyColumnState
            gridApi.applyColumnState({
                state: columnDefs.map(col => ({
                    colId: typeof col.field === 'string' ? col.field : '',
                    sort: null
                })),
                defaultState: { sort: null }
            });
            
            setIsColumnMenuOpen(false);
            console.log(`Grid state reset for ${gridId}`);
            alert("Configuração das colunas redefinida para o padrão.");
            
            // Atualizar células
            setTimeout(() => gridApi.refreshCells({ force: true }), 50);
        }
    }, [gridApi, gridId, columnDefs]);

    // --- Update Menu Columns ---
    const updateMenuColumns = useCallback(() => {
        if (gridApi) {
            const allColumns = gridApi.getAllGridColumns();
            if (allColumns) {
                setMenuColumns(allColumns);
            }
        }
    }, [gridApi]);

    // --- AG Grid Options and Callbacks ---
    const defaultColDef = useMemo<ColDef>(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        floatingFilter: true,
        suppressHeaderMenuButton: false, // Substituído de suppressMenu que está depreciado
        ...userDefaultColDef,
    }), [userDefaultColDef]);

    const internalGridOptions = useMemo<GridOptions<TData>>(() => ({
        overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Carregando...</span>',
        overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">Nenhum dado encontrado</span>',
        suppressColumnVirtualisation: true,
        maintainColumnOrder: true,       // Manter a ordem das colunas
        enableCellTextSelection: true,   // Permitir seleção de texto nas células
        // Juntar com as opções do usuário
        ...(userGridOptions ?? {}),
    }), [userGridOptions]);

    const onGridReady = useCallback((params: GridReadyEvent<TData>) => {
        console.log(`=== AG Grid ${gridId} Ready - API disponível ===`);
        setGridApi(params.api); // Configura gridApi no estado
        
        // Primeiro, listar os estados salvos no localStorage
        const savedKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('agGridState_')) {
                savedKeys.push(key);
            }
        }
        console.log(`Estados salvos no localStorage:`, savedKeys);
        
        // Chamar callback externo para que dados possam ser carregados
        // ou qualquer outra inicialização necessária
        if (onGridReadyCallback) {
            onGridReadyCallback(params.api);
        }
        
        // Atualizar a referência das colunas para o menu
        updateMenuColumns();
        
        // NÃO carregamos o estado neste momento, porque os dados da grid 
        // podem ainda não ter sido carregados completamente.
        // O carregamento do estado será feito no onFirstDataRendered
    }, [gridId, onGridReadyCallback, updateMenuColumns]);
    
    // Função que tenta carregar o estado e, se não existir, salva o estado inicial
    const handleStateAfterDataLoaded = useCallback(() => {
        if (!gridApi) return;
        
        try {
            console.log(`Tentando carregar estado para ${gridId} APÓS o carregamento dos dados`);
            
            // Agora sim tentamos carregar o estado após os dados estarem prontos
            const stateLoaded = loadState();
            console.log(`Estado carregado para grid ${gridId}: ${stateLoaded ? 'Sim' : 'Não'}`);
            
            // Se não houver estado salvo, vamos salvar o estado inicial agora
            if (!stateLoaded) {
                console.log(`Nenhum estado encontrado. Salvando estado inicial para ${gridId}`);
                setTimeout(() => {
                    saveState();
                    console.log(`Estado inicial salvo para ${gridId}`);
                }, 300);
            }
        } catch (error) {
            console.error(`Erro ao gerenciar estado da grid ${gridId}:`, error);
        }
    }, [gridApi, gridId, loadState, saveState]);

    // Update menu columns if column definitions change
    useEffect(() => {
        if(gridApi) { // Only update if grid is ready
            updateMenuColumns();
        }
    }, [columnDefs, gridApi, updateMenuColumns]); // Re-check if columnDefs prop changes


    // --- Quick Filter & Loading Overlay (No changes needed) ---
    useEffect(() => {
        if (gridApi && quickFilterText !== undefined) {
            gridApi.setQuickFilter(quickFilterText);
        }
    }, [gridApi, quickFilterText]);

    useEffect(() => {
        if (gridApi) {
            if (isLoading) gridApi.showLoadingOverlay();
            else gridApi.hideOverlay();
            if (!isLoading && (!rowData || rowData.length === 0)) {
                gridApi.showNoRowsOverlay();
            }
        }
    }, [gridApi, isLoading, rowData]);


    // --- Event Handlers for State Saving (Trigger Debounced Save) ---

    // Column visibility change triggers save immediately and updates menu
    const handleColumnVisible = useCallback(() => {
        console.log("Column Visible Changed", gridId);
        triggerSaveState(); // Debounced save
        updateMenuColumns();
    }, [gridId, triggerSaveState, updateMenuColumns]);

    // Column move/resize triggers save only when dragging stops
    const handleDragStopped = useCallback(() => {
        console.log("Column Drag Stopped (Move/Resize)", gridId);
        triggerSaveState(); // Debounced save
        updateMenuColumns(); // Update menu order if needed
    }, [gridId, triggerSaveState, updateMenuColumns]);


    // --- Event Handlers para mudanças de filtro e ordenação ---
    const handleFilterChanged = useCallback((event: FilterChangedEvent<TData>) => {
        console.log("Filter Changed", gridId);
        // Salvar estado quando o usuário altera filtros
        triggerSaveState();
        
        // Chamar o callback externo se existir
        if (onFilterChanged) onFilterChanged(event);
    }, [onFilterChanged, triggerSaveState, gridId]);

    const handleSortChanged = useCallback((event: SortChangedEvent<TData>) => {
        console.log("Sort Changed", gridId);
        // Salvar estado quando o usuário altera ordenação
        triggerSaveState();
        
        // Chamar o callback externo se existir
        if (onSortChanged) onSortChanged(event);
    }, [onSortChanged, triggerSaveState, gridId]);

    const handlePaginationChanged = useCallback((event: PaginationChangedEvent<TData>) => {
        if (onPaginationChanged) onPaginationChanged(event);
    }, [onPaginationChanged]);

    const handleFirstDataRendered = useCallback((event: FirstDataRenderedEvent<TData>) => {
        console.log(`AG Grid First Data Rendered - ${gridId}`);
        
        // O elemento crítico! Agora que os dados estão carregados, podemos 
        // tentar carregar o estado salvo previamente
        setTimeout(() => {
            // Tenta carregar o estado ou salva o estado inicial se não existir
            handleStateAfterDataLoaded();
        }, 200);
        
        // Chamar callback externo se existir
        if (onFirstDataRendered) onFirstDataRendered(event);
    }, [onFirstDataRendered, gridId, handleStateAfterDataLoaded]);
    
    // Salvar o estado quando o componente for desmontado
    useEffect(() => {
        return () => {
            // Salvar o estado final antes de desmontar
            if (gridApi) {
                console.log(`Salvando estado final para ${gridId} antes de desmontar`);
                // Use o método direto sem debounce para garantir que seja salvo
                debouncedSaveState.flush();
            }
        };
    }, [gridApi, gridId, debouncedSaveState]);


    // --- Custom Column Menu Logic ---
    const toggleColumnMenu = useCallback(() => {
        setIsColumnMenuOpen(prev => !prev);
        if (!isColumnMenuOpen) { // If opening, ensure columns are up-to-date
            updateMenuColumns();
        }
    }, [isColumnMenuOpen, updateMenuColumns]);

    const handleVisibilityChange = useCallback((colId: string, visible: boolean) => {
        if (gridApi) {
            // Usando o método recomendado em vez de setColumnVisible que está depreciado
            gridApi.setColumnsVisible([colId], visible);
            // State saving is now handled by the handleColumnVisible grid event handler
        }
    }, [gridApi]);

    // Close menu on outside click / ESC (No changes needed)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
                const gearButton = document.getElementById(`gear-btn-${gridId}`);
                if (!gearButton || !gearButton.contains(event.target as Node)) {
                    setIsColumnMenuOpen(false);
                }
            }
        };
        if (isColumnMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isColumnMenuOpen, gridId]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsColumnMenuOpen(false);
        };
        if (isColumnMenuOpen) {
            document.addEventListener('keydown', handleEsc);
        }
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isColumnMenuOpen]);


    // --- Render Custom Column Menu (No significant changes needed) ---
    const renderColumnMenu = () => {
        if (!isColumnMenuOpen || !gridApi) return null;

        const currentColumnState = gridApi.getColumnState();
        const visibilityMap = new Map(currentColumnState.map(s => [s.colId, !s.hide]));
        const displayableColumns = menuColumns.filter(col => col.getColDef().headerName);

        return (
            <div ref={columnMenuRef} className={styles.columnMenuDropdown}>
                <div className={styles.columnMenuList}>
                    {displayableColumns.length === 0 && <li>Carregando colunas...</li>}
                    {displayableColumns.map((col) => {
                        const colDef = col.getColDef();
                        const colId = col.getColId();
                        const headerName = colDef.headerName || colId;
                        const isVisible = visibilityMap.get(colId) ?? false;
                        const canHide = colId !== 'actions'; // Example: prevent hiding actions

                        return (
                            <li key={colId}>
                                <label title={canHide ? `Mostrar/Ocultar ${headerName}` : 'Coluna de ações não pode ser ocultada'}>
                                    <input
                                        type="checkbox"
                                        checked={isVisible}
                                        onChange={(e) => handleVisibilityChange(colId, e.target.checked)}
                                        disabled={!canHide}
                                    />
                                    <span>{headerName}</span>
                                </label>
                            </li>
                        );
                    })}
                </div>
                <div className={styles.columnMenuFooter}>
                    <button
                        onClick={resetGridState}
                        className="btn secondary small"
                        title="Redefinir ordem, visibilidade e largura das colunas para o padrão original."
                    >
                        <i className="fas fa-undo"></i> Redefinir Visão
                    </button>
                </div>
            </div>
        );
    };

    // --- JSX Output ---
    return (
        <>
            {/* Container for Gear Button */}
            <div className={styles.gridActionsContainer}>
                {gridApi && ( // Only show gear if grid is ready
                    <div className={styles.gearButtonContainer}>
                         <button
                            id={`gear-btn-${gridId}`}
                            onClick={toggleColumnMenu}
                            className={`btn secondary small icon-only ${styles.gearButton}`}
                            title="Configurar Colunas Visíveis"
                            aria-haspopup="true"
                            aria-expanded={isColumnMenuOpen}
                        >
                            <i className="fas fa-cog"></i>
                        </button>
                        {renderColumnMenu()}
                    </div>
                )}
            </div>

            {/* Grid Container */}
            <div
                className={`ag-theme-quartz ${styles.agGridContainer} ag-grid-${gridId}`}
                style={domLayout === 'autoHeight' ? { width: '100%' } : { height: '600px', width: '100%' }}
            >
                <AgGridReact<TData>
                    ref={gridRef}
                    gridId={gridId}
                    rowData={rowData ?? []}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    gridOptions={internalGridOptions}
                    domLayout={domLayout}
                    rowHeight={rowHeight}
                    headerHeight={headerHeight}
                    pagination={pagination}
                    paginationPageSize={paginationPageSize}
                    paginationPageSizeSelector={paginationPageSizeSelector}
                    suppressPaginationPanel={suppressPaginationPanel}
                    // Event Handlers
                    onGridReady={onGridReady}
                    onFilterChanged={handleFilterChanged}
                    onSortChanged={handleSortChanged}
                    onPaginationChanged={handlePaginationChanged}
                    onFirstDataRendered={handleFirstDataRendered}
                    // State Persistence Triggers - Importante: TODOS esses eventos precisam ser conectados
                    onColumnVisible={handleColumnVisible}
                    onColumnMoved={(event) => {
                        console.log("Column Moved", gridId);
                        triggerSaveState();
                    }}
                    onColumnResized={(event) => {
                        console.log("Column Resized", gridId);
                        triggerSaveState();
                    }}
                    onColumnPinned={(event) => {
                        console.log("Column Pinned", gridId);
                        triggerSaveState();
                    }}
                    onDragStopped={handleDragStopped}
                />
            </div>
        </>
    );
};

export default AgGridTable;
