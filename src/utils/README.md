# src/utils

This directory contains utility modules and configuration files that provide support functions and shared settings used across the frontend application.

## Files

*   **`api.ts`**:
    *   Contains the core `apiRequest` function for making HTTP requests to the backend API.
    *   Handles adding the `Authorization` header, base error handling, logging, and automatic retries for network/timeout issues.
    *   Exports specific named functions (e.g., `getUsers`, `getProductMatrix`) for each backend endpoint, which utilize `apiRequest` internally.
    *   Defines a custom `ApiError` class.
*   **`config.ts`**:
    *   Defines the `API_BASE_URL` (read from `VITE_API_BASE_URL` environment variable).
    *   Exports an `API_ENDPOINTS` object containing the full URLs for all backend API endpoints, constructed using the base URL. This centralizes endpoint definitions.

## Guidelines

*   Utilities here should be generic and not tied to specific business logic or UI components.
*   Functions should be pure (predictable output for given input) whenever possible.
*   Configuration should be clearly defined and easily accessible.
*   Avoid dependencies on specific pages or complex application state within utils.