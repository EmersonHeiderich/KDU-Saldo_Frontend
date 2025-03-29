// src/components/AgGridTable/AgGridTable.tsx

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'; // <-- Added useMemo here
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
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Theme CSS
import styles from './AgGridTable.module.css';

interface AgGridTableProps<TData> {
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
    rowData,
    columnDefs,
    domLayout = 'autoHeight',
    rowHeight = 40,
    headerHeight = 45,
    pagination = true,
    paginationPageSize = 50,
    paginationPageSizeSelector = [25, 50, 100, 200],
    suppressPaginationPanel = false,
    defaultColDef,
    gridOptions,
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

    // Combine default/passed gridOptions with mandatory ones
    const internalGridOptions = useMemo(() => ({ // This line caused the error without the import
        overlayLoadingTemplate: '<span class="ag-overlay-loading-center">Carregando...</span>',
        overlayNoRowsTemplate: '<span class="ag-overlay-no-rows-center">Nenhum dado encontrado</span>',
        ...(gridOptions ?? {}), // Spread the passed gridOptions, ensure it's an object
    }), [gridOptions]);


    const onGridReady = useCallback((params: GridReadyEvent<TData>) => {
        console.log("AG Grid Ready - API available");
        setGridApi(params.api);
        if (onGridReadyCallback) {
            onGridReadyCallback(params.api);
        }
    }, [onGridReadyCallback]);

    // Apply quick filter
    useEffect(() => {
        if (gridApi && quickFilterText !== undefined) {
            gridApi.setQuickFilter(quickFilterText);
        }
    }, [gridApi, quickFilterText]);

    // Show/hide loading overlay
    useEffect(() => {
        if (gridApi) {
            if (isLoading) {
                gridApi.showLoadingOverlay();
            } else {
                gridApi.hideOverlay();
                if (!rowData || rowData.length === 0) {
                    gridApi.showNoRowsOverlay();
                }
            }
        }
    }, [gridApi, isLoading, rowData]);

    // Adiciona evento de redimensionamento da janela para ajustar colunas
    useEffect(() => {
        if (gridApi) {
            const handleResize = () => {
                setTimeout(() => {
                    gridApi.sizeColumnsToFit();
                }, 100);
            };

            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [gridApi]);

    const handleFilterChanged = useCallback((event: FilterChangedEvent<TData>) => {
        if (onFilterChanged) {
            onFilterChanged(event);
        }
    }, [onFilterChanged]);

    const handleSortChanged = useCallback((event: SortChangedEvent<TData>) => {
        if (onSortChanged) {
            onSortChanged(event);
        }
    }, [onSortChanged]);

    const handlePaginationChanged = useCallback((event: PaginationChangedEvent<TData>) => {
        if (onPaginationChanged) {
            onPaginationChanged(event);
        }
    }, [onPaginationChanged]);

    const handleFirstDataRendered = useCallback((event: FirstDataRenderedEvent<TData>) => {
        console.log("AG Grid First Data Rendered");
        
        // Ajusta as colunas para ocupar todo o espaço disponível
        setTimeout(() => {
            event.api.sizeColumnsToFit();
        }, 100);
        
        if (onFirstDataRendered) {
            onFirstDataRendered(event);
        }
    }, [onFirstDataRendered]);

    return (
        <div
            className={`ag-theme-quartz ${styles.agGridContainer}`}
            style={domLayout === 'autoHeight' ? { width: '100%' } : { height: '500px', width: '100%' }}
        >
            <AgGridReact<TData>
                ref={gridRef}
                rowData={rowData ?? []}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                gridOptions={internalGridOptions} // Use combined options
                domLayout={domLayout}
                rowHeight={rowHeight}
                headerHeight={headerHeight}
                pagination={pagination}
                paginationPageSize={paginationPageSize}
                paginationPageSizeSelector={paginationPageSizeSelector}
                suppressPaginationPanel={suppressPaginationPanel}
                onGridReady={onGridReady}
                onFilterChanged={handleFilterChanged}
                onSortChanged={handleSortChanged}
                onPaginationChanged={handlePaginationChanged}
                onFirstDataRendered={handleFirstDataRendered}
            />
        </div>
    );
};

export default AgGridTable;
