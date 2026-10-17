import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
      primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100",
      ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      outline: "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
    };
    const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" };
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
        {loading && <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
