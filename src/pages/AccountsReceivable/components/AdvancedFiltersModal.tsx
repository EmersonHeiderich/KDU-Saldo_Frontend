// src/pages/AccountsReceivable/components/AdvancedFiltersModal.tsx
import React, { useState, useEffect } from 'react';
import BaseModal from '../../../components/BaseModal/BaseModal';
import styles from '../AccountsReceivable.module.css'; // Use parent styles
import { ReceivableFilters } from '../../../services/accountsReceivableService';

interface AdvancedFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFilters: ReceivableFilters; // Receive the full filter state
    onApplyFilters: (advancedFilters: Partial<ReceivableFilters>) => void;
    onClearAdvancedFilters: () => void;
}

// Define options for dropdowns/multi-selects based on backend spec
const STATUS_OPTIONS = [
    { value: 1, label: 'Normal' },
    { value: 2, label: 'Devolvido' },
    { value: 3, label: 'Cancelado' },
    { value: 4, label: 'Quebrada' },
    // Add others if needed
];

const DOCUMENT_TYPE_OPTIONS = [
    { value: 1, label: 'Fatura' },
    { value: 2, label: 'Cheque' },
    { value: 3, label: 'Nota Promissória' },
    // Add others
];

const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = ({
    isOpen,
    onClose,
    initialFilters,
    onApplyFilters,
    onClearAdvancedFilters,
}) => {
    // State for advanced filter fields only
    // Initialize with values from the parent's filter state
    const [branchCodes, setBranchCodes] = useState<string>(initialFilters.branchCodeList?.join(',') || '');
    const [cpfCnpjList, setCpfCnpjList] = useState<string>(initialFilters.customerCpfCnpjList?.join(',') || '');
    const [startExpiredDate, setStartExpiredDate] = useState<string>(initialFilters.startExpiredDate || '');
    const [endExpiredDate, setEndExpiredDate] = useState<string>(initialFilters.endExpiredDate || '');
    const [statusList, setStatusList] = useState<number[]>(initialFilters.statusList || []);
    // Add state for other advanced filters...

    // Reset local state when initialFilters change (e.g., parent clears all)
    useEffect(() => {
        if (isOpen) {
            setBranchCodes(initialFilters.branchCodeList?.join(',') || '');
            setCpfCnpjList(initialFilters.customerCpfCnpjList?.join(',') || '');
            setStartExpiredDate(initialFilters.startExpiredDate || '');
            setEndExpiredDate(initialFilters.endExpiredDate || '');
            setStatusList(initialFilters.statusList || []);
            // Reset other states...
        }
    }, [initialFilters, isOpen]);


    const handleApply = () => {
        // Process local state into the Partial<ReceivableFilters> format
        const advancedFilters: Partial<ReceivableFilters> = {};

        const branches = branchCodes.split(',').map(c => parseInt(c.trim(), 10)).filter(n => !isNaN(n));
        if (branches.length > 0) advancedFilters.branchCodeList = branches;

        const cpfCnpjs = cpfCnpjList.split(',').map(c => c.trim()).filter(s => s.length > 0);
        if (cpfCnpjs.length > 0) advancedFilters.customerCpfCnpjList = cpfCnpjs;

        if (startExpiredDate) advancedFilters.startExpiredDate = startExpiredDate;
        if (endExpiredDate) advancedFilters.endExpiredDate = endExpiredDate;
        if (statusList.length > 0) advancedFilters.statusList = statusList;
        // Process other filters...

        onApplyFilters(advancedFilters);
        onClose();
    };

    const handleClear = () => {
        // Clear local state
        setBranchCodes('');
        setCpfCnpjList('');
        setStartExpiredDate('');
        setEndExpiredDate('');
        setStatusList([]);
        // Clear other states...

        // Call parent's clear function specifically for advanced filters
        onClearAdvancedFilters();
        onClose(); // Close after clearing
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        const statusValue = parseInt(value, 10);
        setStatusList(prev =>
            checked ? [...prev, statusValue] : prev.filter(status => status !== statusValue)
        );
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Filtros Avançados - Contas a Receber"
            className={styles.advancedFiltersModal} // Add specific class if needed
        >
            <div className={styles.modalFormGrid}>
                {/* Branch Codes */}
                <div className={styles.formGroup}>
                    <label htmlFor="adv-branch-codes">Código(s) Filial</label>
                    <input
                        type="text"
                        id="adv-branch-codes"
                        value={branchCodes}
                        onChange={(e) => setBranchCodes(e.target.value)}
                        placeholder="Ex: 1, 2, 10"
                    />
                </div>

                {/* CPF/CNPJ List */}
                <div className={styles.formGroup}>
                    <label htmlFor="adv-cpfcnpj">CPF/CNPJ(s)</label>
                    <input
                        type="text"
                        id="adv-cpfcnpj"
                        value={cpfCnpjList}
                        onChange={(e) => setCpfCnpjList(e.target.value)}
                        placeholder="Lista separada por vírgula"
                    />
                </div>

                 {/* Expired Date Range */}
                 <div className={styles.formGroup}>
                    <label htmlFor="adv-start-expired">Vencimento (Início)</label>
                    <input
                        type="date"
                        id="adv-start-expired"
                        value={startExpiredDate}
                        onChange={(e) => setStartExpiredDate(e.target.value)}
                        max={endExpiredDate || undefined}
                    />
                </div>
                 <div className={styles.formGroup}>
                    <label htmlFor="adv-end-expired">Vencimento (Fim)</label>
                    <input
                        type="date"
                        id="adv-end-expired"
                        value={endExpiredDate}
                        onChange={(e) => setEndExpiredDate(e.target.value)}
                        min={startExpiredDate || undefined}
                    />
                </div>

                 {/* Status List - Checkbox Group Example */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}> {/* Span across grid if needed */}
                    <label>Status do Título</label>
                    <div className={styles.checkboxGroup}>
                        {STATUS_OPTIONS.map(option => (
                            <label key={option.value} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    value={option.value}
                                    checked={statusList.includes(option.value)}
                                    onChange={handleStatusChange}
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* --- ADD OTHER ADVANCED FILTER FIELDS HERE --- */}
                {/* Examples: documentTypeList, billingTypeList, etc. */}
                {/* Use appropriate input types (text, select, checkbox group) */}

            </div>

            <div className={styles.modalFooter}>
                 <button type="button" className="btn secondary" onClick={handleClear}>
                    Limpar Avançados
                </button>
                <button type="button" className="btn secondary" onClick={onClose}>
                    Cancelar
                </button>
                <button type="button" className="btn primary" onClick={handleApply}>
                    Aplicar Filtros
                </button>
            </div>
        </BaseModal>
    );
};

export default AdvancedFiltersModal;