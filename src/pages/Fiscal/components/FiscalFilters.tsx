// src/pages/Fiscal/components/FiscalFilters.tsx

import React, { useState, useEffect, ChangeEvent } from 'react';
// Use frontend interfaces and helpers
import { InvoiceFilters, STATUS_OPTIONS } from '../../../services/fiscalService';
import styles from '../Fiscal.module.css'; // Use parent's CSS

interface FiscalFiltersProps {
    initialFilters?: Partial<InvoiceFilters>; // Filters possibly passed from parent (e.g., customer)
    onSearch: (filters: InvoiceFilters) => void;
    onClear: () => void;
    isLoading: boolean;
    disableCustomerFilter?: boolean; // New prop to disable customer input
}

const FiscalFiltersComponent: React.FC<FiscalFiltersProps> = ({
    initialFilters = {},
    onSearch,
    onClear,
    isLoading,
    disableCustomerFilter = false,
}) => {
    // State for each filter input
    const [customer, setCustomer] = useState<string>(initialFilters.customer || '');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(initialFilters.status || []);
    const [invoiceNumber, setInvoiceNumber] = useState<string>(initialFilters.invoiceNumber || '');
    const [startDate, setStartDate] = useState<string>(initialFilters.startDate || '');
    const [endDate, setEndDate] = useState<string>(initialFilters.endDate || '');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    // Update state if initial filters change (e.g., navigating back)
    useEffect(() => {
        setCustomer(initialFilters.customer || '');
        setSelectedStatuses(initialFilters.status || []);
        setInvoiceNumber(initialFilters.invoiceNumber || '');
        setStartDate(initialFilters.startDate || '');
        setEndDate(initialFilters.endDate || '');
    }, [initialFilters]);


    const handleCustomerChange = (e: ChangeEvent<HTMLInputElement>) => {
        // Basic formatting/cleaning might be needed here if not handled by backend
        setCustomer(e.target.value);
    };

    const handleStatusChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setSelectedStatuses(prev =>
            checked ? [...prev, value] : prev.filter(status => status !== value)
        );
    };

    const handleInvoiceNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInvoiceNumber(e.target.value);
    };

    const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setStartDate(e.target.value);
        // Optional: Ensure end date is not before start date
        if (endDate && e.target.value > endDate) {
            setEndDate(e.target.value);
        }
    };

    const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEndDate(e.target.value);
        // Optional: Ensure start date is not after end date
        if (startDate && e.target.value < startDate) {
            setStartDate(e.target.value);
        }
    };

    const handleClearFilters = () => {
        // Only clear fields that are NOT disabled
        if (!disableCustomerFilter) setCustomer('');
        setSelectedStatuses([]);
        setInvoiceNumber('');
        setStartDate('');
        setEndDate('');
        onClear(); // Call parent's clear function (which likely triggers a default search)
    };

    const handleSearchClick = () => {
        const filters: InvoiceFilters = {
            customer: disableCustomerFilter ? initialFilters.customer : (customer || null), // Keep initial if disabled
            status: selectedStatuses.length > 0 ? selectedStatuses : null,
            invoiceNumber: invoiceNumber || null,
            startDate: startDate || null,
            endDate: endDate || null,
        };
        onSearch(filters);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSearchClick();
        }
    };

    const getStatusDisplay = () => {
        if (selectedStatuses.length === 0) return "Todos";
        if (selectedStatuses.length === 1) {
            const option = STATUS_OPTIONS.find(opt => opt.value === selectedStatuses[0]);
            return option?.label || selectedStatuses[0];
        }
        return `${selectedStatuses.length} selecionados`;
    };

    return (
        <div className={styles.filtersContainer}>
            <div className={styles.filterRow}>
                {/* Customer Filter */}
                <div className={`${styles.filterGroup} ${styles.customerFilter}`}>
                    <label htmlFor="customer-filter">Cliente (Código/CPF/CNPJ)</label>
                    <input
                        type="text"
                        id="customer-filter"
                        value={customer}
                        onChange={handleCustomerChange}
                        placeholder="Código(s), CPF(s) ou CNPJ(s)"
                        disabled={isLoading || disableCustomerFilter}
                        onKeyDown={handleKeyPress}
                        title={disableCustomerFilter ? "Filtro de cliente definido pela navegação." : "Digite códigos, CPFs ou CNPJs separados por vírgula"}
                    />
                </div>

                {/* Status Filter - Dropdown style */}
                <div className={`${styles.filterGroup} ${styles.statusFilter}`}>
                    <label htmlFor="status-filter-btn">Status NF-e</label>
                    <div className={styles.dropdownContainer}>
                        <button
                            id="status-filter-btn"
                            className={styles.dropdownButton}
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            disabled={isLoading}
                            type="button"
                        >
                            <span>{getStatusDisplay()}</span>
                            <i className={`fas fa-chevron-down ${showStatusDropdown ? styles.open : ''}`}></i>
                        </button>
                        {showStatusDropdown && (
                            <div className={styles.dropdownMenu}>
                                {STATUS_OPTIONS.map(option => (
                                    <label key={option.value}>
                                        <input
                                            type="checkbox"
                                            value={option.value}
                                            checked={selectedStatuses.includes(option.value)}
                                            onChange={handleStatusChange}
                                        />
                                        {option.label}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                 {/* Invoice Number Filter */}
                <div className={`${styles.filterGroup} ${styles.invoiceNumberFilter}`}>
                    <label htmlFor="invoice-number-filter">Número(s) NF-e</label>
                    <input
                        type="text"
                        id="invoice-number-filter"
                        value={invoiceNumber}
                        onChange={handleInvoiceNumberChange}
                        placeholder="Ex: 123, 456 ou 100-200"
                        disabled={isLoading}
                        onKeyDown={handleKeyPress}
                    />
                </div>


                {/* Date Filters */}
                <div className={`${styles.filterGroup} ${styles.dateFilter}`}>
                    <label htmlFor="start-date-filter">Data Emissão (Início)</label>
                    <input
                        type="date"
                        id="start-date-filter"
                        value={startDate}
                        onChange={handleStartDateChange}
                        disabled={isLoading}
                        max={endDate || undefined} // Prevent start date after end date
                    />
                </div>
                 <div className={`${styles.filterGroup} ${styles.dateFilter}`}>
                    <label htmlFor="end-date-filter">Data Emissão (Fim)</label>
                    <input
                        type="date"
                        id="end-date-filter"
                        value={endDate}
                        onChange={handleEndDateChange}
                        disabled={isLoading}
                        min={startDate || undefined} // Prevent end date before start date
                    />
                </div>
            </div>

             {/* Action Buttons */}
            <div className={styles.filterActions}>
                <button
                    className="btn secondary small" // Smaller button
                    onClick={handleClearFilters}
                    disabled={isLoading}
                    title="Limpar todos os filtros aplicados"
                >
                    <i className="fas fa-eraser"></i> Limpar Filtros
                </button>
                <button
                    className="btn primary"
                    onClick={handleSearchClick}
                    disabled={isLoading}
                >
                    {isLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
                    Pesquisar
                </button>
            </div>

        </div>
    );
};

export default FiscalFiltersComponent;