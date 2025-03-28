// src/pages/CustomerPanel/components/CustomerStatistics.tsx

import React from 'react';
// Use frontend interfaces and helpers from service
import { CustomerStatistics as CustomerStatsType, formatCurrency, formatDate } from '../../../services/customerPanelService';
import styles from '../CustomerPanel.module.css';

interface CustomerStatisticsProps {
  statistics: CustomerStatsType; // Expects frontend type
}

// Helper component for rendering a statistic item
interface StatItemProps {
    label: string;
    value: string | number | null | undefined;
    isBad?: boolean;
    isCurrency?: boolean;
    isDate?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, isBad, isCurrency, isDate }) => {
    let displayValue: string = '-';
    if (value !== null && value !== undefined) {
        if (isCurrency) {
            displayValue = formatCurrency(value as number);
        } else if (isDate) {
            displayValue = formatDate(value as string);
        } else {
            displayValue = value.toLocaleString('pt-BR'); // Default formatting for numbers/strings
        }
    }

    const valueStyle = {
        color: isBad ? 'var(--danger-color)' : 'inherit',
    };

    return (
        <div className={styles.infoItem}>
            <div className={styles.label}>{label}:</div>
            <div className={styles.value} style={valueStyle}>{displayValue}</div>
        </div>
    );
};


const CustomerStatisticsComponent: React.FC<CustomerStatisticsProps> = ({ statistics }) => {
    // Determine boolean flags based on frontend statistics structure (camelCase)
    const hasDelayedInstallmentsValue = !!statistics.totalParcelasEmAtraso && statistics.totalParcelasEmAtraso > 0;
    const hasDelayedInstallmentsCount = !!statistics.quantidadeParcelasEmAtraso && statistics.quantidadeParcelasEmAtraso > 0;
    const hasAverageDelay = !!statistics.atrasoMedio && statistics.atrasoMedio > 0;
    const hasMaxDelay = !!statistics.atrasoMaximo && statistics.atrasoMaximo > 0;
    const hasAverageInstallmentDelay = !!statistics.mediaAtrasoParcelas && statistics.mediaAtrasoParcelas > 0;

  return (
    <div className={styles.statisticsContainer}> {/* Use a specific container class */}

      {/* Purchase Section */}
      <div className={styles.infoSection}>
        <h3><i className="fas fa-shopping-bag"></i> Compras</h3>
        <div className={styles.infoGrid}>
          <StatItem label="Qtde. Compras" value={statistics.quantidadeCompras} />
          <StatItem label="Valor Total" value={statistics.valorTotalCompras} isCurrency />
          <StatItem label="Valor Médio" value={statistics.valorMedioCompras} isCurrency />
          <StatItem label="Data 1ª Compra" value={statistics.dataPrimeiraCompra} isDate />
          <StatItem label="Valor 1ª Compra" value={statistics.valorPrimeiraCompra} isCurrency />
          <StatItem label="Data Últ. Compra" value={statistics.dataUltimaCompra} isDate />
          <StatItem label="Valor Últ. Compra" value={statistics.valorUltimaCompra} isCurrency />
          <StatItem label="Data Maior Compra" value={statistics.dataMaiorCompra} isDate />
          <StatItem label="Valor Maior Compra" value={statistics.valorMaiorCompra} isCurrency />
        </div>
      </div>

      {/* Paid Installments Section */}
      <div className={styles.infoSection}>
        <h3><i className="fas fa-check-circle"></i> Parcelas Pagas</h3>
        <div className={styles.infoGrid}>
          <StatItem label="Valor Total Pago" value={statistics.totalParcelasPagas} isCurrency />
          <StatItem label="Qtde. Parcelas Pagas" value={statistics.quantidadeParcelasPagas} />
          <StatItem label="Valor Médio Pago" value={statistics.valorMedioParcelasPagas} isCurrency />
          <StatItem label="Valor Últ. Fatura Paga" value={statistics.valorUltimaFaturaPaga} isCurrency />
          <StatItem label="Data Últ. Fatura Paga" value={statistics.dataUltimaFaturaPaga} isDate />
        </div>
      </div>

      {/* Open Installments Section */}
      <div className={styles.infoSection}>
        <h3><i className="fas fa-folder-open"></i> Parcelas em Aberto</h3>
        <div className={styles.infoGrid}>
          <StatItem label="Valor Total Aberto" value={statistics.totalParcelasEmAberto} isCurrency />
          <StatItem label="Qtde. Parcelas Abertas" value={statistics.quantidadeParcelasEmAberto} />
          <StatItem label="Valor Médio Aberto" value={statistics.valorMedioParcelasEmAberto} isCurrency />
        </div>
      </div>

      {/* Delays Section */}
      <div className={styles.infoSection}>
        <h3><i className="fas fa-exclamation-triangle"></i> Atrasos</h3>
        <div className={styles.infoGrid}>
          <StatItem label="Atraso Médio (dias)" value={statistics.atrasoMedio} isBad={hasAverageDelay} />
          <StatItem label="Atraso Máximo (dias)" value={statistics.atrasoMaximo} isBad={hasMaxDelay} />
          <StatItem label="Valor Total Atrasado" value={statistics.totalParcelasEmAtraso} isCurrency isBad={hasDelayedInstallmentsValue} />
          <StatItem label="Qtde. Parcelas Atrasadas" value={statistics.quantidadeParcelasEmAtraso} isBad={hasDelayedInstallmentsCount} />
          <StatItem label="Média Atraso Parcelas (dias)" value={statistics.mediaAtrasoParcelas} isBad={hasAverageInstallmentDelay} />
        </div>
      </div>
    </div>
  );
};

export default CustomerStatisticsComponent;