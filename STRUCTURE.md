# Estrutura do Projeto Frontend

Este documento apresenta a estrutura de arquivos e pastas do projeto frontend, detalhando a organização e hierarquia dos componentes do sistema.

## Estrutura de Diretórios

```
saldo-frontend/
│
├── public/
│
├── src/
│   ├── assets/
│   │
│   ├── components/           # Componentes reutilizáveis
│   │   ├── BaseModal/        # Componente de modal base
│   │   │   ├── BaseModal.css
│   │   │   └── BaseModal.tsx
│   │   │
│   │   └── Sidebar/          # Componente de barra lateral
│   │       ├── Sidebar.module.css
│   │       └── Sidebar.tsx
│   │
│   ├── contexts/             # Contextos React para gerenciamento de estado
│   │   └── AuthContext.tsx   # Contexto de autenticação
│   │
│   ├── docs/                 # Documentação do projeto
│   │   ├── DESIGN_GUIDELINES.md
│   │   └── Design_Modal.md
│   │
│   ├── hooks/                # Custom hooks
│   │   └── useDelayedLoading.ts
│   │
│   ├── layouts/              # Layouts da aplicação
│   │   └── MainLayout.tsx    # Layout principal
│   │
│   ├── pages/                # Páginas da aplicação
│   │   ├── CustomerPanel/    # Página do painel de cliente
│   │   │   ├── CustomerPanel.module.css
│   │   │   ├── CustomerPanel.tsx
│   │   │   └── components/   # Componentes específicos da página
│   │   │       ├── CustomerData.tsx
│   │   │       ├── CustomerKPIs.tsx
│   │   │       ├── CustomerSearch.tsx
│   │   │       ├── CustomerStatistics.tsx
│   │   │       └── HelpModal.tsx
│   │   │
│   │   ├── Fabrics/          # Página de tecidos
│   │   │   ├── Fabrics.module.css
│   │   │   ├── Fabrics.tsx
│   │   │   └── components/
│   │   │       └── HelpModal.tsx
│   │   │
│   │   ├── Home/             # Página inicial
│   │   │   ├── Home.module.css
│   │   │   └── Home.tsx
│   │   │
│   │   ├── Login/            # Página de login
│   │   │   ├── Login.module.css
│   │   │   └── Login.tsx
│   │   │
│   │   ├── Products/         # Página de produtos
│   │   │   ├── observations-animations.css
│   │   │   ├── Products.module.css
│   │   │   ├── Products.tsx
│   │   │   └── components/
│   │   │       ├── DetailsModal.tsx
│   │   │       ├── HelpModal.tsx
│   │   │       ├── ObservationsModal.tsx
│   │   │       ├── PendingObservationsModal.tsx
│   │   │       └── ProductMatrix.tsx
│   │   │
│   │   └── Users/            # Página de usuários
│   │       ├── Users.module.css
│   │       ├── Users.tsx
│   │       └── components/
│   │           ├── ConfirmModal.tsx
│   │           └── UserModal.tsx
│   │
│   ├── services/             # Serviços para comunicação com APIs
│   │   ├── authService.ts    # Serviço de autenticação
│   │   ├── customerPanelService.ts
│   │   ├── fabricService.ts
│   │   ├── observationService.ts
│   │   ├── productService.ts
│   │   └── userService.ts
│   │
│   ├── utils/                # Utilitários e funções auxiliares
│   │   ├── api.ts            # Configuração da API
│   │   └── config.ts         # Configurações gerais
│   │
│   ├── App.css               # Estilos do componente App
│   ├── App.tsx               # Componente principal da aplicação
│   ├── index.css             # Estilos globais
│   ├── main.tsx              # Ponto de entrada da aplicação
│   └── vite-env.d.ts         # Declarações de tipo para o Vite
│
├── .gitignore                # Arquivos ignorados pelo Git
├── eslint.config.js          # Configuração do ESLint
├── index.html                # HTML raiz
├── package-lock.json         # Lock de dependências do npm
├── package.json              # Definição de dependências e scripts
├── tsconfig.app.json         # Configuração do TypeScript para a aplicação
├── tsconfig.json             # Configuração principal do TypeScript
├── tsconfig.node.json        # Configuração do TypeScript para o Node
└── vite.config.ts            # Configuração do Vite
```
