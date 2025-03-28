// src/pages/Products/components/ObservationsModal.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../Products.module.css';
import BaseModal from '../../../components/BaseModal/BaseModal';
import useDelayedLoading from '../../../hooks/useDelayedLoading';
import { Observation, getObservations, resolveObservation, createObservation, formatDate, ApiError } from '../../../services/observationService';

interface ObservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceCode: string | null;
  onObservationChange: () => void;
}

const ObservationsModal: React.FC<ObservationsModalProps> = ({
  isOpen,
  onClose,
  referenceCode,
  onObservationChange
}) => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [newObservationText, setNewObservationText] = useState('');
  const [showSpinner, triggerSpinner, cancelSpinner] = useDelayedLoading(300);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const isMounted = useRef(true);
  useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
  }, []);

  // --- Memoized loadObservations function ---
  const loadObservations = useCallback(async (retryCount = 0) => {
    if (!referenceCode) {
        if (isMounted.current) {
            setObservations([]);
            setError(null);
            cancelSpinner(); // Still need to cancel if ref code becomes null
        }
      return;
    }

    const maxRetries = 1;
    // Ensure spinner is triggered only if not already loading (though useDelayedLoading handles this)
    if (retryCount === 0) {
        triggerSpinner(true);
        setError(null);
    }

    try {
      if (retryCount > 0) await new Promise(resolve => setTimeout(resolve, 500 * retryCount));

      const data = await getObservations(referenceCode);

      const sortedData = [...data].sort(
           (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      if (isMounted.current) {
          setObservations(sortedData);
          setError(null); // Clear error on success
          // Cancel spinner *after* successful data load and state update
          cancelSpinner();
      }

    } catch (err: any) {
      console.error(`Erro ao carregar observações para ${referenceCode}:`, err);
      if (retryCount < maxRetries) {
        console.log(`Tentando carregar observações novamente (${retryCount + 1}/${maxRetries + 1})...`);
        setTimeout(() => { if(isMounted.current) loadObservations(retryCount + 1); }, 500);
      } else {
         if (isMounted.current) {
            setError(err.message || 'Erro ao carregar observações. Tente reabrir o modal.');
            setObservations([]);
            cancelSpinner(); // Cancel spinner on final error
         }
      }
    }
    // NOTE: Removed finally block with cancelSpinner - moved into try/catch branches
  }, [referenceCode, triggerSpinner, cancelSpinner]); // Dependencies are correct


  // --- Effect to Load Data --- (Executado APENAS quando o modal é aberto pela primeira vez)
  useEffect(() => {
    if (isOpen && referenceCode) {
        loadObservations();
    }
  }, [isOpen]); // Removido referenceCode e loadObservations das dependências para evitar chamadas repetitivas

  // --- Effect for CLEANUP when MODAL CLOSES --- (Efeito separado para limpeza)
  useEffect(() => {
    if (!isOpen) {
      // Executado apenas quando o modal é fechado
      // Importante: usamos um setTimeout para evitar o loop de renderização
      const timer = setTimeout(() => {
        if (!isOpen) { // Verificação dupla para garantir
          console.log("Modal closed, resetting internal state only.");
          setObservations([]);
          setNewObservationText('');
          setError(null);
          setSaving(false);
          setResolvingId(null);
        }
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // Dependência única - apenas isOpen
  
  // Separated cancelSpinner effect - limpa o timer de loading de forma segura
  useEffect(() => {
    // Cleanup function that runs when component unmounts or dependencies change
    return () => {
      if (!isOpen) {
        cancelSpinner(); // Safe to call in cleanup function
      }
    };
  }, [isOpen, cancelSpinner]);


  // --- Action Handlers (handleResolveObservation, handleSaveObservation) ---
  // (Keep the previous optimized versions of these handlers)
  const handleResolveObservation = async (observationId: number) => {
    if (resolvingId === observationId || saving) return;

    if (!window.confirm('Deseja realmente marcar esta observação como resolvida?')) {
      return;
    }

    setResolvingId(observationId);
    setError(null);

    try {
      await resolveObservation(observationId);
      setObservations(prevObs => prevObs.map(obs =>
        obs.id === observationId
          ? { ...obs, resolved: true, resolvedUser: 'Você (Atualize)', resolvedTimestamp: new Date().toISOString() }
          : obs
      ));
      onObservationChange();

    } catch (err: any) {
      setError(`Erro ao resolver: ${err.message || 'Erro desconhecido'}`);
      console.error('Erro ao resolver observação:', err);
    } finally {
       if (isMounted.current) setResolvingId(null);
    }
  };

  const handleSaveObservation = async () => {
    if (!newObservationText.trim() || !referenceCode || saving || resolvingId) {
      if (!newObservationText.trim()) setError('Digite o texto da observação.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createObservation(referenceCode, newObservationText.trim());
      setNewObservationText('');
      await loadObservations(); // Reload list immediately after saving
      onObservationChange();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar observação.');
      console.error('Erro ao salvar observação:', err);
    } finally {
       if (isMounted.current) setSaving(false);
    }
  };


  // --- Render Functions (Keep the previous optimized versions) ---
  const renderObservationsList = () => {
    if (error && observations.length === 0 && !showSpinner) {
      return (
        <div className={`${styles.errorState} ${styles.modalErrorContent}`}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      );
    }

    if (observations.length === 0 && !showSpinner && !error) {
      return (
        <div className={`${styles.emptyState} ${styles.modalEmptyContent}`}>
          <i className="fas fa-comment-slash"></i>
          <p>Nenhuma observação registrada.</p>
        </div>
      );
    }

    return (
      <div className={styles.observationsList}>
        {observations.map(obs => {
            const isBeingResolved = resolvingId === obs.id;
            return (
                <div
                    key={obs.id}
                    className={`${styles.observationItem} ${obs.resolved ? styles.resolved : styles.pending} ${isBeingResolved ? styles.resolving : ''}`}
                >
                    <div className={styles.observationHeader}>
                    <span className={styles.observationUser}><i className="fas fa-user"></i> {obs.user}</span>
                    <span className={styles.observationDate}><i className="far fa-calendar-alt"></i> {formatDate(obs.timestamp)}</span>
                    </div>
                    <div className={styles.observationContent}>{obs.observationText || '[Observação sem texto]'}</div>
                    <div className={styles.observationFooter}>
                    <span className={styles.observationStatus}>
                        {obs.resolved
                            ? <><i className="fas fa-check-circle"></i> Resolvida</>
                            : <><i className="fas fa-hourglass-half"></i> Pendente</>
                        }
                    </span>

                    {!obs.resolved ? (
                        <button
                        className={`btn small primary ${styles.resolveButton}`}
                        onClick={() => handleResolveObservation(obs.id)}
                        disabled={isBeingResolved || saving}
                        >
                        {isBeingResolved ? (
                            <><i className="fas fa-spinner fa-spin"></i> Resolvendo...</>
                        ) : (
                            <><i className="fas fa-check"></i> Marcar Resolvida</>
                        )}
                        </button>
                    ) : (
                        obs.resolvedUser && obs.resolvedTimestamp && (
                            <span className={styles.resolvedBy}>
                                por {obs.resolvedUser} em {formatDate(obs.resolvedTimestamp)}
                            </span>
                        )
                    )}
                    </div>
                </div>
            );
        })}
         {error && observations.length > 0 && !showSpinner && (
             <p className={styles.errorTextCenter}>{error}</p>
         )}
      </div>
    );
  };

  const renderNewObservationForm = () => {
    if (error && observations.length === 0 && !showSpinner) return null;

    return (
      <div className={styles.newObservationSection}>
        <hr className={styles.separator} />
        <h4>Adicionar Nova Observação</h4>
        <form className={styles.newObservationForm} onSubmit={(e) => { e.preventDefault(); handleSaveObservation(); }}>
          <textarea
            rows={3}
            placeholder="Digite sua observação..."
            value={newObservationText}
            onChange={(e) => setNewObservationText(e.target.value)}
            disabled={saving || showSpinner || resolvingId !== null}
            aria-label="Nova observação"
            required
          />
           {error && <p className={styles.formErrorInline}>{error}</p>}
          <div className={styles.formActions}>
            <button
              type="submit"
              className="btn primary"
              disabled={saving || showSpinner || resolvingId !== null || !newObservationText.trim()}
            >
              {saving ? (
                <><i className="fas fa-spinner fa-spin"></i> Salvando...</>
              ) : (
                <><i className="fas fa-plus"></i> Adicionar</>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // --- Main Render ---
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose} // BaseModal handles closing logic internally now
      title={`Observações: ${referenceCode || 'Produto'}`}
      // Show BaseModal's loading only on initial load when list is empty
      showLoading={showSpinner && observations.length === 0 && !error}
      loadingMessage="Carregando observações..."
      className={styles.observationsModalContent}
    >
      {renderObservationsList()}
      {renderNewObservationForm()}
    </BaseModal>
  );
};

export default ObservationsModal;
