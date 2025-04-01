// src/pages/Home/Home.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Home.module.css';

interface HomeCardProps {
    title: string;
    description: string;
    icon: string;
    navigateTo: string;
    borderColorClass: string;
    stats: { icon: string; label: string }[];
}

const HomeCard: React.FC<HomeCardProps> = ({ title, description, icon, navigateTo, borderColorClass, stats }) => {
    const navigate = useNavigate();
    return (
        <div className={`${styles.card} ${borderColorClass}`}>
            <div className={styles.cardHeader}>
                <i className={icon}></i>
                <span>{title}</span>
            </div>
            <div className={styles.cardBody}>
                <p className={styles.cardDescription}>{description}</p>
                <div className={styles.cardStats}>
                    {stats.map((stat, index) => (
                        <div key={index} className={styles.stat}>
                            <div className={styles.statValue}>
                                <i className={stat.icon}></i>
                            </div>
                            <div className={styles.statLabel}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.cardFooter}>
                <button
                    className={styles.cardBtn}
                    onClick={() => navigate(navigateTo)}
                    aria-label={`Acessar ${title}`}
                >
                    <i className="fas fa-arrow-right"></i>
                    <span>Acessar</span>
                </button>
            </div>
        </div>
    );
};


const Home: React.FC = () => {
    const { user } = useAuth();

    // --- Permission Checks ---
    const defaultPermissions = {
        is_admin: false,
        can_access_products: false,
        can_access_fabrics: false,
        can_access_customer_panel: false,
        can_access_fiscal: false,
        can_access_accounts_receivable: false, // Add AR permission
    };
    // Ensure all expected permission keys exist in user?.permissions
    const userPermissions = user?.permissions
        ? { ...defaultPermissions, ...user.permissions }
        : defaultPermissions;

    const isAdmin = userPermissions.is_admin;
    const canAccessProducts = isAdmin || userPermissions.can_access_products;
    const canAccessFabrics = isAdmin || userPermissions.can_access_fabrics;
    const canAccessCustomerPanel = isAdmin || userPermissions.can_access_customer_panel;
    const canAccessFiscal = isAdmin || userPermissions.can_access_fiscal;
    const canAccessAR = isAdmin || userPermissions.can_access_accounts_receivable; // Check AR permission

    // --- Card Definitions ---
    const cards = [
        canAccessProducts && {
            title: 'Produtos Acabados',
            description: 'Consulte saldos por referência, visualize a matriz e detalhes.',
            icon: 'fas fa-tshirt',
            navigateTo: '/products',
            borderColorClass: styles.productBorder,
            stats: [
                { icon: 'fas fa-th', label: 'Matriz Cor/Tam' },
                { icon: 'fas fa-search-plus', label: 'Detalhes SKU' },
                { icon: 'fas fa-comment-alt', label: 'Observações' },
            ]
        },
        canAccessFabrics && {
            title: 'Tecidos',
            description: 'Visualize saldos, custos e detalhes de matérias-primas.',
            icon: 'fas fa-layer-group',
            navigateTo: '/fabrics',
            borderColorClass: styles.fabricBorder,
            stats: [
                { icon: 'fas fa-list-ul', label: 'Listagem Completa' },
                { icon: 'fas fa-dollar-sign', label: 'Custos' },
                { icon: 'fas fa-ruler-combined', label: 'Detalhes' },
            ]
        },
        canAccessCustomerPanel && {
            title: 'Painel do Cliente',
            description: 'Consulte dados cadastrais e estatísticas financeiras.',
            icon: 'fas fa-address-card',
            navigateTo: '/customer-panel',
            borderColorClass: styles.customerPanelBorder,
            stats: [
                { icon: 'fas fa-search', label: 'Buscar Cliente' },
                { icon: 'fas fa-chart-line', label: 'Estatísticas' },
                { icon: 'fas fa-info-circle', label: 'Dados Detalhados' },
            ]
        },
        canAccessFiscal && {
            title: 'Módulo Fiscal',
            description: 'Consulte notas fiscais emitidas e gere DANFEs.',
            icon: 'fas fa-file-invoice-dollar',
            navigateTo: '/fiscal',
            borderColorClass: styles.fiscalBorder,
            stats: [
                { icon: 'fas fa-search', label: 'Buscar NF-e' },
                { icon: 'fas fa-file-pdf', label: 'Gerar DANFE' },
                { icon: 'fas fa-list-ol', label: 'Listagem' },
            ]
        },
        // --- NEW Accounts Receivable Card ---
        canAccessAR && {
            title: 'Contas a Receber',
            description: 'Consulte títulos a receber e gere boletos.',
            icon: 'fas fa-hand-holding-usd',
            navigateTo: '/accounts-receivable',
            borderColorClass: styles.accountsReceivableBorder, // Add new border class in CSS if desired
            stats: [
                { icon: 'fas fa-filter', label: 'Filtrar Títulos' },
                { icon: 'fas fa-barcode', label: 'Gerar Boleto' },
                { icon: 'fas fa-list-alt', label: 'Listagem' },
            ]
        },
        isAdmin && {
             title: 'Gerenciar Usuários',
             description: 'Administre usuários e suas permissões de acesso.',
             icon: 'fas fa-users-cog',
             navigateTo: '/users',
             borderColorClass: styles.adminBorder,
             stats: [
                 { icon: 'fas fa-user-plus', label: 'Adicionar' },
                 { icon: 'fas fa-user-edit', label: 'Editar' },
                 { icon: 'fas fa-user-lock', label: 'Permissões' },
             ]
         }
    ].filter(Boolean) as HomeCardProps[];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Página Inicial</h1>
                <p className={styles.subtitle}>Bem-vindo(a) ao Sistema de Consulta Integrado</p> {/* Updated title */}
            </header>

            {cards.length > 0 ? (
                <div className={styles.cardsContainer}>
                    {cards.map((card, index) => (
                        <HomeCard key={index} {...card} />
                    ))}
                </div>
            ) : (
                <div className={styles.noAccessState}>
                    <i className="fas fa-lock fa-3x"></i>
                    <h3>Sem Acesso</h3>
                    <p>Você não tem permissão para acessar nenhuma funcionalidade no momento.</p>
                    <p>Entre em contato com o administrador do sistema.</p>
                </div>
            )}
        </div>
    );
};

export default Home;