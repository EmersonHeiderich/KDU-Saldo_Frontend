// src/pages/Fabrics/Fabrics.tsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// Use frontend Fabric interface and service functions
import * as fabricService from '../../services/fabricService';
import { Fabric } from '../../services/fabricService'; // Import frontend type only
import HelpModal from './components/HelpModal';
import styles from './Fabrics.module.css';
import '../../components/BaseModal/BaseModal.css'; // BaseModal styles

const Fabrics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const filterInputRef = useRef<HTMLInputElement>(null);

  // State for data
  const [allFabrics, setAllFabrics] = useState<Fabric[]>([]);
  const [displayFabrics, setDisplayFabrics] = useState<Fabric[]>([]);

  // State for UI control
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // State for sorting
  const [sortField, setSortField] = useState<keyof Fabric>('saldo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
    try {
      const data = await fabricService.getFabricData(null, force);
      setAllFabrics(data);
      setInitialLoadDone(true);
    } catch (error: any) {
      console.error('Falha na busca de tecidos:', error);
      setError(error.message || 'Ocorreu um erro ao consultar os tecidos.');
      setAllFabrics([]);
      setDisplayFabrics([]);
    } finally {
      setLoading(false);
      filterInputRef.current?.focus();
    }
  }, []);


  // --- Client-side Filtering & Sorting Logic ---
  useEffect(() => {
    if (!initialLoadDone) return;
    const filtered = fabricService.filterFabrics(allFabrics, filterText);
    const sortedAndFiltered = fabricService.sortFabrics(filtered, sortField, sortDirection);
    setDisplayFabrics(sortedAndFiltered);
  }, [filterText, allFabrics, initialLoadDone, sortField, sortDirection]);


  // --- Event Handlers ---
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && !clearingCache) {
        handleFabricSearch(false);
    }
  };

  const handleSort = (field: keyof Fabric) => {
    const isSameField = field === sortField;
    const newDirection = isSameField
      ? (sortDirection === 'asc' ? 'desc' : 'asc')
      : (['codigo', 'saldo', 'custo', 'largura', 'gramatura', 'encolhimento'].includes(field) ? 'desc' : 'asc');

    setSortField(field);
    setSortDirection(newDirection);
  };

  const handleExport = () => {
    if (displayFabrics.length > 0) {
      fabricService.exportarCSVTecido(displayFabrics);
    } else {
      alert('Não há dados filtrados para exportar.');
    }
  };

  const handleForceRefresh = async () => {
    setClearingCache(true);
    setError(null);
    try {
      await fabricService.forceClearFabricCache();
      await handleFabricSearch(true);
    } catch (error: any) {
      console.error("Erro ao forçar atualização:", error);
      setError(error.message || "Erro ao forçar atualização do cache.");
    } finally {
      setClearingCache(false);
    }
  };

  // --- Render Functions ---

  const renderSortIcon = (field: keyof Fabric) => {
    if (field !== sortField) {
      return <i className="fas fa-sort" style={{ opacity: 0.4 }}></i>;
    }
    return sortDirection === 'asc'
      ? <i className="fas fa-sort-up"></i>
      : <i className="fas fa-sort-down"></i>;
  };

  const renderTableHeader = () => {
    const headers: { key: keyof Fabric; label: string; numeric?: boolean }[] = [
      { key: 'codigo', label: 'Código', numeric: true },
      { key: 'descricao', label: 'Descrição' },
      { key: 'custo', label: 'R$ Custo', numeric: true },
      { key: 'saldo', label: 'Saldo', numeric: true },
      { key: 'largura', label: 'Larg. (m)', numeric: true }, // Will be centered by CSS
      { key: 'gramatura', label: 'Gram. (g/m²)', numeric: true }, // Will be centered by CSS
      { key: 'encolhimento', label: 'Enc. (%)', numeric: true }, // Will be centered by CSS
    ];

    return (
      <thead>
        <tr>
          {headers.map(header => (
            <th
              key={header.key}
              onClick={() => handleSort(header.key)}
              className={`${styles.tableHeader} ${header.numeric ? styles.numericHeader : ''}`}
            >
              <span>{header.label}</span> {renderSortIcon(header.key)}
            </th>
          ))}
        </tr>
      </thead>
    );
  };

  const renderTableRows = () => {
    return displayFabrics.map(fabric => {
        const saldoNum = Number(fabric.saldo) || 0;
        const custoNum = fabric.custo ?? 0;

        // Aplicando a lógica de cores - sem coloração para valores altos
        let saldoClass = ''; // Sem classe para valores normais (>= 1500)
        if (saldoNum < 500) {
            saldoClass = styles.danger; // Vermelho se < 500
        } else if (saldoNum < 1500) {
            saldoClass = styles.warning; // Amarelo se >= 500 e < 1500
        }

        return (
            <tr key={fabric.codigo}>
                <td className={`${styles.codeCell} ${styles.numericCell}`}>{fabric.codigo}</td>
                <td className={styles.descriptionCell}>{fabric.descricao}</td>
                <td className={styles.numericCell}>{fabricService.formatCurrency(custoNum)}</td>
                {/* Apply saldoClass to the TD and sempre em negrito */}
                <td className={`${styles.numericCell} ${styles.saldoCell} ${saldoClass}`}>{fabricService.formatNumber(saldoNum)}</td>
                {/* Apply centered classes */}
                <td className={`${styles.numericCell} ${styles.widthCell}`}>{fabric.largura?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '-'}</td>
                <td className={`${styles.numericCell} ${styles.grammageCell}`}>{fabric.gramatura?.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) ?? '-'}</td>
                <td className={`${styles.numericCell} ${styles.shrinkageCell}`}>{fabric.encolhimento?.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? '-'}</td>
            </tr>
        );
    });
  };

  const { totalSaldo, totalValor } = useMemo(() => {
       return fabricService.calculateFabricTotalizers(displayFabrics);
  }, [displayFabrics]);


  const renderTotalizers = () => {
     if (displayFabrics.length === 0 || loading || clearingCache) return null;

     const valorFormatado = fabricService.formatCurrency(totalValor);
     const saldoFormatado = fabricService.formatNumber(totalSaldo);

    return (
      <div className={styles.totalizadoresContainer}>
        <div className={styles.totalizadores}>
          <div className={styles.totalizador} title={`Total de ${displayFabrics.length} itens listados`}>
            <i className="fas fa-list-ol"></i>
            <span>{displayFabrics.length} itens</span>
          </div>
          <div className={styles.totalizador} title="Saldo Total dos Itens Listados">
            <i className="fas fa-boxes"></i>
            <span>{saldoFormatado}</span>
          </div>
          <div className={styles.totalizador} title="Valor Total em Estoque (Saldo * Custo) dos Itens Listados">
            <i className="fas fa-dollar-sign"></i>
            <span>{valorFormatado}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading || clearingCache) {
      return (
        <div className={styles.loadingOrInitialState}>
          <i className="fas fa-spinner fa-spin fa-2x"></i>
          <p>{clearingCache ? 'Limpando cache e atualizando...' : 'Carregando tecidos...'}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-triangle fa-2x"></i>
          <p>{error}</p>
           <button className='btn secondary small' onClick={() => handleFabricSearch(false)}>Tentar novamente</button>
        </div>
      );
    }

    if (!initialLoadDone) {
        return (
            <div className={styles.loadingOrInitialState}>
                <i className="fas fa-search fa-3x"></i>
                <p>Clique em "Consultar Tecidos" para carregar a lista inicial.</p>
            </div>
        );
    }

    if (displayFabrics.length === 0) {
      return (
        <div className={styles.noDataState}>
          <i className="fas fa-box-open fa-3x"></i>
          <p>{filterText ? 'Nenhum tecido encontrado para o filtro aplicado.' : 'Nenhum tecido encontrado.'}</p>
        </div>
      );
    }

    return (
      <>
        {/* Renderiza totalizadores separadamente */}
        {renderTotalizers()}
        
        {/* Container principal da tabela */}
        <div className={styles.fabricContainer}>
          <div className={styles.fabricTableContainer}>
            <table className={styles.fabricTable}>
              {renderTableHeader()}
              <tbody>
                {renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>
      </>
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
            <label htmlFor="filtroTecido">Filtrar Descrição/Código:</label>
            <input
              type="text"
              id="filtroTecido"
              placeholder="Digite para filtrar..."
              value={filterText}
              onChange={handleFilterChange}
              onKeyDown={handleKeyPress}
              ref={filterInputRef}
              disabled={loading || clearingCache}
              autoComplete="off"
              aria-label="Filtrar tecidos por descrição ou código"
            />
          </div>
          <button
            className="btn primary"
            onClick={() => handleFabricSearch(false)}
            disabled={loading || clearingCache}
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
             {initialLoadDone ? 'Consultar / Atualizar (Cache)' : 'Consultar Tecidos'}
          </button>
          {/* Force Refresh Button */}
          <button
              className="btn secondary icon-only"
              onClick={handleForceRefresh}
              disabled={loading || clearingCache}
              title="Limpar Cache e Atualizar Forçado"
          >
              <i className={`fas fa-sync-alt ${clearingCache ? 'fa-spin' : ''}`}></i>
          </button>
        </div>
        <div className={styles.actionButtons}>
          <button
            className="btn secondary icon-only"
            onClick={handleExport}
            disabled={loading || clearingCache || displayFabrics.length === 0}
            title="Exportar Lista Atual para CSV"
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

      {/* Content Area - Sem container adicional para evitar scroll duplo */}
      {renderContent()}

      {/* Help Modal */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
};

export default Fabrics;
