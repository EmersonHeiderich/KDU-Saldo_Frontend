// src/pages/Products/components/DetailsModal.tsx

import React from 'react';
import styles from '../Products.module.css'; // Use parent's CSS
import BaseModal from '../../../components/BaseModal/BaseModal';
// Import the specific *formatted* details type from the service
import { FormattedProductVariantDetails } from '../../../services/productService';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: FormattedProductVariantDetails | null; // Expect the formatted frontend structure
  loading?: boolean;
}

// Helper to format numbers or return '-'
const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR').format(value);
}

const DetailsModal: React.FC<DetailsModalProps> = ({ isOpen, onClose, details, loading = false }) => {
  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhamento do Saldo do SKU"
      className={styles.detailsModalContent}
      showLoading={loading}
      loadingMessage="Carregando detalhes..."
    >
      {!loading && details && (
        <>
          {/* Product Info Section - Use camelCase from FormattedProductVariantDetails */}
          <h4>
              <i className="fas fa-tag"></i> Produto
          </h4>
          <div className={`${styles.detailSection} ${styles.grid}`}>
              <p><strong>Referência:</strong> {details.product.reference_code}</p>
              <p><strong>Nome:</strong> {details.product.name}</p>
              <p><strong>Cor:</strong> {details.product.color.name} ({details.product.color.code})</p>
              <p><strong>Tamanho:</strong> {details.product.size}</p>
              <p><strong>SKU:</strong> {details.product.sku}</p>
              <p><strong>Cód. Interno:</strong> {details.product.code}</p>
          </div>

          <hr className={styles.detailSeparator} />

          {/* Balance Details Section - Use camelCase */}
          <h4>
              <i className="fas fa-boxes"></i> Detalhes do Saldo ({details.balance_details.stock_type_description})
          </h4>
          <div className={`${styles.detailSection} ${styles.grid}`}>
              <p><strong>Estoque Físico:</strong> {formatValue(details.balance_details.physical_stock)}</p>
              <p><strong>Pedidos de Venda:</strong> {formatValue(details.balance_details.sales_orders)}</p>
              <p><strong>Entradas (Trânsito):</strong> {formatValue(details.balance_details.input_transactions)}</p>
              <p><strong>Saídas (Trânsito):</strong> {formatValue(details.balance_details.output_transactions)}</p>
              <p><strong>OPs em Andamento:</strong> {formatValue(details.balance_details.production_in_progress)}</p>
              <p><strong>OPs Aguardando Lib.:</strong> {formatValue(details.balance_details.production_awaiting_release)}</p>
              {/* Optional fields */}
              {details.balance_details.temp_stock !== undefined && <p><strong>Estoque Temp.:</strong> {formatValue(details.balance_details.temp_stock)}</p>}
              {details.balance_details.purchase_orders !== undefined && <p><strong>Pedidos Compra:</strong> {formatValue(details.balance_details.purchase_orders)}</p>}
              {details.balance_details.production_planning !== undefined && <p><strong>Planej. Produção:</strong> {formatValue(details.balance_details.production_planning)}</p>}
              <p><strong>Filial:</strong> {details.balance_details.branch_code}</p>
          </div>

          <hr className={styles.detailSeparator} />

          {/* Calculated Balances Section - Use camelCase */}
          <h4>
              <i className="fas fa-calculator"></i> Saldos Calculados
          </h4>
          <div className={`${styles.detailSection} ${styles.grid}`}>
              <p><strong>Saldo Base:</strong> {formatValue(details.calculated_balances.base)}</p>
              <p><strong>Disponível p/ Venda:</strong> {formatValue(details.calculated_balances.sales_available)}</p>
              <p><strong>Disponível c/ Produção:</strong> {formatValue(details.calculated_balances.production_available)}</p>
          </div>
        </>
      )}
    </BaseModal>
  );
};

export default DetailsModal;