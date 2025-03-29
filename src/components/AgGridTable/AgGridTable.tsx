// src/components/AgGridTable/AgGridTable.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
    ColDef,
    GridApi,
    GridReadyEvent,
    // ColumnApi, // Usually GridApi is sufficient
    PaginationChangedEvent,
    FilterChangedEvent,
    SortChangedEvent,
    CsvExportParams,
    GridOptions,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css'; // Core grid CSS
import 'ag-grid-community/styles/ag-theme-quartz.css'; // Theme CSS
import styles from './AgGridTable.module.css';

interface AgGridTableProps<TData> {
    rowData: TData[] | null | undefined; // Data for the grid
    columnDefs: ColDef<TData>[]; // Column definitions
    domLayout?: 'normal' | 'autoHeight' | 'print'; // How the grid handles height
    rowHeight?: number; // Set row height
    headerHeight?: number; // Set header height
    pagination?: boolean; // Enable pagination?
    paginationPageSize?: number; // Items per page
    paginationPageSizeSelector?: number[] | boolean; // Page size selector options
    suppressPaginationPanel?: boolean; // Hide default pagination panel
    defaultColDef?: ColDef; // Default column properties
    isLoading?: boolean; // Show loading overlay?
    onGridReadyCallback?: (api: GridApi<TData>) => void; // Callback when grid API is ready
    onFilterChanged?: (api: GridApi<TData>) => void; // Callback on filter change
    onSortChanged?: (api: GridApi<TData>) => void; // Callback on sort change
    onPaginationChanged?: (event: PaginationChangedEvent<TData>) => void; // Callback on pagination change
    quickFilterText?: string; // Text for quick filtering
    // Add more AG Grid options as props if needed
}

const AgGridTable = <TData extends {} = any>({ // Default generic type if not provided
    rowData,
    columnDefs,
    domLayout = 'autoHeight',
    rowHeight = 40,
    headerHeight = 45,
    pagination = true,
    paginationPageSize = 50,
    paginationPageSizeSelector = [25, 50, 100, 200],
    suppressPaginationPanel = false, // Allow custom pagination controls
    defaultColDef,
    isLoading = false,
    onGridReadyCallback,
    onFilterChanged,
    onSortChanged,
    onPaginationChanged,
    quickFilterText,
}: AgGridTableProps<TData>) => {
    const gridRef = useRef<AgGridReact<TData>>(null);
    const [gridApi, setGridApi] = useState<GridApi<TData> | null>(null);
    // const [columnApi, setColumnApi] = useState<ColumnApi | null>(null);

    // Callback when grid is ready
    const onGridReady = useCallback((params: GridReadyEvent<TData>) => {
        console.log("AG Grid Ready");
        setGridApi(params.api);
        // setColumnApi(params.columnApi);
        if (onGridReadyCallback) {
            onGridReadyCallback(params.api);
        }
        // Auto-size columns on ready (optional)
        // params.api.sizeColumnsToFit();
    }, [onGridReadyCallback]);

    // Apply quick filter when text changes
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
            }
        }
    }, [gridApi, isLoading]);

    // Show 'No Rows' overlay when data is empty and not loading
    useEffect(() => {
        if (gridApi && !isLoading) {
            if (!rowData || rowData.length === 0) {
                gridApi.showNoRowsOverlay();
            } else {
                 gridApi.hideOverlay(); // Ensure 'no rows' is hidden when data arrives
            }
        }
    }, [gridApi, rowData, isLoading]);

    // Handlers for grid events, calling parent callbacks
    const handleFilterChanged = useCallback((event: FilterChangedEvent<TData>) => {
        if (onFilterChanged) {
            onFilterChanged(event.api);
        }
    }, [onFilterChanged]);

    const handleSortChanged = useCallback((event: SortChangedEvent<TData>) => {
        if (onSortChanged) {
            onSortChanged(event.api);
        }
    }, [onSortChanged]);

    const handlePaginationChanged = useCallback((event: PaginationChangedEvent<TData>) => {
        if (onPaginationChanged) {
            onPaginationChanged(event);
        }
    }, [onPaginationChanged]);

    // Grid options object (optional, can pass props directly too)
    // Useful for combining many settings
    const gridOptions: GridOptions<TData> = {
        overlayLoadingTemplate:
            '<span class="ag-overlay-loading-center">Carregando...</span>',
        overlayNoRowsTemplate:
            '<span class="ag-overlay-no-rows-center">Nenhum dado encontrado</span>',
        // Add other grid options here if needed
    };


    return (
        // Set theme and container height
        <div
            className={`ag-theme-quartz ${styles.agGridContainer}`}
             // Use autoHeight or set explicit height
             style={domLayout === 'autoHeight' ? { width: '100%' } : { height: '500px', width: '100%' }}
        >
            <AgGridReact<TData>
                ref={gridRef}
                rowData={rowData ?? []} // Provide empty array if null/undefined
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                domLayout={domLayout} // 'autoHeight' adjusts height to fit rows
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
                // enableCellTextSelection={true} // Allow text selection
                // animateRows={true} // Optional row animation
                gridOptions={gridOptions} // Pass grid options
            />
        </div>
    );
};

export default AgGridTable;