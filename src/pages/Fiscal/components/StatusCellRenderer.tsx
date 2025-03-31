// src/pages/Fiscal/components/StatusCellRenderer.tsx
import React from 'react';
import styles from '../Fiscal.module.css'; // Use parent styles
import { Invoice } from '../../../services/fiscalService'; // Use frontend type
import { ICellRendererParams } from 'ag-grid-community';

// Helper function to map status strings to CSS classes
const getStatusClassName = (status: string | null | undefined): string => {
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

// Map status keys to display labels
const getStatusLabel = (status: string | null | undefined): string => {
    switch (status?.toLowerCase()) {
        case 'authorized': return 'Autorizada';
        case 'canceled': return 'Cancelada';
        case 'denied': return 'Denegada';
        case 'rejected': return 'Rejeitada';
        case 'sent': return 'Enviada';
        case 'generated': return 'Gerada';
        default: return status || 'N/A'; // Return original or N/A
    }
};


const StatusCellRenderer: React.FC<ICellRendererParams<Invoice, Invoice['status']>> = ({ value }) => {
    const className = getStatusClassName(value);
    const label = getStatusLabel(value);

    return (
        <span className={`${styles.statusBadge} ${className}`}>
            {label}
        </span>
    );
};

export default StatusCellRenderer;