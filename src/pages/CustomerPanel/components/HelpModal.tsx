import React from 'react';
import BaseModal from '../../../components/BaseModal/BaseModal';
import '../../../components/BaseModal/BaseModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajuda - Painel do Cliente"
    >
      <div>
        <h4>Como usar o Painel do Cliente</h4>
        <p>
          O Painel do Cliente permite consultar informações detalhadas de clientes cadastrados no sistema.
          Você pode pesquisar usando o código do cliente, CPF ou CNPJ.
        </p>
        
        <h5>Tipos de Busca</h5>
        <ul>
          <li>
            <strong>Busca por Código:</strong> Digite um código de até 9 dígitos e selecione se é uma Pessoa Física (PF) ou Pessoa Jurídica (PJ).
          </li>
          <li>
            <strong>Busca por CPF:</strong> Digite um CPF completo (11 dígitos). O sistema detectará automaticamente que é uma busca por CPF.
          </li>
          <li>
            <strong>Busca por CNPJ:</strong> Digite um CNPJ completo (14 dígitos). O sistema detectará automaticamente que é uma busca por CNPJ.
          </li>
        </ul>
        
        <h5>Exibição de Dados</h5>
        <p>
          Após a busca, o sistema exibirá:
        </p>
        <ul>
          <li>
            <strong>Dados Cadastrais:</strong> Informações de cadastro do cliente, como nome/razão social, CPF/CNPJ, endereço e contatos.
          </li>
          <li>
            <strong>Indicadores de Desempenho (KPIs):</strong> Principais métricas do cliente, como valor total de compras, quantidades, etc.
          </li>
          <li>
            <strong>Estatísticas Detalhadas:</strong> Informações completas sobre compras, pagamentos, parcelas em aberto e atrasos.
          </li>
        </ul>
        
        <h5>Dicas</h5>
        <ul>
          <li>Os valores em vermelho indicam situações que requerem atenção, como atrasos em pagamentos.</li>
          <li>Você pode pressionar Enter após digitar o termo de busca para iniciar a consulta.</li>
          <li>As datas e valores monetários são exibidos no formato brasileiro.</li>
        </ul>
        
        <h5>Recursos Futuros</h5>
        <p>
          Em breve, o Painel do Cliente terá novas funcionalidades como verificação de contas a receber, 
          impressão de boletos e notas fiscais.
        </p>
      </div>
    </BaseModal>
  );
};

export default HelpModal;
