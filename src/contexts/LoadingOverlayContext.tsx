"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface LoadingOverlayContextType {
  isLoading: boolean;
  message: string | null;
  setLoading: (loading: boolean, message?: string) => void;
  withLoading: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    message?: string
  ) => T;
}

const LoadingOverlayContext = createContext<LoadingOverlayContextType | undefined>(undefined);

export function LoadingOverlayProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const setLoading = useCallback((loading: boolean, loadingMessage?: string) => {
    setIsLoading(loading);
    setMessage(loadingMessage || null);
  }, []);

  const withLoading = useCallback(
    <T extends (...args: any[]) => Promise<any>>(
      fn: T,
      loadingMessage?: string
    ): T => {
      return (async (...args: Parameters<T>) => {
        setIsLoading(true);
        if (loadingMessage) {
          setMessage(loadingMessage);
        }
        try {
          const result = await fn(...args);
          return result;
        } finally {
          setIsLoading(false);
          setMessage(null);
        }
      }) as T;
    },
    []
  );

  return (
    <LoadingOverlayContext.Provider
      value={{
        isLoading,
        message,
        setLoading,
        withLoading,
      }}
    >
      {children}
    </LoadingOverlayContext.Provider>
  );
}

export function useLoadingOverlayContext() {
  const context = useContext(LoadingOverlayContext);
  if (context === undefined) {
    throw new Error("useLoadingOverlayContext must be used within a LoadingOverlayProvider");
  }
  return context;
}

