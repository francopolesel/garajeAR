import React from "react";
import { cn } from "../../lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <input ref={ref} className={cn("w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none", error && "border-red-500", className)} {...props} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }>(
  ({ className, label, error, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <textarea ref={ref} className={cn("w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none", error && "border-red-500", className)} {...props} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  ),
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }>(
  ({ className, label, error, children, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium">{label}</label>}
      <select ref={ref} className={cn("w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none", error && "border-red-500", className)} {...props}>
        {children}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  ),
);
Select.displayName = "Select";
