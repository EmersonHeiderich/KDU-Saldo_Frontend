// src/pages/AccountsReceivable/components/AccountsReceivableFilters.tsx
import React from 'react';
import styles from '../AccountsReceivable.module.css'; // Use parent styles
import { ReceivableFilters } from '../../../services/accountsReceivableService';

interface AccountsReceivableFiltersProps {
    filters: ReceivableFilters;
    onFilterChange: (field: keyof ReceivableFilters, value: any) => void;
    onSearch: () => void;
    onClear: () => void;
    onOpenAdvancedFilters: () => void; // Callback to open the modal
    isLoading: boolean;
    appliedAdvancedFilterCount: number; // To show an indicator on the button
}

const AccountsReceivableFiltersComponent: React.FC<AccountsReceivableFiltersProps> = ({
    filters,
    onFilterChange,
    onSearch,
    onClear,
    onOpenAdvancedFilters,
    isLoading,
    appliedAdvancedFilterCount
}) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let processedValue: any = value;

        if (name === 'hasOpenInvoices') {
            processedValue = value === 'all' ? null : value === 'true';
        }

        onFilterChange(name as keyof ReceivableFilters, processedValue);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isLoading) {
            onSearch();
        }
    };

    return (
        <div className={styles.filtersContainer}>
            <div className={styles.filterRow}>
                {/* Basic Filters */}
                <div className={styles.filterGroup}>
                    <label htmlFor="customer-code-filter">Cód. Cliente(s)</label>
                    <input
                        type="text"
                        id="customer-code-filter"
                        name="customerCode" // Use name attribute for handler
                        value={filters.customerCode || ''}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        placeholder="Ex: 123, 456"
                        disabled={isLoading}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label htmlFor="doc-num-filter">Nº Documento(s)</label>
                    <input
                        type="text"
                        id="doc-num-filter"
                        name="documentNumber" // Use name attribute
                        value={filters.documentNumber || ''}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        placeholder="Ex: 987, 654"
                        disabled={isLoading}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label htmlFor="start-date-filter">Emissão (Início)</label>
                    <input
                        type="date"
                        id="start-date-filter"
                        name="startDate" // Use name attribute
                        value={filters.startDate || ''}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        max={filters.endDate || undefined}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label htmlFor="end-date-filter">Emissão (Fim)</label>
                    <input
                        type="date"
                        id="end-date-filter"
                        name="endDate" // Use name attribute
                        value={filters.endDate || ''}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        min={filters.startDate || undefined}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label htmlFor="open-invoices-filter">Situação</label>
                    <select
                        id="open-invoices-filter"
                        name="hasOpenInvoices" // Use name attribute
                        value={filters.hasOpenInvoices === null ? 'all' : String(filters.hasOpenInvoices)}
                        onChange={handleInputChange}
                        disabled={isLoading}
                    >
                        <option value="all">Todos</option>
                        <option value="true">Em Aberto</option>
                        <option value="false">Liquidados</option>
                    </select>
                </div>
            </div>

            {/* Filter Actions */}
            <div className={styles.filterActions}>
                <button
                    className="btn secondary small"
                    onClick={onClear}
                    disabled={isLoading}
                    title="Limpar todos os filtros (básicos e avançados) e recarregar"
                >
                    <i className="fas fa-eraser"></i> Limpar Tudo
                </button>
                <button
                    className="btn info small" // Changed color to info
                    onClick={onOpenAdvancedFilters}
                    disabled={isLoading}
                    title="Abrir filtros avançados"
                >
                    <i className="fas fa-filter"></i> Filtros Avançados
                    {appliedAdvancedFilterCount > 0 && (
                        <span className={styles.filterCountBadge}>{appliedAdvancedFilterCount}</span>
                    )}
                </button>
                <button
                    className="btn primary"
                    onClick={onSearch}
                    disabled={isLoading}
                >
                    {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>} Pesquisar
                </button>
            </div>
        </div>
    );
};

export default AccountsReceivableFiltersComponent;