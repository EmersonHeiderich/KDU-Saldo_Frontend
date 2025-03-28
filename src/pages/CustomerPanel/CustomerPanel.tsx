// src/pages/CustomerPanel/CustomerPanel.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// Use frontend interfaces and service functions
import * as customerPanelService from '../../services/customerPanelService';
import { CustomerData as CustomerDataType, CustomerStatistics as CustomerStatsType } from '../../services/customerPanelService'; // Use frontend types
// Import Components
import CustomerSearch from './components/CustomerSearch';
import CustomerDataComponent from './components/CustomerData'; // Renamed import
import CustomerKPIs from './components/CustomerKPIs';
import CustomerStatisticsComponent from './components/CustomerStatistics'; // Renamed import
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

  // State for Help Modal
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // --- Effects ---

  // Permission Check
  useEffect(() => {
    // Check the specific permission name from the backend/ApiUser interface
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

    // Reset states for new search
    setCustomerData(null);
    setStatistics(null);
    setError(null);
    setLoadingData(true);
    setLoadingStats(true); // Start loading both
    setSearchPerformed(true); // Mark that search is initiated

    let fetchedCustomerData: CustomerDataType | null = null;

    try {
      // Fetch customer data
      fetchedCustomerData = await customerPanelService.getCustomerData({
        termo_busca: searchTerm,
        tipo_busca: searchType
      });

      if (!fetchedCustomerData) {
        // If customer data not found, set error and stop loading both
        setError('Cliente não encontrado.');
        setLoadingData(false);
        setLoadingStats(false);
        return; // Stop further execution
      }

      // Customer data found, update state and stop its loading indicator
      setCustomerData(fetchedCustomerData);
      setLoadingData(false);

      // Now fetch statistics using the customer code
      try {
        const stats = await customerPanelService.getCustomerStatistics(fetchedCustomerData.codigo);
        setStatistics(stats); // Update stats state (can be null if not found)
      } catch (statsError: any) {
        console.error('Erro ao buscar estatísticas:', statsError);
        // Don't set general error, maybe show a specific message for stats failure?
        // For now, just log it and statistics will remain null
        setStatistics(null); // Ensure stats are null on error
      } finally {
         setLoadingStats(false); // Stop stats loading indicator regardless of success/failure
      }

    } catch (err: any) {
      console.error('Erro na busca do cliente:', err);
      // Handle specific API errors for customer data search
       if (err instanceof customerPanelService.ApiError) {
           setError(err.message || 'Erro ao buscar cliente.');
       } else {
           setError('Ocorreu um erro inesperado ao buscar os dados do cliente.');
       }
      // Ensure loading indicators are stopped on error
      setLoadingData(false);
      setLoadingStats(false);
      setCustomerData(null); // Clear customer data on error
      setStatistics(null);   // Clear stats on error
    }
  }, []); // No dependencies needed here


  // --- Render Functions ---

  const renderFutureActions = () => {
    // Show actions only if customer data is loaded
    if (!customerData || loadingData) return null;

    return (
      <div className={styles.futureActions}>
        <h3>Ações Futuras:</h3>
        <button className="btn secondary" title="Contas a Receber (Em breve)" disabled>
          <i className="fas fa-file-invoice-dollar"></i> Contas a Receber
        </button>
        <button className="btn secondary" title="Boletos (Em breve)" disabled>
          <i className="fas fa-barcode"></i> Boletos
        </button>
        <button className="btn secondary" title="Notas Fiscais (Em breve)" disabled>
          <i className="fas fa-file-invoice"></i> Notas Fiscais
        </button>
      </div>
    );
  };

  const renderContent = () => {
    // Show loading indicator if customer data is loading
    if (loadingData) {
      return (
        <div className={styles.loadingState}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Carregando dados do cliente...</p>
        </div>
      );
    }

    // Show error if customer data search failed
    if (error && !customerData) { // Check !customerData to avoid showing error if only stats failed
      return (
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      );
    }

    // Show initial state message if no search has been performed yet
    if (!searchPerformed) {
      return (
        <div className={styles.initialState}>
          <i className="fas fa-search fa-3x"></i>
          <p>Digite o Código/CPF/CNPJ do cliente e clique em "Consultar".</p>
        </div>
      );
    }

    // Show message if search was performed but no customer data found (covered by error state now)
    // if (searchPerformed && !customerData) {
    //     return (
    //         <div className={styles.noDataState}>
    //             <i className="fas fa-user-times fa-3x"></i>
    //             <p>Nenhum cliente encontrado para os critérios informados.</p>
    //         </div>
    //     );
    // }

    // Render customer data and statistics components if data exists
    if (customerData) {
      return (
        <>
          <div className={styles.customerContainer}>
            {/* Left side: Customer registration data */}
            <CustomerDataComponent data={customerData} />

            {/* Right side: KPIs and Detailed Statistics */}
            <div>
              {/* Show KPIs and Stats only if stats finished loading (successfully or not) */}
              {!loadingStats && statistics && (
                <>
                  <CustomerKPIs statistics={statistics} />
                  <CustomerStatisticsComponent statistics={statistics} />
                </>
              )}
               {/* Show loading specifically for stats if data is loaded but stats are still fetching */}
              {loadingStats && (
                  <div className={styles.loadingState} style={{ minHeight: '200px' }}> {/* Add min-height */}
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Carregando estatísticas...</p>
                  </div>
              )}
               {/* Show message if stats loading finished but no stats were found */}
              {!loadingStats && !statistics && (
                  <div className={styles.noDataState} style={{ minHeight: '200px' }}>
                      <i className="fas fa-chart-bar"></i>
                      <p>Não foram encontradas estatísticas para este cliente.</p>
                  </div>
              )}
            </div>
          </div>

          {/* Future Actions Area */}
          {renderFutureActions()}
        </>
      );
    }

    return null; // Fallback if none of the above conditions match
  };

  // --- JSX ---
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Painel do Cliente</h1>
        <p className={styles.subtitle}>Consulta de dados cadastrais e estatísticas financeiras</p>
      </header>

      {/* Search Component */}
      <CustomerSearch
        onSearch={handleSearch}
        loading={loadingData || loadingStats} // Pass combined loading state
      />

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {renderContent()}
      </div>

      {/* Help Modal */}
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
};

export default CustomerPanel;