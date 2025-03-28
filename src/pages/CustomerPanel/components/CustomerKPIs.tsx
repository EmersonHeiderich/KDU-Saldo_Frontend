// src/pages/CustomerPanel/components/CustomerKPIs.tsx

import React from 'react';
// Use frontend interfaces and helpers from service
import { CustomerStatistics, formatCurrency } from '../../../services/customerPanelService';
import styles from '../CustomerPanel.module.css';

interface CustomerKPIsProps {
  statistics: CustomerStatistics; // Expects frontend type
}

// KPICard component remains the same as before
interface KPICardProps {
  title: string;
  value: string | number | null | undefined;
  icon: string;
  color?: string;
  isBad?: boolean; // Highlight potentially negative values
  unit?: string; // Optional unit like 'dias'
  tooltip?: string; // Optional tooltip text
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, isBad, unit, tooltip }) => {
  // Format value, adding unit if provided
  let displayValue = '-';
  if (value !== undefined && value !== null) {
      // Assuming formatCurrency handles currency and formatNumber (if needed) handles others
      if (title.toLowerCase().includes('valor') || title.toLowerCase().includes('total')) {
          displayValue = formatCurrency(value as number); // Assume value is number for currency
      } else {
          displayValue = value.toLocaleString('pt-BR'); // Basic number formatting
      }
      if (unit) {
          displayValue += ` ${unit}`;
      }
  }

  const cardStyle = {
    borderLeft: `4px solid ${color || 'var(--primary-color)'}`,
  };

  const valueStyle = {
    color: isBad ? 'var(--danger-color)' : 'inherit', // Use danger color if 'isBad'
    fontWeight: 600, // Keep value prominent
  };

  return (
    <div className={styles.kpiCard} style={cardStyle} title={tooltip}>
      <div className={styles.kpiIcon} style={color ? { color: color } : {}}>
        <i className={icon}></i>
      </div>
      <div className={styles.kpiContent}>
        <div className={styles.kpiTitle}>{title}</div>
        <div className={styles.kpiValue} style={valueStyle}>{displayValue}</div>
      </div>
    </div>
  );
};


const CustomerKPIs: React.FC<CustomerKPIsProps> = ({ statistics }) => {
  // Determine boolean flags based on frontend statistics structure (camelCase)
  const hasDelayedInstallments = !!statistics.quantidadeParcelasEmAtraso && statistics.quantidadeParcelasEmAtraso > 0;
  const hasAverageDelay = !!statistics.atrasoMedio && statistics.atrasoMedio > 0;

  return (
    <div className={styles.kpiContainer}>
      <KPICard
        title="Valor Total Compras"
        value={statistics.valorTotalCompras} // Use camelCase
        icon="fas fa-shopping-cart"
        color="var(--primary-color)"
        tooltip="Valor total de todas as compras realizadas pelo cliente."
      />

      <KPICard
        title="Atraso Médio"
        value={statistics.atrasoMedio} // Use camelCase
        icon="fas fa-clock" // Changed icon
        color="var(--warning-color)"
        isBad={hasAverageDelay}
        unit="dias"
        tooltip="Média de dias de atraso nos pagamentos."
      />

       <KPICard
        title="Parcelas Atrasadas"
        value={statistics.quantidadeParcelasEmAtraso} // Use camelCase
        icon="fas fa-exclamation-triangle"
        color="var(--danger-color)"
        isBad={hasDelayedInstallments}
        tooltip="Número de parcelas atualmente em atraso."
      />

      <KPICard
        title="Valor em Aberto"
        value={statistics.totalParcelasEmAberto} // Use camelCase
        icon="fas fa-file-invoice-dollar" // Changed icon
        color={ (statistics.totalParcelasEmAberto ?? 0) > 0 ? "var(--info-color)" : "var(--success-color)"} // Use info color if > 0
        tooltip="Valor total das parcelas ainda não pagas (vencidas ou a vencer)."
      />


    </div>
  );
};

export default CustomerKPIs;