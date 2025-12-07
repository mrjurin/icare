"use client";

import { forwardRef, type ElementType } from "react";
import { Slot } from "@radix-ui/react-slot";

type InputProps = React.ComponentProps<"input"> & { asChild?: boolean };

const base = "min-h-[44px] h-10 px-3 text-base sm:text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary";

const Input = forwardRef<HTMLInputElement, InputProps>(({ asChild, className, ...props }, ref) => {
  const Comp = (asChild ? Slot : "input") as ElementType;
  return <Comp ref={ref} className={`${base} ${className ?? ""}`} {...props} />;
});

Input.displayName = "Input";

export default Input;
