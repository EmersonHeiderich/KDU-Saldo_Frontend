# Guia de Design do Sistema

Este documento define os padrões de design a serem seguidos em todas as telas e componentes do sistema, garantindo consistência visual e de experiência do usuário.

## Índice

1. [Sistema de Grid e Layout](#sistema-de-grid-e-layout)
2. [Sistema Tipográfico](#sistema-tipográfico)
3. [Sistema de Cores](#sistema-de-cores)
4. [Componentes](#componentes)
5. [Estados e Feedback](#estados-e-feedback)
6. [Ícones e Imagens](#ícones-e-imagens)
7. [Responsividade](#responsividade)

## Sistema de Grid e Layout

### Containers

- **Container Principal**: Padding de 20px em todos os lados
- **Containers de Conteúdo**: Fundo branco, border-radius de 8px, box-shadow de 0 2px 8px rgba(0, 0, 0, 0.1)
- **Espaçamento entre Containers**: Margin-bottom de 20px

```css
.container {
  padding: 20px;
}

.contentContainer {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}
```

### Espaçamento

- **Entre Elementos**: Gap de 15px para flex containers
- **Entre Seções**: Margin-bottom de 30px
- **Padding Interno**: 15px para containers de conteúdo

## Sistema Tipográfico

### Hierarquia de Títulos

- **Título Principal (h1)**: 
  - Tamanho: 2rem
  - Cor: var(--primary-color)
  - Margin-bottom: 5px

- **Subtítulo**: 
  - Tamanho: 1.1rem
  - Cor: var(--text-secondary)

- **Títulos de Seção (h3)**: 
  - Tamanho: 1.2rem
  - Margin-bottom: 15px

```css
.header h1 {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 5px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
}
```

### Texto

- **Texto Principal**: 
  - Tamanho: 1rem
  - Cor: var(--text-primary)

- **Texto Secundário**: 
  - Tamanho: 0.9rem
  - Cor: var(--text-secondary)

- **Labels**: 
  - Tamanho: 0.9rem
  - Peso: 500
  - Cor: var(--text-secondary)
  - Margin-bottom: 5px

## Sistema de Cores

Todas as cores devem ser utilizadas através de variáveis CSS para garantir consistência:

```css
:root {
  --primary-color: #2c3e50;
  --primary-dark: #1a252f;
  --accent-color: #3498db;
  --accent-dark: #2980b9;
  --success-color: #2ecc71;
  --warning-color: #f39c12;
  --danger-color: #e74c3c;
  --text-primary: #333;
  --text-secondary: #666;
  --background-color: #f5f5f5;
  --border-color: #ddd;
}
```

### Uso de Cores

- **Cor Primária**: Cabeçalhos, botões primários, elementos de destaque
- **Cor de Acento**: Botões secundários, links, elementos interativos
- **Cores de Estado**: 
  - Success: Confirmações, status positivos
  - Warning: Alertas, status de atenção
  - Danger: Erros, status negativos, ações destrutivas

## Componentes

### Botões

- **Altura Padrão**: 38px
- **Padding**: 8px 16px
- **Border-radius**: 4px
- **Alinhamento**: Sempre alinhados verticalmente com inputs e outros elementos interativos

#### Tipos de Botões

- **Primário**: Ação principal da tela
  ```css
  .btn.primary {
    background-color: var(--primary-color);
    color: white;
  }
  ```

- **Secundário**: Ações secundárias
  ```css
  .btn.secondary {
    background-color: var(--accent-color);
    color: white;
  }
  ```

- **Ícone**: Botões apenas com ícone
  ```css
  .btn.icon-only {
    width: 38px;
    height: 38px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  ```

### Inputs e Formulários

- **Altura Padrão**: 38px
- **Padding**: 8px 12px
- **Border**: 1px solid var(--border-color)
- **Border-radius**: 4px

```css
.inputGroup {
  display: flex;
  flex-direction: column;
}

.inputGroup label {
  font-weight: 500;
  margin-bottom: 5px;
}

.inputGroup input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  height: 38px;
  box-sizing: border-box;
}
```

### Tabelas

- **Cabeçalho**: 
  - Background: var(--primary-color)
  - Cor do texto: white
  - Peso da fonte: 500
  - Padding: 10px 16px

- **Células**: 
  - Padding: 10px 16px
  - Border-bottom: 1px solid var(--border-color)

- **Container da Tabela**:
  - Background: white
  - Border-radius: 8px
  - Box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1)

```css
.tableContainer {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.95rem;
}

.table th {
  background: var(--primary-color);
  color: white;
  font-weight: 500;
  padding: 10px 16px;
  text-align: left;
}

.table td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color);
}
```

### Modais

Todos os modais devem utilizar o componente BaseModal para garantir consistência:

```tsx
<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  title="Título do Modal"
>
  {/* Conteúdo do modal */}
</BaseModal>
```

Estilo padrão dos modais:
- **Overlay**: Background rgba(0, 0, 0, 0.5)
- **Container**: 
  - Width: 90% (max-width: 600px)
  - Border-radius: 8px
  - Box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3)
- **Cabeçalho**: 
  - Background: var(--primary-color)
  - Cor do texto: white
  - Padding: 15px 20px
- **Corpo**: 
  - Padding: 20px
- **Rodapé** (quando necessário): 
  - Background: #f8f9fa
  - Padding: 15px 20px
  - Justify-content: flex-end

## Estados e Feedback

### Loading States

- **Loading Global**: Centralizado na tela com fundo semi-transparente
- **Loading de Componente**: 
  - Ícone de spinner com texto "Carregando..."
  - Padding: 50px 20px
  - Background: white
  - Border-radius: 8px
  - Box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1)

```css
.loadingState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  text-align: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loadingState i {
  font-size: 3rem;
  color: var(--primary-color);
  margin-bottom: 20px;
}

.loadingState p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}
```

### Estados de Erro

Similar ao loading state, mas com ícone e cor diferentes:

```css
.errorState i {
  color: var(--danger-color);
}
```

### Estados de Vazio

Exibir mensagem amigável e ícone representativo:

```css
.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  text-align: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

## Ícones e Imagens

- **Biblioteca de Ícones**: Font Awesome
- **Tamanho Padrão**: 
  - Em botões: 1rem
  - Em cabeçalhos: 1.2rem
  - Em estados (loading, erro): 3rem
- **Espaçamento**: Margin-right de 8px quando acompanhado de texto

```css
.btn i {
  margin-right: 8px;
}

.icon-large {
  font-size: 3rem;
  margin-bottom: 20px;
}
```

## Responsividade

### Breakpoints

- **Mobile**: max-width: 768px
- **Tablet**: max-width: 1024px

### Adaptações para Mobile

- **Containers**: Padding reduzido para 10px
- **Botões**: Padding reduzido para 6px 12px, font-size para 0.9rem
- **Tabelas**: Font-size reduzido para 0.85rem, padding reduzido para 8px 10px
- **Flex Containers**: Direção alterada para column quando necessário

```css
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  .btn {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .table {
    font-size: 0.85rem;
  }
  
  .table th,
  .table td {
    padding: 8px 10px;
  }
}
```

## Implementação em Novos Componentes

Ao criar novos componentes ou telas, siga estas diretrizes:

1. Utilize as variáveis CSS para cores e estilos
2. Mantenha a consistência com os componentes existentes
3. Reutilize componentes base como BaseModal
4. Siga a hierarquia de tipografia definida
5. Implemente os estados de loading, erro e vazio conforme os padrões
6. Garanta que o componente seja responsivo seguindo os breakpoints definidos

## Exemplo de Implementação

Exemplo de uma nova página seguindo os padrões:

```tsx
import React, { useState } from 'react';
import styles from './NovaPagina.module.css';
import BaseModal from '../../components/BaseModal/BaseModal';
import '../../components/BaseModal/BaseModal.css';

const NovaPagina: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Título da Página</h1>
        <p className={styles.subtitle}>Descrição da página</p>
      </header>
      
      <div className={styles.contentContainer}>
        <div className={styles.controls}>
          <div className={styles.inputGroup}>
            <label htmlFor="exemplo">Label:</label>
            <input
              type="text"
              id="exemplo"
              placeholder="Placeholder..."
            />
          </div>
          <button className="btn primary">
            <i className="fas fa-search"></i> Ação Principal
          </button>
        </div>
        
        <div className={styles.actionButtons}>
          <button 
            className="btn secondary icon-only"
            title="Ação Secundária"
          >
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Coluna 1</th>
              <th>Coluna 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dado 1</td>
              <td>Dado 2</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <BaseModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Título do Modal"
      >
        Conteúdo do modal
      </BaseModal>
    </div>
  );
};

export default NovaPagina;
```

Seguindo estas diretrizes, garantimos uma experiência de usuário consistente e profissional em todo o sistema.
