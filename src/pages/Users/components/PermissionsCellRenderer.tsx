// src/pages/Users/components/PermissionsCellRenderer.tsx (or inline in Users.tsx)
import React from 'react';
import styles from '../Users.module.css'; // Assuming path
import { User } from '../../../services/userService'; // Assuming path
import { ICellRendererParams } from 'ag-grid-community';

// Helper to generate tooltip text
const getPermissionTooltipText = (permissions: User['permissions']): string => {
    if (!permissions) return 'Sem permissões definidas.';
    const names: string[] = [];
    if (permissions.isAdmin) names.push('Administrador');
    if (permissions.canAccessProducts) names.push('Produtos');
    if (permissions.canAccessFabrics) names.push('Tecidos');
    if (permissions.canAccessCustomerPanel) names.push('Painel Cliente');
    if (permissions.canAccessFiscal) names.push('Fiscal');

    if (names.length === 0) return 'Nenhuma permissão específica.';
    return `Permissões: ${names.join(', ')}.`;
};

const PermissionsCellRenderer: React.FC<ICellRendererParams<User, User['permissions']>> = ({ value }) => {
    if (!value) return <span title="Sem permissões definidas.">-</span>; // Tooltip for empty case

    const { isAdmin, canAccessProducts, canAccessFabrics, canAccessCustomerPanel, canAccessFiscal } = value;
    const hasSpecificPermissions = canAccessProducts || canAccessFabrics || canAccessCustomerPanel || canAccessFiscal;
    const tooltipText = getPermissionTooltipText(value);

    return (
        // Container div with the tooltip
        <div className={styles.permissionsContainerWithTooltip} title={tooltipText}>
            {/* Actual badges inside */}
            <div className={styles.permissionsBadges}>
                {isAdmin && (
                    <span className={`${styles.permissionBadge} ${styles.admin}`} >Admin</span>
                )}
                {!isAdmin && canAccessProducts && (
                    <span className={`${styles.permissionBadge} ${styles.products}`} >Produtos</span>
                )}
                {!isAdmin && canAccessFabrics && (
                    <span className={`${styles.permissionBadge} ${styles.fabrics}`} >Tecidos</span>
                )}
                {!isAdmin && canAccessCustomerPanel && (
                    <span className={`${styles.permissionBadge} ${styles.customerPanel}`} >Cliente</span>
                )}
                {!isAdmin && canAccessFiscal && (
                    <span className={`${styles.permissionBadge} ${styles.fiscal}`} >Fiscal</span>
                )}
                {!isAdmin && !hasSpecificPermissions && (
                    <span>-</span>
                )}
            </div>
        </div>
    );
};

export default PermissionsCellRenderer; // Export if it's a separate file