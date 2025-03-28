// src/pages/Fiscal/components/FiscalKPIs.tsx

import React from 'react';
// Use frontend interfaces and helpers
import { InvoiceKPIs, formatCurrency, formatNumber } from '../../../services/fiscalService';
import styles from '../Fiscal.module.css'; // Use parent's CSS

interface FiscalKPIsProps {
  kpis: InvoiceKPIs | null;
  isLoading?: boolean; // Optional loading state
}

// Simple KPI card component
interface KPICardProps {
    title: string;
    value: string | number;
    icon: string;
    tooltip?: string;
}
const KPICard: React.FC<KPICardProps> = ({ title, value, icon, tooltip }) => (
    <div className={styles.kpiCard} title={tooltip}>
        <div className={styles.kpiIcon}><i className={icon}></i></div>
        <div className={styles.kpiContent}>
            <div className={styles.kpiTitle}>{title}</div>
            <div className={styles.kpiValue}>{value}</div>
        </div>
    </div>
);


const FiscalKPIsComponent: React.FC<FiscalKPIsProps> = ({ kpis, isLoading = false }) => {

    // Display loading state or placeholders if no KPIs yet
    if (isLoading || !kpis) {
        const placeholderValue = isLoading ? <i className={`fas fa-spinner fa-spin ${styles.kpiLoadingIcon}`}></i> : '-';
        return (
            <div className={styles.kpiContainer}>
                <KPICard title="Notas Listadas" value={placeholderValue} icon="fas fa-hashtag" tooltip="Número de notas fiscais na lista atual" />
                <KPICard title="Valor Total" value={placeholderValue} icon="fas fa-dollar-sign" tooltip="Soma dos valores totais das notas listadas" />
                <KPICard title="Valor Médio" value={placeholderValue} icon="fas fa-balance-scale-right" tooltip="Valor médio das notas listadas" />
                <KPICard title="Qtde. Total Itens" value={placeholderValue} icon="fas fa-boxes" tooltip="Soma das quantidades totais de itens das notas listadas" />
                {/* <KPICard title="Qtde. Média Itens" value={placeholderValue} icon="fas fa-box" tooltip="Quantidade média de itens por nota listada" /> */}
            </div>
        );
    }

    return (
        <div className={styles.kpiContainer}>
            <KPICard
                title="Notas Listadas"
                value={formatNumber(kpis.count)}
                icon="fas fa-hashtag"
                tooltip="Número de notas fiscais na lista atual"
            />
            <KPICard
                title="Valor Total"
                value={formatCurrency(kpis.totalValue)}
                icon="fas fa-dollar-sign"
                tooltip="Soma dos valores totais das notas listadas"
            />
            <KPICard
                title="Valor Médio"
                value={formatCurrency(kpis.averageValue)}
                icon="fas fa-balance-scale-right"
                tooltip="Valor médio das notas listadas"
            />
            <KPICard
                title="Qtde. Total Itens"
                value={formatNumber(kpis.totalQuantity)}
                icon="fas fa-boxes"
                tooltip="Soma das quantidades totais de itens das notas listadas"
            />
            {/* Average quantity might be less useful, can be added back if needed */}
            {/* <KPICard
                title="Qtde. Média Itens"
                value={formatNumber(kpis.averageQuantity, 1)} // Format avg quantity with 1 decimal
                icon="fas fa-box"
                tooltip="Quantidade média de itens por nota listada"
            /> */}
        </div>
    );
};

export default FiscalKPIsComponent;