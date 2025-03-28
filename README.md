# Saldo Frontend

React frontend application for the Saldo API, allowing users to view product and fabric balances, customer information, and manage users/observations based on their permissions.

Built with Vite, React, TypeScript, and CSS Modules.

## Project Structure

```
saldo-frontend/
│
├── public/             # Static assets (favicon, etc.)
│
├── src/
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Reusable UI components (Sidebar, BaseModal)
│   ├── contexts/       # React Context for global state (AuthContext)
│   ├── hooks/          # Custom React hooks (useDelayedLoading)
│   ├── layouts/        # Page layout components (MainLayout)
│   ├── pages/          # Feature-specific pages/views
│   │   ├── CustomerPanel/
│   │   ├── Fabrics/
│   │   ├── Home/
│   │   ├── Login/
│   │   ├── Products/
│   │   └── Users/
│   ├── services/       # API interaction logic and data transformation
│   ├── utils/          # Utility functions, API config, type definitions
│   ├── App.css         # Global App styles, CSS variables
│   ├── App.tsx         # Main application component, routing setup
│   ├── index.css       # CSS resets and base styles
│   ├── main.tsx        # Application entry point
│   └── vite-env.d.ts   # Vite environment types
│
├── .env                # Local environment variables (VITE_API_BASE_URL)
├── .env.example        # Example environment variables
├── .gitignore
├── eslint.config.js    # ESLint configuration (new format)
├── index.html          # Main HTML entry point
├── package-lock.json
├── package.json
├── tsconfig.app.json   # TypeScript config for the app source
├── tsconfig.json       # Root TypeScript config
├── tsconfig.node.json  # TypeScript config for Node scripts (like vite.config.ts)
└── vite.config.ts      # Vite build/dev server configuration
```

See the `README.md` file inside each `src` subdirectory for more details on its specific role.

## Setup and Installation

1.  **Prerequisites:** Node.js (v18+) and npm.
2.  **Clone:** `git clone <repository-url>`
3.  **Navigate:** `cd saldo-frontend`
4.  **Install:** `npm install`
5.  **Configure Environment:**
    *   Copy `.env.example` to `.env`.
    *   Edit `.env` and set `VITE_API_BASE_URL` to the correct URL of your running backend API (e.g., `http://localhost:5004`).
6.  **Run Development Server:** `npm run dev`
    *   The application will be available at `http://localhost:5173` (or the specified host/port).
7.  **Build for Production:** `npm run build`
    *   Output will be in the `dist/` directory.

## Development Standards

*   **Language:** TypeScript
*   **Framework:** React
*   **Styling:** CSS Modules (e.g., `MyComponent.module.css`) and global styles (`App.css`, `index.css`) with CSS variables.
*   **State Management:** React Context API (`AuthContext`), component local state (`useState`, `useReducer`).
*   **Routing:** React Router v6.
*   **API Interaction:** `fetch` API wrapped in service functions (`src/services`) with error handling and potential mapping. Use `snake_case` for API request/response interfaces (`Api...`) and `camelCase` for internal frontend interfaces.
*   **Linting/Formatting:** ESLint + Prettier (configure Prettier if needed).
*   **Component Structure:** Functional components with hooks. Organize page-specific components within the page's directory (`src/pages/PageName/components/`).
*   **Naming:**
    *   Components: `PascalCase` (`MyComponent.tsx`)
    *   CSS Modules: `PascalCase.module.css` (`MyComponent.module.css`)
    *   Variables/Functions: `camelCase`
    *   Interfaces/Types: `PascalCase`
    *   API Interfaces: `PascalCase` prefixed with `Api` (e.g., `ApiUser`)
    *   Frontend Interfaces: `PascalCase` (e.g., `User`)

## Available Scripts

*   `npm run dev`: Starts the Vite development server.
*   `npm run build`: Builds the application for production.
*   `npm run lint`: Lints the code using ESLint.
*   `npm run preview`: Serves the production build locally.