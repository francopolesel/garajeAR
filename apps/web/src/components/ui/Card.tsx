import React from "react";
import { cn } from "../../lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm", className)}>{children}</div>;
}
export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5 border-b border-gray-100 dark:border-gray-800", className)}>{children}</div>;
}
export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn("text-lg font-semibold", className)}>{children}</h3>;
}

export function Badge({ className, children, variant = "default" }: { className?: string; children: React.ReactNode; variant?: "default" | "success" | "warning" | "destructive" | "info" }) {
  const v = {
    default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    success: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    destructive: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", v[variant], className)}>{children}</span>;
}
