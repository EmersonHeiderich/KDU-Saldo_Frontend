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
import { ColDef, GridApi, ValueFormatterParams, CsvExportParams } from 'ag-grid-community';
// Import CSS
import styles from './Fabrics.module.css';
import '../../components/BaseModal/BaseModal.css'; // BaseModal styles

const Fabrics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const filterInputRef = useRef<HTMLInputElement>(null);
  const gridApiRef = useRef<GridApi<Fabric> | null>(null); // Ref to store Grid API

  // State for data
  const [allFabrics, setAllFabrics] = useState<Fabric[]>([]); // Holds all fetched data

  // State for UI control
  const [filterText, setFilterText] = useState(''); // Controls AG Grid's quick filter
  const [loading, setLoading] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // State for totalizers (calculated from AG Grid data)
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalSaldo, setTotalSaldo] = useState<number>(0);
  const [totalValor, setTotalValor] = useState<number>(0);

  // --- Effects ---

  useEffect(() => {
    if (user && !user.permissions.is_admin && !user.permissions.can_access_fabrics) {
      navigate('/');
    }
  }, [user, navigate]);

  // --- Data Fetching ---
  const handleFabricSearch = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    // Reset grid filter text when fetching new data
    // setFilterText(''); // Let user keep filter if they refresh
    try {
      const data = await fabricService.getFabricData(null, force); // Fetch all data initially
      setAllFabrics(data);
      setInitialLoadDone(true);
    } catch (error: any) {
      console.error('Falha na busca de tecidos:', error);
      setError(error.message || 'Ocorreu um erro ao consultar os tecidos.');
      setAllFabrics([]);
    } finally {
      setLoading(false);
      filterInputRef.current?.focus();
    }
  }, []); // No dependencies needed here if it's only called manually


  // --- AG Grid Configuration ---

  const currencyFormatter = (params: ValueFormatterParams<Fabric, number | null>) => {
      return fabricService.formatCurrency(params.value);
  };

  const numberFormatter = (params: ValueFormatterParams<Fabric, number | null>) => {
      return fabricService.formatNumber(params.value);
  };

  const numericCellRenderer = (params: { value: number | null | undefined }) => {
    if (params.value === null || params.value === undefined) return '-';
    return params.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  };

  const decimal2CellRenderer = (params: { value: number | null | undefined }) => {
    if (params.value === null || params.value === undefined) return '-';
    return params.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const decimal1CellRenderer = (params: { value: number | null | undefined }) => {
    if (params.value === null || params.value === undefined) return '-';
    return params.value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  // Column Definitions for AG Grid
  const columnDefs = useMemo<ColDef<Fabric>[]>(() => [
      {
          headerName: 'Código',
          field: 'codigo',
          sortable: true,
          filter: 'agNumberColumnFilter', // Use number filter
          width: 120,
          type: 'numericColumn', // AG Grid built-in type for right alignment
          cellStyle: { textAlign: 'right' }, // Explicit style
      },
      {
          headerName: 'Descrição',
          field: 'descricao',
          sortable: true,
          filter: 'agTextColumnFilter', // Use text filter
          flex: 1, // Allow this column to grow
          minWidth: 250,
          wrapText: true, // Allow text wrapping
          autoHeight: true, // Adjust row height based on content
      },
      {
          headerName: 'R$ Custo',
          field: 'custo',
          sortable: true,
          filter: 'agNumberColumnFilter',
          valueFormatter: currencyFormatter,
          width: 130,
          type: 'numericColumn',
          cellStyle: { textAlign: 'right' },
      },
      {
          headerName: 'Saldo',
          field: 'saldo',
          sortable: true,
          filter: 'agNumberColumnFilter',
          valueFormatter: numberFormatter,
          width: 120,
          type: 'numericColumn',
          cellStyle: { textAlign: 'right', fontWeight: '600' },
          // Apply conditional classes based on saldo value
          cellClassRules: {
              'cell-saldo-danger': params => params.value !== null && params.value < 500, // Red if < 500
              'cell-saldo-warning': params => params.value !== null && params.value >= 500 && params.value < 1500, // Yellow if >= 500 and < 1500
              // No specific class needed for >= 1500 (default styling)
          },
      },
      {
          headerName: 'Larg. (m)',
          field: 'largura',
          sortable: true,
          filter: 'agNumberColumnFilter',
          cellRenderer: decimal2CellRenderer,
          width: 110,
          type: 'numericColumn',
          cellStyle: { textAlign: 'center' },
      },
      {
          headerName: 'Gram. (g/m²)',
          field: 'gramatura',
          sortable: true,
          filter: 'agNumberColumnFilter',
          cellRenderer: numericCellRenderer,
          width: 130,
          type: 'numericColumn',
          cellStyle: { textAlign: 'center' },
      },
      {
          headerName: 'Enc. (%)',
          field: 'encolhimento',
          sortable: true,
          filter: 'agNumberColumnFilter',
          cellRenderer: decimal1CellRenderer,
          width: 110,
          type: 'numericColumn',
          cellStyle: { textAlign: 'center' },
      },
  ], []); // Empty dependency array means this runs once

  // Default Column Definition
  const defaultColDef = useMemo<ColDef>(() => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: true, // Enable floating filters below headers
      // suppressMenu: true, // Optionally hide the column menu
  }), []);


  // --- Event Handlers ---
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
    // AG Grid filtering is now handled by passing filterText to AgGridTable component
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && !clearingCache) {
        // Re-fetch data from server on Enter press
        handleFabricSearch(false);
    }
  };

  const handleForceRefresh = async () => {
    setClearingCache(true);
    setError(null);
    setFilterText(''); // Optionally clear filter on force refresh
    try {
      await fabricService.forceClearFabricCache();
      await handleFabricSearch(true); // Fetch with force=true
    } catch (error: any) {
      console.error("Erro ao forçar atualização:", error);
      setError(error.message || "Erro ao forçar atualização do cache.");
    } finally {
      setClearingCache(false);
    }
  };

  // Callback function when Grid API is ready
  const onGridReady = useCallback((api: GridApi<Fabric>) => {
      gridApiRef.current = api;
      console.log("Fabrics Grid API Assigned", api);
       // Calculate totals initially
       updateTotals(api);
  }, []);

  // Function to calculate totals from visible grid data
  const updateTotals = (api: GridApi<Fabric> | null) => {
      if (!api) return;

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

      setTotalItems(items);
      setTotalSaldo(saldo);
      setTotalValor(valor);
  };

  // Call updateTotals whenever filter or sort changes
  const handleGridFilterOrSortChanged = useCallback((api: GridApi<Fabric>) => {
      updateTotals(api);
  }, []);


  // Handler for AG Grid's CSV Export
  const handleExport = () => {
      if (gridApiRef.current) {
          const params: CsvExportParams = {
              fileName: `tecidos_${new Date().toISOString().split('T')[0]}.csv`,
              columnSeparator: ';',
              // processCellCallback: (params) => { // Optional: customize cell values for export
              //     if (params.column.getColId() === 'custo') {
              //         return fabricService.formatCurrency(params.value).replace('R$', '').trim(); // Example: remove R$
              //     }
              //     return params.value;
              // }
          };
          gridApiRef.current.exportDataAsCsv(params);
      } else {
          alert('Grid não está pronto para exportar.');
      }
  };


  // --- Render Functions ---

  const renderTotalizers = () => {
     // Show totalizers even if loading, but maybe with placeholders?
     // Let's show calculated values based on current grid state
     const valorFormatado = fabricService.formatCurrency(totalValor);
     const saldoFormatado = fabricService.formatNumber(totalSaldo);

    return (
      <div className={styles.totalizadoresContainer}>
        <div className={styles.totalizadores}>
          <div className={styles.totalizador} title={`Total de ${totalItems} itens listados/filtrados`}>
            <i className="fas fa-list-ol"></i>
            <span>{fabricService.formatNumber(totalItems)} itens</span>
          </div>
          <div className={styles.totalizador} title="Saldo Total dos Itens Listados/Filtrados">
            <i className="fas fa-boxes"></i>
            <span>{saldoFormatado}</span>
          </div>
          <div className={styles.totalizador} title="Valor Total em Estoque (Saldo * Custo) dos Itens Listados/Filtrados">
            <i className="fas fa-dollar-sign"></i>
            <span>{valorFormatado}</span>
          </div>
        </div>
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

      {/* Controls Section */}
      <div className={styles.controlsContainer}>
        <div className={styles.controls}>
          <div className={styles.inputGroup}>
            <label htmlFor="filtroTecido">Filtrar Descrição/Código (Grid):</label>
            <input
              type="text"
              id="filtroTecido"
              placeholder="Digite para filtrar na grade..."
              value={filterText}
              onChange={handleFilterChange}
              onKeyDown={handleKeyPress} // Keeps Enter for server fetch
              ref={filterInputRef}
              disabled={loading || clearingCache}
              autoComplete="off"
              aria-label="Filtrar tecidos por descrição ou código na grade"
            />
          </div>
          <button
            className="btn primary"
            onClick={() => handleFabricSearch(false)}
            disabled={loading || clearingCache}
            title="Buscar dados atualizados do servidor (mantém filtro da grade)"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
             {initialLoadDone ? 'Atualizar do Servidor' : 'Consultar Tecidos'}
          </button>
          {/* Force Refresh Button */}
          <button
              className="btn secondary icon-only"
              onClick={handleForceRefresh}
              disabled={loading || clearingCache}
              title="Limpar Cache e Atualizar Forçado do Servidor"
          >
              <i className={`fas fa-database ${clearingCache ? 'fa-spin' : ''}`}></i> {/* Changed icon */}
          </button>
        </div>
        <div className={styles.actionButtons}>
          <button
            className="btn secondary icon-only"
            onClick={handleExport}
            disabled={loading || clearingCache || totalItems === 0} // Disable if no items displayed
            title="Exportar Lista Atual (Filtrada) para CSV"
          >
            <i className="fas fa-file-csv"></i>
          </button>
          <button
            className="btn info icon-only"
            onClick={() => setHelpModalOpen(true)}
            title="Ajuda"
            disabled={loading || clearingCache}
          >
            <i className="fas fa-question-circle"></i>
          </button>
        </div>
      </div>

      {/* Totalizers */}
      {initialLoadDone && renderTotalizers()}

       {/* Error Display */}
       {error && (
            <div className={styles.errorState}>
                <i className="fas fa-exclamation-triangle fa-2x"></i>
                <p>{error}</p>
                <button className='btn secondary small' onClick={() => handleFabricSearch(false)}>Tentar novamente</button>
            </div>
        )}


      {/* AG Grid Table */}
      {/* Only render grid container if not in error state *before* initial load */}
      {(!error || initialLoadDone) && (
            <AgGridTable<Fabric>
                rowData={allFabrics} // Pass all data, filtering handled by quickFilterText
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={50} // Default page size
                paginationPageSizeSelector={[25, 50, 100, 200]} // Options for page size
                domLayout='autoHeight' // Adjust height automatically
                isLoading={loading || clearingCache}
                onGridReadyCallback={onGridReady} // Pass callback to get API
                onFilterChanged={handleGridFilterOrSortChanged} // Update totals on filter
                onSortChanged={handleGridFilterOrSortChanged} // Update totals on sort
                quickFilterText={filterText} // Pass filter text for quick filter
            />
        )}

      {/* Initial state message */}
      {!initialLoadDone && !loading && !error && (
            <div className={styles.loadingOrInitialState}>
                <i className="fas fa-search fa-3x"></i>
                <p>Clique em "Consultar Tecidos" para carregar a lista inicial.</p>
            </div>
        )}

      {/* Help Modal */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
};

export default Fabrics;