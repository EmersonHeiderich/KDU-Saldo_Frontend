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

// --- Options for Selects/Checkboxes (Example values - adjust based on actual backend codes) ---
const STATUS_OPTIONS = [
    { value: 1, label: 'Normal' },
    { value: 2, label: 'Devolvido' },
    { value: 3, label: 'Cancelado' },
    { value: 4, label: 'Quebrada' },
];
const DOCUMENT_TYPE_OPTIONS = [
    { value: 1, label: 'Fatura' },
    { value: 2, label: 'Cheque' },
    { value: 3, label: 'Nota Promissória' },
    { value: 4, label: 'Cartão Créd/Déb' }, // Example
    // Add others based on backend
];
const BILLING_TYPE_OPTIONS = [
    { value: 1, label: 'Venda Vista' },
    { value: 2, label: 'Venda Prazo' },
    // Add others based on backend
];
const DISCHARGE_TYPE_OPTIONS = [
    { value: 0, label: 'Não Baixado' },
    { value: 1, label: 'Via Recebimento' },
    { value: 2, label: 'Via Devolução' },
    // Add others based on backend
];
const CHARGE_TYPE_OPTIONS = [
    { value: 0, label: 'Não Cobrança' },
    { value: 1, label: 'Simples' },
    { value: 14, label: 'Cartão' }, // Example
    // Add others based on backend
];
// --- End Options ---


