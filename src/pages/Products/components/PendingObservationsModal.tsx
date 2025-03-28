// src/pages/Products/components/PendingObservationsModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import styles from '../Products.module.css'; // Use parent styles
import BaseModal from '../../../components/BaseModal/BaseModal';
import useDelayedLoading from '../../../hooks/useDelayedLoading';
// Use frontend interfaces and service functions
import { PendingReference, getPendingObservationsReferences, formatDate } from '../../../services/observationService';

interface PendingObservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewObservations: (referenceCode: string) => void; // Callback to open ObsModal for a specific ref
  onSelectReference: (referenceCode: string) => void; // Callback to search for a specific ref
}

const ITEMS_PER_PAGE = 10;

const PendingObservationsModal: React.FC<PendingObservationsModalProps> = ({
  isOpen,
  onClose,
  onViewObservations,
  onSelectReference
}) => {
  // State using frontend PendingReference type
  const [allReferences, setAllReferences] = useState<PendingReference[]>([]);
  const [displayReferences, setDisplayReferences] = useState<PendingReference[]>([]);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setIsLoading, resetLoading] = useDelayedLoading(300);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Memoized load function
  const loadPendingReferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Service returns frontend PendingReference[] sorted by date desc
      const data = await getPendingObservationsReferences();
      setAllReferences(data);
      // Initial display without filtering
      setDisplayReferences(data);
      setTotalPages(Math.ceil(data.length / ITEMS_PER_PAGE));
      setCurrentPage(1); // Reset page on load
    } catch (err: any) {
      console.error('Erro ao carregar referências pendentes:', err);
      setError(err.message || 'Erro ao carregar lista. Tente reabrir o modal.');
      setAllReferences([]);
      setDisplayReferences([]);
    } finally {
      resetLoading();
    }
  }, [setIsLoading, resetLoading]); // Dependencies for useCallback


  // Load data when modal opens (apenas uma vez quando o modal é aberto)
  useEffect(() => {
    if (isOpen) {
      loadPendingReferences();
    }
  }, [isOpen]); // Removido loadPendingReferences das dependências para evitar chamadas repetitivas

  // Separated cleanup effect (executado apenas quando o modal é fechado)
  useEffect(() => {
    if (!isOpen) {
      // Usando setTimeout para evitar loop de renderização
      const timer = setTimeout(() => {
        if (!isOpen) { // Verificação dupla para garantir
          setSearchTerm('');
          setAllReferences([]);
          setDisplayReferences([]);
          setError(null);
          setCurrentPage(1);
          setTotalPages(1);
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // Dependência única - apenas isOpen
  
  // Separated resetLoading effect
  useEffect(() => {
    // Quando o modal é fechado, limpar o timer de loading
    return () => {
      if (!isOpen) {
        resetLoading();
      }
    };
  }, [isOpen, resetLoading]);

  // Filter data when searchTerm or allReferences change
  useEffect(() => {
      let filtered = allReferences;
      if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          filtered = allReferences.filter(ref =>
              ref.referenceCode.toLowerCase().includes(term) ||
              ref.user.toLowerCase().includes(term)
          );
      }
      // Update display list and pagination
      setDisplayReferences(filtered);
      setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
      setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, allReferences]);


  // --- Event Handlers ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1)); // Ensure page doesn't go below 1
  };

  const handleNextPage = () => {
     setCurrentPage(prev => Math.min(totalPages, prev + 1)); // Ensure page doesn't exceed total
  };

  // --- Get Current Page Items ---
  const getCurrentPageItems = (): PendingReference[] => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return displayReferences.slice(startIndex, endIndex);
  };

  // --- Actions ---
  const handleViewClick = (e: React.MouseEvent, referenceCode: string) => {
    e.stopPropagation(); // Prevent row click event
    onClose(); // Close this modal first
    onViewObservations(referenceCode); // Call parent to open ObservationsModal
  };

  const handleRowClick = (referenceCode: string) => {
    onClose(); // Close this modal
    onSelectReference(referenceCode); // Call parent to trigger search for this reference
  };


  // --- Render Functions ---
  const renderSearchField = () => (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputContainer}>
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Buscar por Referência ou Usuário..."
          value={searchTerm}
          onChange={handleSearchChange}
          className={styles.searchInput}
          aria-label="Buscar referências pendentes"
          disabled={loading} // Disable while loading initial list
        />
      </div>
    </div>
  );

  const renderReferencesList = () => {
    const currentItems = getCurrentPageItems();

     if (loading) {
       // Loading state is handled by BaseModal, return null or minimal placeholder if needed
       return null;
     }


    if (displayReferences.length === 0) {
      return (
        <div className={styles.emptyState}>
          <i className="fas fa-check-double"></i> {/* Changed icon */}
          <p>
            {searchTerm.trim()
              ? 'Nenhuma referência pendente encontrada para sua busca.'
              : 'Nenhuma observação pendente encontrada.'}
          </p>
        </div>
      );
    }

    return (
      <div className={styles.pendingObservationsContainer}>
        <table className={styles.pendingObservationsTable}>
          <thead>
            <tr>
              <th className={styles.referenceCol}>Referência</th>
              <th className={styles.userCol}>Último Usuário</th>
              <th className={styles.dateCol}>Data/Hora Última</th>
              <th className={styles.actionsCol}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(ref => (
              <tr
                key={ref.referenceCode} // Use referenceCode as key
                onClick={() => handleRowClick(ref.referenceCode)}
                className={styles.referenceRow} // Add class for hover/click effect
                title={`Clique para buscar a referência ${ref.referenceCode}`}
              >
                <td className={styles.referenceCodeCell}>{ref.referenceCode}</td> {/* Added class */}
                <td className={styles.userCell}>{ref.user}</td> {/* Added class */}
                <td className={styles.dateCell}>{formatDate(ref.timestamp)}</td> {/* Added class */}
                <td className={styles.actionsCell}> {/* Added class */}
                  <button
                    className="btn small primary" // Use consistent button styling
                    onClick={(e) => handleViewClick(e, ref.referenceCode)}
                    title={`Ver observações de ${ref.referenceCode}`}
                  >
                    <i className="fas fa-eye"></i> Ver Obs.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className="btn small secondary icon-only" // Use icon-only style
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              title="Página Anterior"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <span className={styles.pageInfo}>
              Página {currentPage} de {totalPages} ({displayReferences.length} itens)
            </span>
            <button
              className="btn small secondary icon-only" // Use icon-only style
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              title="Próxima Página"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    );
  };


  // --- Main Render ---
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Referências com Observações Pendentes"
      showLoading={loading} // Let BaseModal handle loading state display
      loadingMessage="Carregando referências pendentes..."
      className={styles.pendingObservationsModalContent} // Use specific class
    >
        {/* Display error prominently if it occurs */}
        {error && (
           <div className={`${styles.errorState} ${styles.modalError}`}>
               <i className="fas fa-exclamation-triangle"></i>
               <p>{error}</p>
           </div>
        )}

        {/* Render search and list */}
        {!error && renderSearchField()}
        {!error && renderReferencesList()}

        {/* Footer - Optional, BaseModal has close button */}
        {/* <div className={styles.modalFooter}>
           <button type="button" className="btn secondary" onClick={onClose}>
             Fechar
           </button>
         </div> */}

    </BaseModal>
  );
};

export default PendingObservationsModal;
