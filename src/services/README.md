# src/services

This layer contains the logic for interacting with the backend API, fetching data, transforming it if necessary for frontend use, and potentially encapsulating related business logic that doesn't belong in components.

## Responsibilities

*   **API Communication:** Uses functions from `src/utils/api.ts` to make HTTP requests to the backend endpoints.
*   **Data Fetching:** Provides functions (e.g., `getAllUsers`, `getProductMatrixData`) that components can call to retrieve data.
*   **Data Transformation/Mapping:**
    *   Defines interfaces representing the raw data structure received from the API (usually `snake_case`, prefixed with `Api...`).
    *   Defines interfaces representing the data structure preferred for use within the frontend (often `camelCase` or using Portuguese names as needed by components).
    *   Includes mapping functions (e.g., `mapApiUserToFrontend`) to convert between the API structure and the frontend structure when necessary. Sometimes, components might consume the API structure directly if it's simple enough.
*   **Error Handling:** Catches errors from the API layer (`ApiError`) and potentially throws more specific or user-friendly errors for components to handle.
*   **Payload Preparation:** Ensures data sent *to* the backend (e.g., creating/updating users) matches the expected API format (usually `snake_case`).

## Files

*   **`accountsReceivableService.ts`**: Handles searching receivables and generating Boletos (Bank Slips). Interacts with `/api/accounts-receivable/*`.
*   **`authService.ts`**: Handles login, logout, token verification flows. Interacts with `/api/auth/*`. Stores/retrieves token and user data from `localStorage`.
*   **`customerPanelService.ts`**: Fetches and maps customer (PF/PJ) data and statistics. Interacts with `/api/customer_panel/*`. Includes formatting helpers.
*   **`fabricService.ts`**: Fetches and maps fabric list data (balances, costs, details). Interacts with `/api/fabrics/*`. Includes sorting and export logic.
*   **`observationService.ts`**: Manages product observations (fetching, creating, resolving, counting). Interacts with `/api/observations/*`.
*   **`productService.ts`**: Fetches product matrix and variant details. Interacts with `/api/products/*`. Includes matrix/table utility functions.
*   **`userService.ts`**: Manages CRUD operations for users. Interacts with `/api/users/*`. Handles mapping between API and frontend user structures.