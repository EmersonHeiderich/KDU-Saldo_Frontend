# src/pages/Fiscal

Página para visualização e gerenciamento de informações fiscais.

## Funcionalidades

*   Listagem de Notas Fiscais Emitidas.
*   Filtros por Cliente (Código/CPF/CNPJ), Status NF-e, Número NF-e e Data de Emissão.
*   Paginação dos resultados.
*   Ordenação das colunas da lista.
*   Cálculo e exibição de KPIs (totalizadores) com base na lista filtrada.
*   Ações por nota: Copiar Chave de Acesso, Gerar DANFE PDF.
*   Comportamento condicional:
    *   Se acessada via Painel do Cliente: pré-filtra pelo cliente, desabilita filtro de cliente, adiciona botão "Voltar".
    *   Se acessada via Menu: filtra automaticamente pela data atual, permite todos os filtros.

## Componentes

*   **`Fiscal.tsx`**: Componente principal da página, gerencia estado, busca de dados e orquestra os subcomponentes.
*   **`components/FiscalFilters.tsx`**: Renderiza os campos de filtro e botões de ação (Pesquisar, Limpar).
*   **`components/FiscalKPIs.tsx`**: Exibe os totalizadores calculados.
*   **`components/InvoiceList.tsx`**: Renderiza a tabela de notas fiscais, incluindo cabeçalhos, linhas, estados de carregamento/erro/vazio e botões de ação.

## Fluxo de Dados

1.  O componente `Fiscal.tsx` é montado.
2.  `useEffect` verifica a origem da navegação (`location.state`).
3.  Define os filtros iniciais (data atual ou filtro de cliente).
4.  `useEffect` dispara a busca inicial `fetchInvoices` com os filtros iniciais.
5.  `fiscalService.searchInvoices` é chamado, que por sua vez chama `api.searchFiscalInvoices`.
6.  A resposta da API é mapeada para a interface `InvoiceSearchResult`.
7.  `Fiscal.tsx` atualiza seu estado com os resultados e calcula os KPIs usando `fiscalService.calculateInvoiceKPIs`.
8.  Os dados são passados para `InvoiceListComponent` e `FiscalKPIsComponent` para renderização.
9.  Interações do usuário nos filtros (`FiscalFiltersComponent`) chamam `handleSearch` ou `handleClearFilters`.
10. `handleSearch/handleClearFilters` atualiza o estado `filters`, o que dispara o `useEffect` para chamar `fetchInvoices` novamente.
11. Cliques na paginação chamam `handlePageChange`, que chama `fetchInvoices` com a nova página.
12. Cliques nos cabeçalhos da tabela chamam `handleSort`, que atualiza o estado de ordenação e reordena os dados localmente (ou dispara um fetch se a ordenação for no backend).
13. Cliques nos botões de ação (Copiar, DANFE) chamam os handlers correspondentes (`handleCopyKey`, `handleGenerateDanfe`), que interagem com `navigator.clipboard` ou `fiscalService.getDanfePdfBlob`.

## CSS

*   **`Fiscal.module.css`**: Define os estilos específicos para esta página e seus componentes, utilizando CSS Modules. Reutiliza padrões e variáveis globais de `App.css`.