// src/pages/Products/Products.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// Import types and functions
import * as productService from '../../services/productService';
import { ApiProductMatrix, ApiProductItem, FormattedProductVariantDetails, formatApiProductItemForDetails } from '../../services/productService';
import * as observationService from '../../services/observationService';
// Import Components
import HelpModal from './components/HelpModal';
import DetailsModal from './components/DetailsModal';
import ObservationsModal from './components/ObservationsModal';
import PendingObservationsModal from './components/PendingObservationsModal';
import ProductMatrixComponent from './components/ProductMatrix';
// Import CSS
import styles from './Products.module.css';
import './observations-animations.css';
import '../../components/BaseModal/BaseModal.css';

const Products: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // State for user input
  const [referenceCodeInput, setReferenceCodeInput] = useState('');
  const [calculationMode, setCalculationMode] = useState('base');

  // State for API data
  const [matrixData, setMatrixData] = useState<ApiProductMatrix | null>(null);
  const [productItems, setProductItems] = useState<ApiProductItem[]>([]); // Store raw items
  const [selectedVariantDetails, setSelectedVariantDetails] = useState<FormattedProductVariantDetails | null>(null); // Store formatted details for modal

  // State for UI control
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false); // Keep for modal opening indicator
  const [error, setError] = useState<string | null>(null);
  const [searchedReference, setSearchedReference] = useState('');

  // State for Modals
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [observationsModalOpen, setObservationsModalOpen] = useState(false);
  const [pendingObservationsModalOpen, setPendingObservationsModalOpen] = useState(false);

  // State for Observations Badge
  const [hasPendingObservations, setHasPendingObservations] = useState(false);
  const [pendingObservationsCount, setPendingObservationsCount] = useState(0);

  // --- Effects ---

  useEffect(() => {
    if (user && !user.permissions.is_admin && !user.permissions.can_access_products) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const lastMode = localStorage.getItem('ultimoModoCalculo');
    if (lastMode && ['base', 'sales', 'production'].includes(lastMode)) {
      setCalculationMode(lastMode);
    }
  }, []);

  // Update observation badge when search completes successfully
  useEffect(() => {
    if (searchedReference && matrixData) {
      updateObservationBadge(searchedReference);
    } else {
      setPendingObservationsCount(0);
      setHasPendingObservations(false);
    }
  }, [searchedReference, matrixData]); // Run when searchedReference or matrixData updates


  // --- Data Fetching Functions ---

  const handleProductSearch = useCallback(async (codeToSearchArg?: string) => {
    const codeToSearch = (codeToSearchArg || referenceCodeInput.trim()).toUpperCase(); // Use arg or input state

    if (!codeToSearch) {
      setError('Por favor, informe o código de referência.');
      return;
    }

    localStorage.setItem('ultimoModoCalculo', calculationMode);

    setLoading(true);
    setError(null);
    setMatrixData(null);
    setProductItems([]); // Clear product items
    setSearchedReference(codeToSearch);
    if (!codeToSearchArg) {
       setReferenceCodeInput(''); // Clear input only if triggered from input
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch matrix data AND product items from the service
      const response = await productService.getProductMatrixData(codeToSearch, calculationMode);

      if (response && response.matrix && response.product_items) {
        setMatrixData(response.matrix);
        setProductItems(response.product_items); // Store the raw items
        // Badge update handled by useEffect
      } else {
        setError('Produto não encontrado ou dados da matriz inválidos.');
        setMatrixData(null);
        setProductItems([]);
      }

    } catch (err) {
      console.error('Falha na busca da matriz de produtos:', err);
      setMatrixData(null);
      setProductItems([]);
      if (err instanceof productService.ApiError) {
         setError(err.message || 'Erro ao buscar produto.');
         if(err.status === 404) {
            setError(`Produto com referência '${codeToSearch}' não encontrado.`);
         }
      } else if (err instanceof Error) {
          setError(err.message || 'Ocorreu um erro inesperado.');
      } else {
           setError('Ocorreu um erro inesperado. Verifique a conexão ou tente novamente.');
      }

    } finally {
      setLoading(false);
      if (!codeToSearchArg) {
           referenceInputRef.current?.focus();
      }
    }
  }, [referenceCodeInput, calculationMode]); // Dependencies for useCallback


  // --- Event Handlers ---

  const handleCellClick = (colorCode: string, sizeName: string) => {
    if (!productItems || productItems.length === 0) return; // No data to search within

    setDetailsLoading(true); // Indicate loading (even if brief)
    setSelectedVariantDetails(null); // Clear previous

    // Find the specific variant in the stored productItems list
    const targetItem = productItems.find(item =>
        item.color_code === colorCode && item.size_name === sizeName
    );

    if (targetItem) {
        // Format the found item for the details modal
        const formattedDetails = formatApiProductItemForDetails(targetItem);
        if (formattedDetails) {
            setSelectedVariantDetails(formattedDetails);
            setDetailsModalOpen(true);
        } else {
            // Should not happen if targetItem is valid, but handle defensively
            console.error("Failed to format target product item:", targetItem);
            alert("Erro ao formatar detalhes do produto.");
        }
    } else {
        console.warn(`Variant not found in cached items: Color=${colorCode}, Size=${sizeName}`);
        // Optionally show an alert or message if the variant *should* exist but isn't found
         alert(`Detalhes não encontrados para Cor ${colorCode}, Tamanho ${sizeName} nos dados carregados.`);
    }

    setDetailsLoading(false); // Stop loading indicator
};


  const handleExport = () => {
    if (!matrixData) {
      alert('Não há dados de matriz para exportar.');
      return;
    }
    const tableElement = document.querySelector(`.${styles.matrixTable}`) as HTMLTableElement | null;
    if (tableElement) {
      try {
        const tableData = productService.extractTableData(tableElement);
        productService.exportarCSV(tableData, searchedReference || 'matriz_produtos');
      } catch (exportError) {
        console.error("Erro ao exportar CSV:", exportError);
        alert("Falha ao gerar o arquivo CSV.");
      }
    } else {
      console.error("Elemento da tabela não encontrado para exportação.");
      alert('Não foi possível encontrar a tabela para exportar.');
    }
  };

  // updateObservationBadge remains the same
  const updateObservationBadge = async (reference: string, retryCount = 0) => {
    if (!reference) return;
    const maxRetries = 1;

    try {
      if (retryCount > 0) await new Promise(resolve => setTimeout(resolve, 300 * retryCount));
      const data = await observationService.getUnresolvedObservationsCount(reference);
      setPendingObservationsCount(data.count);
      setHasPendingObservations(data.count > 0);
    } catch (err) {
      console.warn(`Erro ao atualizar badge de observações (Tentativa ${retryCount + 1}):`, err);
      if (retryCount < maxRetries) {
        updateObservationBadge(reference, retryCount + 1);
      } else {
        setPendingObservationsCount(0); // Reset on final failure
        setHasPendingObservations(false);
      }
    }
  };

  const handleOpenObservations = () => {
    if (!searchedReference) {
      setError('Consulte um produto antes de ver as observações.');
      return;
    }
    setError(null);
    updateObservationBadge(searchedReference).then(() => {
      setObservationsModalOpen(true);
    });
  };

  const handleSelectReferenceFromPending = (selectedReference: string) => {
     if (!selectedReference) return;
     handleProductSearch(selectedReference);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleProductSearch();
    }
  };

  // --- Render Functions ---

  const renderReferenceInfo = () => {
    if (!searchedReference || !matrixData || loading) return null;

    const totals = matrixData.totals;
    const formatTotal = (value: number | null | undefined): string => {
         if (value === null || value === undefined) return '-';
         return new Intl.NumberFormat('pt-BR').format(value);
     };

    return (
      <div className={styles.referenceInfo}>
        <div className={styles.referenceIcon}>
          <i className="fas fa-tag"></i>
        </div>
        <span className={styles.referenceCodeText}>Ref: <strong>{searchedReference}</strong></span>

        {totals && (
          <div className={styles.totalizers}>
            <div className={styles.totalizer} title="Saldo Base Total">
              <i className="fas fa-boxes"></i>
              <span>{formatTotal(totals.base_balance)}</span>
            </div>
            <div className={styles.totalizer} title="Pedidos de Venda">
              <i className="fas fa-shopping-cart"></i>
              <span>{formatTotal(totals.sales_orders)}</span>
            </div>
            <div className={styles.totalizer} title="Em Produção">
              <i className="fas fa-industry"></i>
              <span>{formatTotal(totals.in_production)}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles.loadingState}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Carregando matriz de saldos...</p>
        </div>
      );
    }

    if (error) {
        return (
            <div className={styles.errorState}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error}</p>
            {!error.toLowerCase().includes('não encontrado') && <p>Por favor, tente novamente.</p>}
            </div>
        );
    }

    if (!matrixData && !searchedReference) {
        return (
            <div className={styles.initialState}>
            <i className="fas fa-search fa-4x"></i>
            <p>Digite um código de referência e clique em "Consultar".</p>
            </div>
        );
    }

     if (!matrixData && searchedReference) {
        return (
             <div className={styles.noData}>
                 <i className="fas fa-search-minus"></i>
                 <p>Não foram encontrados dados válidos para a referência '{searchedReference}'.</p>
             </div>
        );
    }

    if (matrixData) {
        return (
          <ProductMatrixComponent
            data={matrixData}
            onCellClick={handleCellClick}
          />
        );
    }

    return null;
  };

  // --- JSX ---
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Produtos Acabados</h1>
        <p className={styles.subtitle}>Consulta de saldos por referência</p>
      </header>

      {/* Controls Section */}
      <div className={styles.controlsContainer}>
        <div className={styles.controls}>
          <div className={styles.inputGroup}>
            <label htmlFor="referencia">Código de Referência:</label>
            <input
              type="text"
              id="referencia"
              placeholder="Ex: REF123"
              value={referenceCodeInput}
              onChange={(e) => setReferenceCodeInput(e.target.value)}
              onKeyDown={handleKeyPress}
              ref={referenceInputRef}
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="modoCalculo">Modo de Cálculo:</label>
            <select
              id="modoCalculo"
              value={calculationMode}
              onChange={(e) => setCalculationMode(e.target.value)}
              disabled={loading}
              className={styles.selectInput}
            >
              <option value="base">Saldo Base</option>
              <option value="sales">Considerar Vendas</option>
              <option value="production">Considerar Vendas + Produção</option>
            </select>
          </div>

          <button
            className="btn primary"
            onClick={() => handleProductSearch()}
            disabled={loading || !referenceCodeInput.trim()}
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
             Consultar
          </button>
        </div>

        {/* Action buttons */}
        <div className={styles.actionButtons}>
          <button
            className={`btn secondary icon-only ${styles.observationsButton}`}
            onClick={handleOpenObservations}
            title="Observações do Produto Atual"
            disabled={loading || !searchedReference || !matrixData}
          >
            <i className="fas fa-comment-alt"></i>
            {pendingObservationsCount > 0 && (
              <span className={`${styles.badge} ${hasPendingObservations ? 'hasPending' : ''}`}>
                {pendingObservationsCount}
              </span>
            )}
          </button>

          <button
            className="btn secondary icon-only"
            onClick={() => setPendingObservationsModalOpen(true)}
            title="Lista de Observações Pendentes (Todas)"
            disabled={loading}
          >
            <i className="fas fa-list-ul"></i>
          </button>

          <button
            className="btn secondary icon-only"
            onClick={handleExport}
            disabled={loading || !matrixData}
            title="Exportar Matriz para CSV"
          >
            <i className="fas fa-file-csv"></i>
          </button>

          <button
            className="btn info icon-only"
            onClick={() => setHelpModalOpen(true)}
            title="Ajuda"
            disabled={loading}
          >
            <i className="fas fa-question-circle"></i>
          </button>
        </div>
      </div>

      {/* Reference Info and Totals */}
      {renderReferenceInfo()}

      {/* Main Content Area (Matrix or State Messages) */}
      <div className={styles.productContainer}>
        {renderContent()}
      </div>

      {/* Modals */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />

      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        details={selectedVariantDetails} // Pass formatted details
        loading={detailsLoading}
      />

      <ObservationsModal
        isOpen={observationsModalOpen}
        onClose={() => setObservationsModalOpen(false)}
        referenceCode={searchedReference}
        onObservationChange={() => updateObservationBadge(searchedReference)}
      />

      <PendingObservationsModal
        isOpen={pendingObservationsModalOpen}
        onClose={() => setPendingObservationsModalOpen(false)}
        onViewObservations={(ref) => {
          setSearchedReference(ref); // Set the context for the ObservationsModal
          setObservationsModalOpen(true);
        }}
        onSelectReference={handleSelectReferenceFromPending}
      />
    </div>
  );
};

export default Products;