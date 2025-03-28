# src/components

This directory contains reusable UI components shared across different pages or layouts of the application.

## Components

*   **`BaseModal/`**: A foundational modal component providing structure, animations, loading state, and close handling (ESC key, close button). Other modals should extend or utilize this component.
*   **`Sidebar/`**: The main navigation sidebar for the application, displayed within the `MainLayout`. It shows menu items based on user permissions.

## Guidelines

*   Components here should be generic and reusable.
*   They should receive data and callbacks via props.
*   Avoid page-specific logic within these components.
*   Use CSS Modules for styling to prevent class name collisions.
*   If a component becomes complex or is only used by a single page, consider moving it to that page's `components/` subdirectory.