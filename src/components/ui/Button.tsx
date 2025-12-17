"use client";

import { forwardRef, type ElementType, useCallback } from "react";
import { Slot } from "@radix-ui/react-slot";
import { useLoadingOverlay } from "@/hooks/useLoadingOverlay";

type ButtonProps = React.ComponentProps<"button"> & { 
  asChild?: boolean; 
  variant?: "primary" | "outline";
  /**
   * If true, disables automatic loading overlay detection for async onClick handlers.
   * Use this if you want to manually control the loading state.
   */
  disableAutoLoading?: boolean;
};

const base = "inline-flex items-center justify-center gap-2 rounded-lg min-h-[44px] h-10 sm:h-10 px-4 text-sm font-bold touch-manipulation";
const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-white hover:bg-primary/90",
  outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  asChild, 
  variant = "primary", 
  className, 
  onClick,
  disableAutoLoading = false,
  ...props 
}, ref) => {
  const { withLoading } = useLoadingOverlay();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!onClick) return;

      const result = onClick(e);

      // Only apply loading overlay for actual buttons, not when asChild is used (e.g., with Links)
      // When asChild is true, the child component (Link) handles its own behavior
      if (
        !asChild &&
        !disableAutoLoading &&
        result &&
        typeof result === "object" &&
        "then" in result
      ) {
        const promise = result as Promise<unknown>;
        if (typeof promise.then === "function") {
          // Wrap the async operation with loading overlay
          const wrappedFn = withLoading(async () => {
            await promise;
          });
          wrappedFn();
        }
      }
    },
    [onClick, withLoading, disableAutoLoading, asChild]
  );

  const Comp = (asChild ? Slot : "button") as ElementType;
  return (
    <Comp
      ref={ref}
      className={`${base} ${variants[variant]} ${className ?? ""}`}
      onClick={handleClick}
      {...props}
    />
  );
});

Button.displayName = "Button";

export default Button;

