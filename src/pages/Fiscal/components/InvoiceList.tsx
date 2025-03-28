// src/pages/Fiscal/components/InvoiceList.tsx

import React from 'react';
// Use frontend interfaces and helpers
import { Invoice, formatDate, formatCurrency, formatNumber } from '../../../services/fiscalService';
import styles from '../Fiscal.module.css'; // Use parent's CSS

type SortField = keyof Invoice | null;
type SortDirection = 'asc' | 'desc';

interface InvoiceListProps {
    invoices: Invoice[];
    isLoading: boolean;
    error: string | null;
    sortField: SortField;
    sortDirection: SortDirection;
    onSort: (field: keyof Invoice) => void;
    onCopyKey: (accessKey: string) => void;
    onGenerateDanfe: (accessKey: string) => void;
    onViewDetails: (invoice: Invoice) => void; // Pass the full invoice object
}

const InvoiceListComponent: React.FC<InvoiceListProps> = ({
    invoices,
    isLoading,
    error,
    sortField,
    sortDirection,
    onSort,
    onCopyKey,
    onGenerateDanfe,
    onViewDetails,
}) => {

    const renderSortIcon = (field: keyof Invoice) => {
        if (field !== sortField) {
          return <i className={`fas fa-sort ${styles.sortIconNeutral}`}></i>;
        }
        return sortDirection === 'asc'
          ? <i className={`fas fa-sort-up ${styles.sortIconActive}`}></i>
          : <i className={`fas fa-sort-down ${styles.sortIconActive}`}></i>;
    };

    const renderTableHeader = () => {
        const headers: { key: keyof Invoice; label: string; sortable?: boolean, numeric?: boolean }[] = [
          { key: 'status', label: 'Status', sortable: true },
          { key: 'destinatario', label: 'Destinatário', sortable: true },
          { key: 'pedidoVenda', label: 'Pedido Venda', sortable: true, numeric: true },
          { key: 'numeroNota', label: 'Número NF', sortable: true, numeric: true },
          { key: 'serieNota', label: 'Série', sortable: true, numeric: true },
          { key: 'dataEmissao', label: 'Emissão', sortable: true },
          { key: 'valorTotal', label: 'Valor Total', sortable: true, numeric: true },
          { key: 'quantidadeTotal', label: 'Qtde. Itens', sortable: true, numeric: true },
          { key: 'operacao', label: 'Operação', sortable: true },
          { key: 'transportadora', label: 'Transportadora', sortable: true },
          { key: 'chaveAcesso', label: 'Ações', sortable: false } // Use chaveAcesso key conceptually for actions column
        ];

        return (
          <thead>
            <tr>
              {headers.map(header => (
                <th
                  key={header.key}
                  onClick={() => header.sortable && onSort(header.key)}
                  className={`
                    ${styles.tableHeader}
                    ${header.sortable ? styles.sortableHeader : ''}
                    ${header.numeric ? styles.numericHeader : ''}
                  `}
                  title={header.sortable ? `Ordenar por ${header.label}` : undefined}
                >
                  <span>{header.label}</span>
                  {header.sortable && renderSortIcon(header.key)}
                </th>
              ))}
            </tr>
          </thead>
        );
    };

    const getStatusClassName = (status: string | null): string => {
        switch (status?.toLowerCase()) {
            case 'authorized': return styles.statusAuthorized;
            case 'canceled': return styles.statusCanceled;
            case 'denied': return styles.statusDenied;
            case 'rejected': return styles.statusRejected;
            case 'sent': return styles.statusSent;
            case 'generated': return styles.statusGenerated;
            default: return styles.statusUnknown;
        }
    };

    const renderTableRows = () => {
        if (isLoading) {
          return (
            <tr>
              <td colSpan={11} className={styles.loadingRow}> {/* Adjust colspan */}
                <div className={styles.spinnerSmall}></div>
                <span>Carregando notas fiscais...</span>
              </td>
            </tr>
          );
        }

        if (error) {
          return (
            <tr>
              <td colSpan={11} className={styles.errorRow}>
                <i className="fas fa-exclamation-triangle"></i>
                <span>{error}</span>
              </td>
            </tr>
          );
        }

        if (invoices.length === 0) {
          return (
            <tr>
              <td colSpan={11} className={styles.emptyRow}>
                <i className="fas fa-file-alt"></i>
                <span>Nenhuma nota fiscal encontrada para os filtros aplicados.</span>
              </td>
            </tr>
          );
        }

        return invoices.map((invoice, index) => (
            <tr key={`${invoice.numeroNota}-${invoice.serieNota}-${index}`}> {/* More robust key */}
                <td>
                    <span className={`${styles.statusBadge} ${getStatusClassName(invoice.status)}`}>
                        {invoice.status || 'N/A'}
                    </span>
                </td>
                <td title={invoice.destinatario || ''} className={styles.textCell}>{invoice.destinatario || '-'}</td>
                <td className={styles.numericCell}>{invoice.pedidoVenda || '-'}</td>
                <td className={styles.numericCell}>{invoice.numeroNota || '-'}</td>
                <td className={styles.numericCell}>{invoice.serieNota || '-'}</td>
                <td className={styles.dateCell}>{formatDate(invoice.dataEmissao)}</td>
                <td className={`${styles.numericCell} ${styles.currencyCell}`}>{formatCurrency(invoice.valorTotal)}</td>
                <td className={styles.numericCell}>{formatNumber(invoice.quantidadeTotal)}</td>
                <td title={invoice.operacao || ''} className={styles.textCell}>{invoice.operacao || '-'}</td>
                <td title={invoice.transportadora || ''} className={styles.textCell}>{invoice.transportadora || '-'}</td>
                <td className={styles.actionsCell}>
                    {invoice.chaveAcesso && ( // Only show actions if access key exists
                        <>
                            <button
                                className={`${styles.actionButton} ${styles.copyButton}`}
                                onClick={() => onCopyKey(invoice.chaveAcesso!)}
                                title="Copiar Chave de Acesso"
                            >
                                <i className="fas fa-key"></i>
                            </button>
                            <button
                                className={`${styles.actionButton} ${styles.danfeButton}`}
                                onClick={() => onGenerateDanfe(invoice.chaveAcesso!)}
                                title="Gerar DANFE"
                            >
                                <i className="fas fa-file-pdf"></i>
                            </button>
                        </>
                    )}
                    {/* <button
                        className={`${styles.actionButton} ${styles.detailsButton}`}
                        onClick={() => onViewDetails(invoice)}
                        title="Ver Detalhes (Em breve)"
                        disabled // Disable details button for now
                    >
                        <i className="fas fa-search-plus"></i>
                    </button> */}
                </td>
            </tr>
        ));
    };

    return (
        <div className={styles.listContainer}>
            <div className={styles.tableWrapper}>
                <table className={styles.invoiceTable}>
                    {renderTableHeader()}
                    <tbody>
                        {renderTableRows()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvoiceListComponent;