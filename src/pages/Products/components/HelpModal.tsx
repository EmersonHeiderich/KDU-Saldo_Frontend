import React from 'react';
import styles from '../Products.module.css';
import BaseModal from '../../../components/BaseModal/BaseModal';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajuda - Consulta de Produtos"
      className={styles.helpModal}
    >
      <h4>Como Usar</h4>
      <ol>
        <li>Digite o código de referência do produto (ex: 1010)</li>
        <li>Selecione o modo de cálculo desejado</li>
        <li>Clique em "Consultar"</li>
        <li>Clique em qualquer célula para ver detalhes do saldo</li>
      </ol>

      <h4>Modos de Cálculo</h4>
      <ul>
        <li><strong>Saldo Base:</strong> Estoque + Entradas - Saídas</li>
        <li><strong>Considerar Vendas:</strong> Saldo Base - Pedidos de Venda</li>
        <li><strong>Considerar Vendas + Produção:</strong> Saldo Base - Pedidos de Venda + Produção (Andamento + Aguardando)</li>
      </ul>

      <h4>Observações</h4>
      <ul>
        <li>Clique no ícone de nota para adicionar ou visualizar observações sobre o produto</li>
        <li>Um indicador vermelho aparecerá no ícone quando houver observações não resolvidas</li>
      </ul>

      <h4>Atalhos de Teclado</h4>
      <ul>
        <li><strong>Enter:</strong> Realizar consulta quando o campo referência está em foco</li>
        <li><strong>ESC:</strong> Fechar janela de detalhes, observações ou ajuda</li>
      </ul>
    </BaseModal>
  );
};

export default HelpModal;