const AdvancedFiltersModal: React.FC<AdvancedFiltersModalProps> = ({
    isOpen,
    onClose,
    initialFilters,
    onApplyFilters,
    onClearAdvancedFilters,
}) => {
    // State for advanced filter fields
    const [branchCodes, setBranchCodes] = useState<string>('');
    const [cpfCnpjList, setCpfCnpjList] = useState<string>('');
    const [receivableCodes, setReceivableCodes] = useState<string>(''); // Added
    const [ourNumbers, setOurNumbers] = useState<string>(''); // Added
    const [startExpiredDate, setStartExpiredDate] = useState<string>('');
    const [endExpiredDate, setEndExpiredDate] = useState<string>('');
    const [startPaymentDate, setStartPaymentDate] = useState<string>(''); // Added
    const [endPaymentDate, setEndPaymentDate] = useState<string>(''); // Added
    const [startCreditDate, setStartCreditDate] = useState<string>(''); // Added
    const [endCreditDate, setEndCreditDate] = useState<string>(''); // Added
    const [statusList, setStatusList] = useState<number[]>([]);
    const [documentTypeList, setDocumentTypeList] = useState<number[]>([]); // Added
    const [billingTypeList, setBillingTypeList] = useState<number[]>([]); // Added
    const [dischargeTypeList, setDischargeTypeList] = useState<number[]>([]); // Added
    const [chargeTypeList, setChargeTypeList] = useState<number[]>([]); // Added
    // Add state for commission filters if needed (text inputs for now)
    // const [commissionedCode, setCommissionedCode] = useState<string>('');
    // const [commissionedCpfCnpj, setCommissionedCpfCnpj] = useState<string>('');

    // Helper to safely initialize state from potentially undefined initial values
    const initializeState = () => {
        setBranchCodes(initialFilters.branchCodeList?.join(',') || '');
        setCpfCnpjList(initialFilters.customerCpfCnpjList?.join(',') || '');
        setStartExpiredDate(initialFilters.startExpiredDate || '');
        setEndExpiredDate(initialFilters.endExpiredDate || '');
        setStatusList(initialFilters.statusList || []);
        // Initialize new states
        // Note: receivableCodeList might conflict with basic documentNumber filter, decide which takes precedence or sync them
        // setReceivableCodes(initialFilters.receivableCodeList?.join(',') || ''); // Or sync with basic filter
        setOurNumbers(''); // Assuming these aren't usually pre-filled
        setDocumentTypeList(initialFilters.documentTypeList || []);
        setBillingTypeList(initialFilters.billingTypeList || []);
        setDischargeTypeList(initialFilters.dischargeTypeList || []);
        setChargeTypeList(initialFilters.chargeTypeList || []);
        setStartPaymentDate(initialFilters.startPaymentDate || '');
        setEndPaymentDate(initialFilters.endPaymentDate || '');
        setStartCreditDate(initialFilters.startCreditDate || '');
        setEndCreditDate(initialFilters.endCreditDate || '');
    };


    // Initialize state when modal opens or initial filters change
    useEffect(() => {
        if (isOpen) {
            initializeState();
        }
    }, [initialFilters, isOpen]); // Rerun if initialFilters change while open

    // Helper function to handle multi-select checkbox changes
    const handleCheckboxListChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<number[]>>
    ) => {
        const { value, checked } = e.target;
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            setter(prev =>
                checked ? [...prev, numValue] : prev.filter(item => item !== numValue)
            );
        }
    };


    const handleApply = () => {
        const advancedFilters: Partial<ReceivableFilters> = {};

        const parseNumericList = (value: string): number[] | null => {
            const list = value.split(',').map(c => parseInt(c.trim(), 10)).filter(n => !isNaN(n));
            return list.length > 0 ? list : null;
        };
        const parseStringList = (value: string): string[] | null => {
            const list = value.split(',').map(c => c.trim()).filter(s => s.length > 0);
            return list.length > 0 ? list : null;
        };

        advancedFilters.branchCodeList = parseNumericList(branchCodes);
        advancedFilters.customerCpfCnpjList = parseStringList(cpfCnpjList);
        // advancedFilters.receivableCodeList = parseNumericList(receivableCodes); // Consider if needed vs basic filter
        // advancedFilters.ourNumberList = parseNumericList(ourNumbers); // Add if backend supports numbers

        if (startExpiredDate) advancedFilters.startExpiredDate = startExpiredDate;
        if (endExpiredDate) advancedFilters.endExpiredDate = endExpiredDate;
        if (startPaymentDate) advancedFilters.startPaymentDate = startPaymentDate;
        if (endPaymentDate) advancedFilters.endPaymentDate = endPaymentDate;
        if (startCreditDate) advancedFilters.startCreditDate = startCreditDate;
        if (endCreditDate) advancedFilters.endCreditDate = endCreditDate;

        if (statusList.length > 0) advancedFilters.statusList = statusList;
        if (documentTypeList.length > 0) advancedFilters.documentTypeList = documentTypeList;
        if (billingTypeList.length > 0) advancedFilters.billingTypeList = billingTypeList;
        if (dischargeTypeList.length > 0) advancedFilters.dischargeTypeList = dischargeTypeList;
        if (chargeTypeList.length > 0) advancedFilters.chargeTypeList = chargeTypeList;

        // Add commission filters if implemented
        // if (commissionedCode.trim()) advancedFilters.commissionedCode = parseInt(commissionedCode.trim(), 10);
        // if (commissionedCpfCnpj.trim()) advancedFilters.commissionedCpfCnpj = commissionedCpfCnpj.trim();

        // Remove null properties before passing
        Object.keys(advancedFilters).forEach(key => {
             if (advancedFilters[key as keyof typeof advancedFilters] === null) {
                 delete advancedFilters[key as keyof typeof advancedFilters];
             }
         });

        onApplyFilters(advancedFilters);
        onClose();
    };

    const handleClear = () => {
        // Clear local state explicitly
        setBranchCodes('');
        setCpfCnpjList('');
        setReceivableCodes('');
        setOurNumbers('');
        setStartExpiredDate('');
        setEndExpiredDate('');
        setStartPaymentDate('');
        setEndPaymentDate('');
        setStartCreditDate('');
        setEndCreditDate('');
        setStatusList([]);
        setDocumentTypeList([]);
        setBillingTypeList([]);
        setDischargeTypeList([]);
        setChargeTypeList([]);
        // Clear commission states...

        // Call parent's clear function for advanced filters in main state
        onClearAdvancedFilters();
        onClose();
    };

    // Helper to render checkbox groups dynamically
    const renderCheckboxGroup = (
        label: string,
        options: { value: number; label: string }[],
        selectedValues: number[],
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    ) => (
        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>{label}</label>
            <div className={styles.checkboxGroupScrollable}> {/* Added scrollable container */}
                {options.map(option => (
                    <label key={option.value} className={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            value={option.value}
                            checked={selectedValues.includes(option.value)}
                            onChange={onChange}
                        />
                        <span>{option.label} ({option.value})</span>
                    </label>
                ))}
            </div>
        </div>
    );


    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Filtros Avançados - Contas a Receber"
            className={styles.advancedFiltersModal}
        >
            <div className={styles.modalFormGrid}>
                {/* --- Row 1 --- */}
                <div className={styles.formGroup}>
                    <label htmlFor="adv-branch-codes">Cód. Filial(is)</label>
                    <input type="text" id="adv-branch-codes" value={branchCodes} onChange={(e) => setBranchCodes(e.target.value)} placeholder="Ex: 1, 2, 10" />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="adv-cpfcnpj">CPF/CNPJ(s) Cliente</label>
                    <input type="text" id="adv-cpfcnpj" value={cpfCnpjList} onChange={(e) => setCpfCnpjList(e.target.value)} placeholder="Lista separada por vírgula" />
                </div>
                {/* <div className={styles.formGroup}>
                    <label htmlFor="adv-receivable-codes">Nº Documento(s)</label>
                    <input type="text" id="adv-receivable-codes" value={receivableCodes} onChange={(e) => setReceivableCodes(e.target.value)} placeholder="Ex: 123, 456"/>
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="adv-our-numbers">Nosso Número(s)</label>
                    <input type="text" id="adv-our-numbers" value={ourNumbers} onChange={(e) => setOurNumbers(e.target.value)} placeholder="Ex: 98765"/>
                </div> */}

                 {/* --- Row 2: Dates --- */}
                 <div className={styles.formGroup}>
                    <label htmlFor="adv-start-expired">Vencimento (Início)</label>
                    <input type="date" id="adv-start-expired" value={startExpiredDate} onChange={(e) => setStartExpiredDate(e.target.value)} max={endExpiredDate || undefined} />
                </div>
                 <div className={styles.formGroup}>
                    <label htmlFor="adv-end-expired">Vencimento (Fim)</label>
                    <input type="date" id="adv-end-expired" value={endExpiredDate} onChange={(e) => setEndExpiredDate(e.target.value)} min={startExpiredDate || undefined} />
                </div>
                 <div className={styles.formGroup}>
                    <label htmlFor="adv-start-payment">Pagamento (Início)</label>
                    <input type="date" id="adv-start-payment" value={startPaymentDate} onChange={(e) => setStartPaymentDate(e.target.value)} max={endPaymentDate || undefined}/>
                </div>
                 <div className={styles.formGroup}>
                    <label htmlFor="adv-end-payment">Pagamento (Fim)</label>
                    <input type="date" id="adv-end-payment" value={endPaymentDate} onChange={(e) => setEndPaymentDate(e.target.value)} min={startPaymentDate || undefined}/>
                </div>
                 {/* <div className={styles.formGroup}>
                    <label htmlFor="adv-start-credit">Crédito (Início)</label>
                    <input type="date" id="adv-start-credit" value={startCreditDate} onChange={(e) => setStartCreditDate(e.target.value)} max={endCreditDate || undefined}/>
                </div>
                 <div className={styles.formGroup}>
                    <label htmlFor="adv-end-credit">Crédito (Fim)</label>
                    <input type="date" id="adv-end-credit" value={endCreditDate} onChange={(e) => setEndCreditDate(e.target.value)} min={startCreditDate || undefined}/>
                </div> */}

                 {/* --- Row 3: Checkbox Groups --- */}
                 {renderCheckboxGroup(
                    "Status do Título",
                    STATUS_OPTIONS,
                    statusList,
                    (e) => handleCheckboxListChange(e, setStatusList)
                 )}

                 {renderCheckboxGroup(
                    "Tipo de Documento",
                    DOCUMENT_TYPE_OPTIONS,
                    documentTypeList,
                    (e) => handleCheckboxListChange(e, setDocumentTypeList)
                 )}

                 {renderCheckboxGroup(
                    "Tipo de Faturamento",
                    BILLING_TYPE_OPTIONS,
                    billingTypeList,
                    (e) => handleCheckboxListChange(e, setBillingTypeList)
                 )}

                 {renderCheckboxGroup(
                     "Tipo de Baixa",
                     DISCHARGE_TYPE_OPTIONS,
                     dischargeTypeList,
                     (e) => handleCheckboxListChange(e, setDischargeTypeList)
                 )}

                 {renderCheckboxGroup(
                     "Tipo de Cobrança",
                     CHARGE_TYPE_OPTIONS,
                     chargeTypeList,
                     (e) => handleCheckboxListChange(e, setChargeTypeList)
                 )}

                {/* Add Commission Filters if needed */}

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