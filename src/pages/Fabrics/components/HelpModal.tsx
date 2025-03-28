// src/pages/Fabrics/components/HelpModal.tsx

import React from 'react';
import styles from '../Fabrics.module.css'; // Use parent's styles
import BaseModal from '../../../components/BaseModal/BaseModal'; // Correct path

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajuda - Consulta de Tecidos"
      // className={styles.helpModalContent} // Optional specific class
    >
      <div>
        <h4>Como Usar</h4>
        <ol>
          <li>
            Clique em <strong>"Consultar Tecidos"</strong> para carregar a lista inicial (pode levar um momento).
          </li>
          <li>
            Use o campo <strong>"Filtrar Descrição/Código"</strong> para refinar a lista exibida (filtragem local).
          </li>
          <li>
            Pressione <strong>Enter</strong> no campo de filtro ou clique em <strong>"Atualizar Lista"</strong> para buscar novamente do servidor (útil se os dados mudaram).
          </li>
          <li>
            Clique nos <strong>cabeçalhos</strong> da tabela (Código, Descrição, Saldo, etc.) para ordenar os dados.
          </li>
           <li>
             Clique no botão <i className="fas fa-file-csv"></i> para <strong>exportar</strong> a lista atualmente exibida para um arquivo CSV.
           </li>
        </ol>

        <h4>Cores dos Saldos</h4>
        <ul>
          <li>
            <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>Verde:</span> Saldo suficiente (10 ou mais unidades).
          </li>
          <li>
            <span style={{ color: 'var(--warning-color)', fontWeight: 'bold' }}>Amarelo:</span> Saldo baixo (entre 1 e 9 unidades).
          </li>
          <li>
            <span style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>Vermelho:</span> Sem saldo (0 ou negativo).
          </li>
        </ul>

        <h4>Colunas da Tabela</h4>
        <ul>
            <li><strong>Código:</strong> Código interno do tecido no ERP.</li>
            <li><strong>Descrição:</strong> Nome/descrição do tecido.</li>
            <li><strong>R$ Custo:</strong> Custo unitário de reposição (ou principal) do tecido.</li>
            <li><strong>Saldo:</strong> Saldo físico atual em estoque.</li>
            <li><strong>Larg. (m):</strong> Largura útil do tecido em metros.</li>
            <li><strong>Gram. (g/m²):</strong> Gramatura do tecido (peso por metro quadrado).</li>
            <li><strong>Enc. (%):</strong> Percentual de encolhimento esperado do tecido.</li>
        </ul>

        <h4>Atalhos</h4>
        <ul>
          <li>
            <strong>ESC:</strong> Fecha esta janela de ajuda.
          </li>
          <li>
            <strong>Enter</strong> (no campo filtro)<strong>:</strong> Atualiza a lista buscando do servidor.
          </li>
        </ul>
      </div>
       {/* Optional Footer */}
       {/* <div className={styles.modalFooter}>
           <button className="btn secondary" onClick={onClose}>Fechar</button>
       </div> */}
    </BaseModal>
  );
};

export default HelpModal;