# src/layouts

This directory contains components responsible for the overall structure and layout of application pages. Layouts typically include common elements like headers, footers, sidebars, and define the main content area.

## Layouts

*   **`MainLayout.tsx`**:
    *   The primary layout for authenticated users.
    *   Includes the `Sidebar` component.
    *   Provides the main content area where page components are rendered.
    *   Includes a standard application footer.
    *   Handles redirection to `/login` if the user becomes unauthenticated while navigating within the layout.

## Usage

Layout components are typically used within the routing setup (`App.tsx`) to wrap page components.

```tsx
// Example in App.tsx
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/Home/Home';

<Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
```