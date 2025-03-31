// src/pages/Fiscal/components/ActionsCellRenderer.tsx
import React from 'react';
import styles from '../Fiscal.module.css'; // Use parent styles
import { Invoice } from '../../../services/fiscalService'; // Use frontend type
import { ICellRendererParams } from 'ag-grid-community';

const ActionsCellRenderer: React.FC<ICellRendererParams<Invoice>> = ({ data, context }) => {
    // Destructure handlers from context passed in gridOptions
    const { handleCopyKey, handleGenerateDanfe } = context;

    if (!data || !data.chaveAcesso) return null; // Don't render if no data or no access key

    const onCopyClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row selection if needed
        handleCopyKey(data.chaveAcesso);
    };

    const onDanfeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleGenerateDanfe(data.chaveAcesso);
    };

    return (
        <div className={styles.actionsCell}> {/* Use specific class */}
            {data.chaveAcesso && ( // Only show actions if access key exists
                <>
                    <button
                        className={`${styles.actionButton} ${styles.copyButton}`}
                        onClick={onCopyClick}
                        title="Copiar Chave de Acesso"
                        aria-label={`Copiar chave de acesso da NF ${data.numeroNota}`}
                    >
                        <i className="fas fa-key"></i>
                    </button>
                    <button
                        className={`${styles.actionButton} ${styles.danfeButton}`}
                        onClick={onDanfeClick}
                        title="Gerar DANFE PDF"
                        aria-label={`Gerar DANFE da NF ${data.numeroNota}`}
                    >
                        <i className="fas fa-file-pdf"></i>
                    </button>
                </>
            )}
            {/* Add other action buttons here if needed, e.g., details */}
            {/* <button
                className={`${styles.actionButton} ${styles.detailsButton}`}
                onClick={(e) => { e.stopPropagation(); handleViewDetails(data); }} // Example
                title="Ver Detalhes"
                aria-label={`Ver detalhes da NF ${data.numeroNota}`}
            >
                <i className="fas fa-search-plus"></i>
            </button> */}
        </div>
    );
};

export default ActionsCellRenderer;