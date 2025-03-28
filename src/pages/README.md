# src/pages

This directory contains the main view components for each distinct feature or page of the application.

## Structure

Each subdirectory typically represents a page and contains:

*   **`PageName.tsx`**: The main component for the page, responsible for fetching data (using services), managing page-specific state, and orchestrating child components.
*   **`PageName.module.css`**: CSS Modules file containing styles specific to this page and its components.
*   **`components/`** (Optional): A subdirectory containing smaller components used only within this specific page (e.g., `ProductMatrix.tsx`, `UserModal.tsx`).

## Pages

*   **`CustomerPanel/`**: Displays customer details and financial statistics.
*   **`Fabrics/`**: Lists fabric (raw material) balances, costs, and details.
*   **`Home/`**: The main dashboard/entry point after login, showing cards linking to different sections.
*   **`Login/`**: Handles user login authentication.
*   **`Products/`**: Displays finished product balances in a matrix format and allows viewing details/observations.
*   **`Users/`**: (Admin only) Allows managing application users and their permissions.

## Guidelines

*   Pages orchestrate the UI for a specific feature.
*   They fetch data using functions from the `src/services` directory.
*   They manage the primary state for the feature (e.g., fetched data, loading/error states, modal visibility).
*   They pass data down to child components (often in `components/`) via props.
*   Keep pages focused on the specific feature; reusable logic should be in hooks, services, or utils.