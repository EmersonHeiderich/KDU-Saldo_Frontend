// src/pages/CustomerPanel/CustomerPanel.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// Use frontend interfaces and service functions
import * as customerPanelService from '../../services/customerPanelService';
import { CustomerData as CustomerDataType, CustomerStatistics as CustomerStatsType } from '../../services/customerPanelService'; // Use frontend types
// Import Components
import CustomerSearch from './components/CustomerSearch';
import CustomerDataComponent from './components/CustomerData';
import CustomerKPIs from './components/CustomerKPIs';
import CustomerStatisticsComponent from './components/CustomerStatistics';
import HelpModal from './components/HelpModal';
// Import CSS
import styles from './CustomerPanel.module.css';
import '../../components/BaseModal/BaseModal.css'; // BaseModal styles

const CustomerPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States for data (using frontend types)
  const [customerData, setCustomerData] = useState<CustomerDataType | null>(null);
  const [statistics, setStatistics] = useState<CustomerStatsType | null>(null);

  // States for UI control
  const [loadingData, setLoadingData] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false); // Separate loading for stats
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false); // Track if a search was done
  const [currentSearchTerm, setCurrentSearchTerm] = useState<{ term: string, type?: 'PF' | 'PJ' } | null>(null); // Store last search

  // State for Help Modal
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // --- Effects ---

  // Permission Check
  useEffect(() => {
    const canAccess = user?.permissions.is_admin || user?.permissions.can_access_customer_panel;
    if (user && !canAccess) {
      navigate('/'); // Redirect if no permission
    }
  }, [user, navigate]);

  // --- Data Fetching ---

  // Fetches customer data AND statistics
  const handleSearch = useCallback(async (searchTerm: string, searchType?: 'PF' | 'PJ') => {
    if (!searchTerm) {
      setError('Por favor, informe um termo de busca válido.');
      return;
    }

    // Store the current search criteria
    setCurrentSearchTerm({ term: searchTerm, type: searchType });

    // Reset states for new search
    setCustomerData(null);
    setStatistics(null);
    setError(null);
    setLoadingData(true);
    setLoadingStats(true);
    setSearchPerformed(true);

    let fetchedCustomerData: CustomerDataType | null = null;

    try {
      fetchedCustomerData = await customerPanelService.getCustomerData({
        termo_busca: searchTerm,
        tipo_busca: searchType
      });

      if (!fetchedCustomerData) {
        setError('Cliente não encontrado.');
        setLoadingData(false);
        setLoadingStats(false);
        return;
      }

      setCustomerData(fetchedCustomerData);
      setLoadingData(false);

      // Fetch statistics
      try {
        const stats = await customerPanelService.getCustomerStatistics(fetchedCustomerData.codigo);
        setStatistics(stats);
      } catch (statsError: any) {
        console.error('Erro ao buscar estatísticas:', statsError);
        setStatistics(null);
      } finally {
         setLoadingStats(false);
      }

    } catch (err: any) {
      console.error('Erro na busca do cliente:', err);
       if (err instanceof customerPanelService.ApiError) {
           setError(err.message || 'Erro ao buscar cliente.');
       } else {
           setError('Ocorreu um erro inesperado ao buscar os dados do cliente.');
       }
      setLoadingData(false);
      setLoadingStats(false);
      setCustomerData(null);
      setStatistics(null);
    }
  }, []); // Removed dependencies, managed via explicit calls

  // --- Actions ---
  const navigateToFiscal = () => {
      if (!customerData) return;

      // Determine the filter type and value to pass
      const filterValue = customerData.tipoCliente === 'PF'
                          ? (customerData as customerPanelService.IndividualCustomerData).cpf
                          : (customerData as customerPanelService.LegalEntityCustomerData).cnpj;

      navigate('/fiscal', {
          state: {
              customerFilter: {
                  type: customerData.tipoCliente, // 'PF' or 'PJ'
                  value: filterValue, // Pass CPF or CNPJ
                  display: `${customerData.codigo} - ${customerData.tipoCliente === 'PF' ? customerData.nome : customerData.razaoSocial}` // For display on fiscal page if needed
              }
          }
      });
  };


  // --- Render Functions ---

  const renderFutureActions = () => {
    if (!customerData || loadingData) return null;

    const canAccessFiscal = user?.permissions.is_admin || user?.permissions.can_access_fiscal;

    return (
      <div className={styles.futureActions}>
        <h3>Ações:</h3>
        {/* Fiscal Button */}
        {canAccessFiscal && (
            <button
                className="btn secondary"
                onClick={navigateToFiscal}
                title={`Ver notas fiscais para ${customerData.tipoCliente === 'PF' ? customerData.nome : customerData.razaoSocial}`}
            >
                <i className="fas fa-file-invoice"></i> Ver Notas Fiscais
            </button>
        )}
         {/* Other disabled buttons */}
        <button className="btn secondary" title="Contas a Receber (Em breve)" disabled>
          <i className="fas fa-file-invoice-dollar"></i> Contas a Receber
        </button>
        <button className="btn secondary" title="Boletos (Em breve)" disabled>
          <i className="fas fa-barcode"></i> Boletos
        </button>
        {/* Removed generic NF button as it's now specific */}
      </div>
    );
  };

  const renderContent = () => {
    if (loadingData) {
      return (
        <div className={styles.loadingState}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Carregando dados do cliente...</p>
        </div>
      );
    }

    if (error && !customerData) {
      return (
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      );
    }

    if (!searchPerformed) {
      return (
        <div className={styles.initialState}>
          <i className="fas fa-search fa-3x"></i>
          <p>Digite o Código/CPF/CNPJ do cliente e clique em "Consultar".</p>
        </div>
      );
    }

    if (customerData) {
      return (
        <>
          <div className={styles.customerContainer}>
            <CustomerDataComponent data={customerData} />
            <div>
              {!loadingStats && statistics && (
                <>
                  <CustomerKPIs statistics={statistics} />
                  <CustomerStatisticsComponent statistics={statistics} />
                </>
              )}
              {loadingStats && (
                  <div className={styles.loadingState} style={{ minHeight: '200px' }}>
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Carregando estatísticas...</p>
                  </div>
              )}
              {!loadingStats && !statistics && (
                  <div className={styles.noDataState} style={{ minHeight: '200px' }}>
                      <i className="fas fa-chart-bar"></i>
                      <p>Não foram encontradas estatísticas para este cliente.</p>
                  </div>
              )}
            </div>
          </div>
          {renderFutureActions()}
        </>
      );
    }

    return null;
  };

  // --- JSX ---
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Painel do Cliente</h1>
        <p className={styles.subtitle}>Consulta de dados cadastrais e estatísticas financeiras</p>
      </header>

      <CustomerSearch
        onSearch={handleSearch}
        loading={loadingData || loadingStats}
      />

      <div className={styles.mainContent}>
        {renderContent()}
      </div>

      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
};

export default CustomerPanel;