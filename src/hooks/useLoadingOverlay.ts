"use client";

import { useLoadingOverlayContext } from "@/contexts/LoadingOverlayContext";

/**
 * Hook for managing loading overlay state
 * 
 * @example
 * ```tsx
 * const { withLoading, setLoading, isLoading } = useLoadingOverlay();
 * 
 * // Wrap async function
 * const handleClick = withLoading(async () => {
 *   await someAsyncOperation();
 * });
 * 
 * // Manual control
 * setLoading(true);
 * try {
 *   await operation();
 * } finally {
 *   setLoading(false);
 * }
 * ```
 */
export function useLoadingOverlay() {
  const context = useLoadingOverlayContext();

  return {
    isLoading: context.isLoading,
    message: context.message,
    setLoading: context.setLoading,
    withLoading: context.withLoading,
  };
}

