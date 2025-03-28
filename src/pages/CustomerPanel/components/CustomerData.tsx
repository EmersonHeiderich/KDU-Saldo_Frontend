// src/pages/CustomerPanel/components/CustomerData.tsx

import React from 'react';
// Use frontend interfaces and helper functions from the service
import {
  CustomerData as CustomerDataType,
  IndividualCustomerData,
  LegalEntityCustomerData,
  CustomerAddress,
  CustomerPhone,
  CustomerEmail,
  formatCPF,
  formatCNPJ,
  formatDate,
  formatCurrency // Import formatCurrency if needed here (e.g., for capital_social)
} from '../../../services/customerPanelService';
import styles from '../CustomerPanel.module.css';

interface CustomerDataProps {
  data: CustomerDataType; // Expects frontend CustomerData type
}

const CustomerDataComponent: React.FC<CustomerDataProps> = ({ data }) => {

  // Helper to render Address
  const renderAddress = (address: CustomerAddress | null) => {
    if (!address) return <p className={styles.noInfo}>Nenhum endereço cadastrado.</p>;

    return (
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <div className={styles.label}>Logradouro:</div>
          <div className={styles.value}>{address.logradouro || '-'}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.label}>Número:</div>
          <div className={styles.value}>{address.numero || '-'}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.label}>Bairro:</div>
          <div className={styles.value}>{address.bairro || '-'}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.label}>Cidade:</div>
          <div className={styles.value}>{address.municipio || '-'}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.label}>UF:</div>
          <div className={styles.value}>{address.uf || '-'}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.label}>CEP:</div>
          <div className={styles.value}>{address.cep || '-'}</div>
        </div>
         <div className={styles.infoItem}>
          <div className={styles.label}>Complemento:</div>
          <div className={styles.value}>{address.complemento || '-'}</div>
        </div>
        <div className={styles.infoItem}>
          <div className={styles.label}>Tipo:</div>
          <div className={styles.value}>{address.tipo || '-'}</div>
        </div>
        {/* Optionally display reference if needed */}
        {/* <div className={`${styles.infoItem} ${styles.fullWidth}`}> // Example full width
           <div className={styles.label}>Referência:</div>
           <div className={styles.value}>{address.referencia || '-'}</div>
         </div> */}
      </div>
    );
  };

  // Helper to render Phones
  const renderPhones = (phones: CustomerPhone[]) => {
    if (!phones || phones.length === 0) {
      return <p className={styles.noInfo}>Nenhum telefone cadastrado.</p>;
    }

    return (
         <div className={styles.contactList}>
             {phones.map((phone, index) => (
                <div key={`phone-${index}`} className={styles.contactItem}>
                    <i className="fas fa-phone-alt"></i>
                    <span>{phone.numero || '-'}</span>
                    <span className={styles.contactType}>({phone.tipo || 'N/D'})</span>
                    {phone.padrao && <span className={styles.defaultBadge}>(Padrão)</span>}
                </div>
            ))}
         </div>
    );
  };

  // Helper to render Emails
  const renderEmails = (emails: CustomerEmail[]) => {
    if (!emails || emails.length === 0) {
      return <p className={styles.noInfo}>Nenhum e-mail cadastrado.</p>;
    }

     return (
         <div className={styles.contactList}>
            {emails.map((email, index) => (
                <div key={`email-${index}`} className={styles.contactItem}>
                    <i className="fas fa-envelope"></i>
                    <span>{email.email || '-'}</span>
                     <span className={styles.contactType}>({email.tipo || 'N/D'})</span>
                    {email.padrao && <span className={styles.defaultBadge}>(Padrão)</span>}
                </div>
            ))}
         </div>
     );
  };


  // Render PF specific data
  const renderIndividualData = (pfData: IndividualCustomerData) => {
    return (
      <>
        <div className={styles.infoSection}>
          <h3>
            <i className="fas fa-user"></i> Dados Pessoais (PF)
          </h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.label}>Código:</div>
              <div className={styles.value}>{pfData.codigo}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.label}>Nome:</div>
              <div className={styles.value}>{pfData.nome}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.label}>CPF:</div>
              <div className={styles.value}>{formatCPF(pfData.cpf)}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.label}>RG:</div>
              <div className={styles.value}>{pfData.rg || '-'} {pfData.ufRg ? `(${pfData.ufRg})` : ''}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.label}>Nascimento:</div>
              <div className={styles.value}>{formatDate(pfData.dataNascimento)}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.label}>Cadastro:</div>
              <div className={styles.value}>{formatDate(pfData.dataCadastro)}</div>
            </div>
             <div className={styles.infoItem}>
              <div className={styles.label}>Filial Cadastro:</div>
              <div className={styles.value}>{pfData.empresaCadastro || '-'}</div>
            </div>
             <div className={styles.infoItem}>
                <div className={styles.label}>Status:</div>
                <div className={pfData.status === 'Ativo' ? styles.statusActive : styles.statusInactive}>
                    {pfData.status}
                </div>
             </div>

          </div>
           <div className={styles.tagSection}> {/* Section for boolean tags */}
                 {pfData.ehCliente && <span className={`${styles.tag} ${styles.tagCustomer}`}>Cliente</span>}
                 {pfData.ehFornecedor && <span className={`${styles.tag} ${styles.tagSupplier}`}>Fornecedor</span>}
                 {pfData.ehFuncionario && <span className={`${styles.tag} ${styles.tagEmployee}`}>Funcionário</span>}
           </div>
        </div>
      </>
    );
  };

  // Render PJ specific data
  const renderLegalEntityData = (pjData: LegalEntityCustomerData) => {
    return (
      <>
        <div className={styles.infoSection}>
          <h3>
            <i className="fas fa-building"></i> Dados da Empresa (PJ)
            </h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.label}>Código:</div>
              <div className={styles.value}>{pjData.codigo}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.label}>Razão Social:</div>
              <div className={styles.value}>{pjData.razaoSocial}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.label}>Nome Fantasia:</div>
              <div className={styles.value}>{pjData.nomeFantasia || '-'}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.label}>CNPJ:</div>
              <div className={styles.value}>{formatCNPJ(pjData.cnpj)}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.label}>Inscrição Estadual:</div>
              <div className={styles.value}>{pjData.ie || '-'} {pjData.estadoIe ? `(${pjData.estadoIe})` : ''}</div>
            </div>
             <div className={styles.infoItem}>
              <div className={styles.label}>Fundação:</div>
              <div className={styles.value}>{formatDate(pjData.dataFundacao)}</div>
            </div>
             <div className={styles.infoItem}>
              <div className={styles.label}>Cadastro:</div>
              <div className={styles.value}>{formatDate(pjData.dataCadastro)}</div>
            </div>
            <div className={styles.infoItem}>
              <div className={styles.label}>Capital Social:</div>
              <div className={styles.value}>{formatCurrency(pjData.capitalSocial)}</div>
            </div>
             <div className={styles.infoItem}>
                <div className={styles.label}>Status:</div>
                <div className={pjData.status === 'Ativo' ? styles.statusActive : styles.statusInactive}>
                    {pjData.status}
                </div>
             </div>
          </div>
           <div className={styles.tagSection}> {/* Section for boolean tags */}
               {pjData.ehCliente && <span className={`${styles.tag} ${styles.tagCustomer}`}>Cliente</span>}
               {pjData.ehFornecedor && <span className={`${styles.tag} ${styles.tagSupplier}`}>Fornecedor</span>}
               {pjData.ehRepresentante && <span className={`${styles.tag} ${styles.tagRepresentative}`}>Representante</span>}
           </div>
        </div>
      </>
    );
  };

  // Main component render logic
  return (
    <div className={styles.customerDataContainer}> {/* Use a specific container class */}

      {/* Render specific data based on tipoCliente */}
      {data.tipoCliente === 'PF'
        ? renderIndividualData(data as IndividualCustomerData)
        : renderLegalEntityData(data as LegalEntityCustomerData)
      }

      {/* Address Section */}
      <div className={styles.infoSection}>
        <h3><i className="fas fa-map-marker-alt"></i> Endereço Principal</h3>
        {renderAddress(data.endereco)}
      </div>

      {/* Contacts Section */}
      <div className={styles.infoSection}>
        <h3><i className="fas fa-address-book"></i> Contatos</h3>
        <div className={styles.contactSubSection}>
          <h4>Telefones</h4>
          {renderPhones(data.telefones)}
        </div>
        <div className={styles.contactSubSection}>
          <h4>E-mails</h4>
          {renderEmails(data.emails)}
        </div>
      </div>
    </div>
  );
};

export default CustomerDataComponent;