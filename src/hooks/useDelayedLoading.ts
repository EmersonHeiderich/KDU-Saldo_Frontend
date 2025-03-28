import { useState, useEffect, useRef } from 'react';

/**
 * Hook para gerenciar loading com delay
 * @param delay Tempo em ms antes de mostrar o loading
 * @returns [loading, setIsLoading, resetLoading]
 */
export const useDelayedLoading = (delay: number = 500) => {
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      timerRef.current = setTimeout(() => {
        setLoading(true);
      }, delay);
    } else {
      setLoading(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading, delay]);

  const resetLoading = () => {
    setIsLoading(false);
    setLoading(false);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return [loading, setIsLoading, resetLoading] as const;
};

export default useDelayedLoading;
