import React, { useState, useEffect, ChangeEvent } from 'react';
import { detectInputType, formatCPF, formatCNPJ, cleanDocument } from '../../../services/customerPanelService';
import HelpModal from './HelpModal';
import styles from '../CustomerPanel.module.css';

interface CustomerSearchProps {
  onSearch: (termoBusca: string, tipoBusca?: 'PF' | 'PJ') => void;
  loading: boolean;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({ onSearch, loading }) => {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [formattedTerm, setFormattedTerm] = useState('');
  const [inputType, setInputType] = useState<'codigo' | 'cpf' | 'cnpj' | 'invalido'>('invalido');
  const [personType, setPersonType] = useState<'PF' | 'PJ'>('PF');
  const [error, setError] = useState<string | null>(null);

  // Efeito para atualizar o tipo de entrada quando o termo muda
  useEffect(() => {
    const cleanTerm = cleanDocument(searchTerm);
    const type = detectInputType(cleanTerm);
    setInputType(type);
    
    // Reseta erro quando o usuário digita
    if (error) setError(null);
  }, [searchTerm, error]);

  // Formata o input de acordo com o tipo detectado
  const formatInput = (value: string): string => {
    const cleanValue = cleanDocument(value);
    const type = detectInputType(cleanValue);
    
    if (type === 'cpf') {
      return formatCPF(cleanValue);
    } else if (type === 'cnpj') {
      return formatCNPJ(cleanValue);
    }
    
    return cleanValue;
  };

  // Handler para mudança no input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Armazena o valor limpo para processamento
    setSearchTerm(cleanDocument(value));
    
    // Aplica formatação para visualização
    setFormattedTerm(formatInput(value));
  };

  // Handler para mudança no tipo de pessoa
  const handlePersonTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPersonType(e.target.value as 'PF' | 'PJ');
  };

  // Handler para submissão da busca
  const handleSearch = () => {
    // Validação básica: verifica se o termo foi informado
    if (!searchTerm.trim()) {
      setError('Por favor, informe o código, CPF ou CNPJ do cliente.');
      return;
    }
    
    // Valida o tipo da entrada
    if (inputType === 'invalido') {
      setError('Formato inválido. Informe um código (até 9 dígitos), CPF (11 dígitos) ou CNPJ (14 dígitos).');
      return;
    }
    
    // Se for código, verifica se o tipo de pessoa foi selecionado
    if (inputType === 'codigo') {
      onSearch(searchTerm, personType);
    } else if (inputType === 'cpf') {
      onSearch(searchTerm);
    } else if (inputType === 'cnpj') {
      onSearch(searchTerm);
    }
  };

  // Handler para tecla Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  // Vamos criar um estado para controlar o modal de ajuda
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  return (
    <>
      <div className={styles.controlsContainer}>
        <div className={styles.controls}>
          <div className={styles.inputGroup}>
            <label htmlFor="termoBusca">Código/CPF/CNPJ:</label>
            <input
              type="text"
              id="termoBusca"
              placeholder="Digite o código, CPF ou CNPJ"
              value={formattedTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              disabled={loading}
              autoComplete="off"
            />
            {error && <p className={styles.errorMessage}>{error}</p>}
          </div>
          
          {/* Exibe opção de tipo apenas quando for código */}
          {inputType === 'codigo' && (
            <div className={styles.checkboxGroup}>
              <label>
                <input
                  type="radio"
                  name="tipoPessoa"
                  value="PF"
                  checked={personType === 'PF'}
                  onChange={handlePersonTypeChange}
                  disabled={loading}
                />
                <span>Pessoa Física</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="tipoPessoa"
                  value="PJ"
                  checked={personType === 'PJ'}
                  onChange={handlePersonTypeChange}
                  disabled={loading}
                />
                <span>Pessoa Jurídica</span>
              </label>
            </div>
          )}
          
          <div className={styles.actionButtons}>
            <button 
              className={styles.searchButton}
              onClick={handleSearch}
              disabled={loading}
            >
              <i className="fas fa-search"></i> Consultar
            </button>
            
            <button 
              className={styles.helpButton}
              title="Ajuda"
              onClick={() => setHelpModalOpen(true)}
              disabled={loading}
            >
              <i className="fas fa-question-circle"></i>
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal de Ajuda */}
      <HelpModal 
        isOpen={helpModalOpen} 
        onClose={() => setHelpModalOpen(false)} 
      />
    </>
  );
};

export default CustomerSearch;
