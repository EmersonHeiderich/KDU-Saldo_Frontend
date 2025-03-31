# Sistema de Design - Diretrizes

Este documento descreve os padrões de design implementados no projeto, que devem ser seguidos para manter consistência visual em toda a aplicação.

## Espaçamento e Layout

### Containers
- **Padding interno:** 14px (desktop), 10px (mobile)
- **Margem entre containers:** 14px
- **Largura máxima do conteúdo:** 1800px (otimizado para telas de até 1980 x 1080)
- **Espaçamento entre elementos (gap):** 12px-16px

### Bordas e Cantos
- **Border-radius padrão:** 4px (elementos pequenos) ou 8px (containers)
- **Espessura de bordas:** 1px
- **Cor de borda:** var(--border-color-light)

## Tipografia

### Títulos
- **Título de página:** 1.5rem, font-weight: 500, letter-spacing: -0.01em
- **Subtítulos:** 0.9rem, color: var(--text-secondary)
- **Títulos de seção:** 1.1rem, font-weight: 500

### Texto
- **Texto normal:** 0.9rem
- **Texto secundário:** 0.85rem, color: var(--text-secondary)
- **Texto pequeno:** 0.75rem

## Elevação e Sombras

### Sombras
- **Sombra leve (shadow-sm):** 0 1px 2px rgba(0, 0, 0, 0.05)
- **Sombra média (shadow-md):** 0 3px 8px rgba(0, 0, 0, 0.08)
- **Sombra forte (shadow-lg):** 0 8px 20px rgba(0, 0, 0, 0.12)

## Componentes

### Containers
```css
.base-container {
  background-color: var(--bg-white);
  border-radius: var(--container-border-radius);
  box-shadow: var(--container-shadow);
  border: var(--container-border);
  padding: var(--container-padding);
  margin-bottom: 16px;
}
```

### Botões
- **Altura padrão:** 32px
- **Padding horizontal:** 14px
- **Padding vertical:** 6px
- **Font-size:** 0.85rem
- **Border-radius:** 4px

#### Variantes:
- **primary:** Azul escuro (--primary-color)
- **secondary:** Cinza médio (--text-secondary)
- **info:** Azul (--info-color)
- **danger:** Vermelho (--danger-color)

#### Tamanhos:
- **small:** padding 4px 8px, font-size 0.75rem
- **icon-only:** width e height 32px (desktop), 30px (mobile)

### Inputs e Formulários
- **Altura de inputs:** 34px
- **Padding horizontal:** 10px
- **Border-radius:** 3px
- **Espaçamento entre grupos de inputs:** 14px
- **Tamanho de label:** 0.85rem

## Cards e Painéis

### Cards KPI
- **Padding:** 12px
- **Gap entre ícone e conteúdo:** 12px
- **Border-left:** 3px solid (cor de destaque)
- **Sombra:** var(--shadow-sm)

### Tabelas
- **Cabeçalho:** Cor de fundo primary-color, texto branco
- **Linhas alternadas:** Cor de fundo bg-secondary
- **Padding de células:** 10px 12px (desktop), 6px 8px (mobile)
- **Borda entre linhas:** 1px solid var(--border-color-light)

## Responsividade

### Breakpoints
- **Mobile pequeno:** max-width: 576px
- **Mobile:** max-width: 768px
- **Tablet:** max-width: 992px
- **Desktop pequeno:** max-width: 1200px
- **Desktop:** min-width: 1201px

### Ajustes Mobile
- Redução de padding: 30-40% menor que desktop
- Redução de tamanho de fonte: 15px base (vs 16px desktop)
- Ajuste de layouts para colunas em telas pequenas
- Sidebar recolhida em dispositivos móveis

## Variáveis CSS

Utilize as variáveis CSS definidas em `src/App.css` para manter consistência:

```css
:root {
  /* Cores primárias e acentuação */
  --primary-color: #2c3e50;
  --accent-color: #3498db;
  
  /* Cores de fundo */
  --background-color: #f5f7f9;
  --bg-white: #ffffff;
  --bg-secondary: #f8f9fa;
  
  /* Cores de texto */
  --text-primary: #34495e;
  --text-secondary: #7f8c8d;
  
  /* Containers e bordas */
  --container-padding: 16px;
  --container-border-radius: 8px;
  --container-shadow: var(--shadow-sm);
  --container-border: 1px solid var(--border-color-light);
}
```

## Implementação

Ao criar novos componentes:

1. Utilize as variáveis CSS existentes
2. Siga os padrões de espaçamento e layout definidos
3. Mantenha consistência com elementos visuais semelhantes
4. Considere os ajustes responsivos para dispositivos menores
5. Prefira usar as classes base quando possível (.base-container, etc)

Este documento deve ser consultado e atualizado regularmente para garantir que todos os desenvolvedores sigam o mesmo padrão visual.
