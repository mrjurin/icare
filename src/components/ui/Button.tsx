"use client";

import { forwardRef, type ElementType } from "react";
import { Slot } from "@radix-ui/react-slot";

type ButtonProps = React.ComponentProps<"button"> & { asChild?: boolean; variant?: "primary" | "outline" };

const base = "inline-flex items-center justify-center gap-2 rounded-lg h-10 px-4 text-sm font-bold";
const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-white hover:bg-primary/90",
  outline: "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ asChild, variant = "primary", className, ...props }, ref) => {
  const Comp = (asChild ? Slot : "button") as ElementType;
  return <Comp ref={ref} className={`${base} ${variants[variant]} ${className ?? ""}`} {...props} />;
});

Button.displayName = "Button";

export default Button;

