# src/contexts

This directory holds React Context providers and hooks for managing global application state or shared state between distant components.

## Contexts

*   **`AuthContext.tsx`**:
    *   Manages user authentication state (`isAuthenticated`, `user`, `loading`).
    *   Provides functions for `login`, `logout`, and token verification.
    *   Loads initial state by checking `localStorage` for a valid token on application startup.
    *   Exposes the `useAuth` hook for components to easily access authentication state and functions.

## Usage

Wrap the relevant parts of your application (usually the entire `App` component) with the context provider:

```tsx
// Example in main.tsx or App.tsx
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
```

Consume the context in functional components using the `useAuth` hook:

```tsx
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { isAuthenticated, user, login } = useAuth();
  // ... use auth state and functions
}
```