# Componente BaseModal

Este componente fornece uma implementação padronizada de modais para toda a aplicação, com animações de entrada/saída e gerenciamento de estado.

## Características

- Animações suaves de entrada e saída
- Fechamento com botão X ou tecla ESC
- Suporte para loading com delay inteligente
- Estrutura padronizada (título, corpo, etc.)
- Totalmente tipado com TypeScript

## Como usar

### Importação

```tsx
import BaseModal from '../../components/BaseModal/BaseModal';
import '../../components/BaseModal/BaseModal.css'; // Importe no arquivo principal da página
```

### Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| isOpen | boolean | Sim | Controla se o modal está aberto ou fechado |
| onClose | () => void | Sim | Função chamada quando o modal é fechado |
| title | string | Sim | Título exibido no cabeçalho do modal |
| children | ReactNode | Sim | Conteúdo do modal |
| className | string | Não | Classes CSS adicionais para estilização específica |
| showLoading | boolean | Não | Se true, exibe um indicador de loading no lugar do conteúdo |
| loadingMessage | string | Não | Mensagem exibida durante o loading (padrão: "Carregando...") |

### Exemplo básico

```tsx
import React, { useState } from 'react';
import BaseModal from '../../components/BaseModal/BaseModal';

const ExampleComponent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>Abrir Modal</button>
      
      <BaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Exemplo de Modal"
      >
        <p>Este é o conteúdo do modal.</p>
        <button onClick={() => setIsModalOpen(false)}>Fechar</button>
      </BaseModal>
    </>
  );
};
```

### Exemplo com loading

```tsx
import React, { useState, useEffect } from 'react';
import BaseModal from '../../components/BaseModal/BaseModal';
import useDelayedLoading from '../../hooks/useDelayedLoading';

const DataModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setIsLoading, resetLoading] = useDelayedLoading(500);

  useEffect(() => {
    if (isModalOpen) {
      loadData();
    }
  }, [isModalOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Simulando uma chamada de API
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      resetLoading();
    }
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>Abrir Modal com Dados</button>
      
      <BaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal com Dados"
        showLoading={loading}
        loadingMessage="Carregando dados..."
      >
        {data && (
          <div>
            <p>Dados carregados com sucesso!</p>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </BaseModal>
    </>
  );
};
```

## Hook useDelayedLoading

Para um melhor controle de loading, use o hook `useDelayedLoading` que implementa um delay inteligente para evitar flashes de loading em operações rápidas.

```tsx
const [loading, setIsLoading, resetLoading] = useDelayedLoading(500);

// Iniciar loading
setIsLoading(true);

// Finalizar loading (cancela o timer se ainda não foi mostrado)
resetLoading();
```

## Estilização personalizada

Você pode personalizar a aparência do modal passando uma classe CSS personalizada:

```tsx
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Personalizado"
  className={styles.customModal}
>
  Conteúdo personalizado
</BaseModal>
```

E no seu arquivo CSS:

```css
.customModal {
  /* Suas personalizações aqui */
  max-width: 800px; /* Exemplo: modal mais largo */
}
```

## Implementação em novos modais

1. Crie um novo componente para seu modal
2. Importe o BaseModal e o hook useDelayedLoading (se necessário)
3. Use o BaseModal como wrapper para o conteúdo do seu modal
4. Implemente a lógica específica do seu modal dentro do componente
5. Certifique-se de que o CSS do BaseModal está importado no arquivo principal da página

## Considerações importantes

- O BaseModal gerencia automaticamente o ciclo de vida do modal, incluindo animações de entrada/saída
- O modal será fechado automaticamente ao pressionar ESC
- Para modais com carregamento assíncrono, use o hook useDelayedLoading para evitar flashes de loading
