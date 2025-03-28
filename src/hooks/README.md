# src/hooks

This directory contains custom React hooks designed to encapsulate reusable stateful logic or side effects.

## Hooks

*   **`useDelayedLoading.ts`**:
    *   Provides a way to manage a loading state that only becomes `true` after a specified delay.
    *   Useful for preventing brief "flash" loading indicators for very fast operations.
    *   Returns `[loading, setIsLoading, resetLoading]`. Call `setIsLoading(true)` to start the potential loading state, and `resetLoading()` to cancel it or set it back to `false`. The `loading` state variable will only become `true` if `setIsLoading(true)` was called and the delay has passed without `resetLoading` being called.

## Usage

```tsx
import useDelayedLoading from '../hooks/useDelayedLoading';

const MyComponent = () => {
  const [data, setData] = useState(null);
  // Show loading only if fetching takes longer than 300ms
  const [showLoadingIndicator, triggerLoading, cancelLoading] = useDelayedLoading(300);

  const fetchData = async () => {
    triggerLoading(true); // Start potential loading
    try {
      const result = await api.fetchSomeData();
      setData(result);
    } catch (error) {
      // Handle error
    } finally {
      cancelLoading(); // Stop loading indicator immediately or prevent it from showing
    }
  };

  return (
    <div>
      {showLoadingIndicator && <p>Loading...</p>}
      {/* Render data */}
    </div>
  );
}
```