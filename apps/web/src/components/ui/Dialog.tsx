import React from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        {title && <div className="p-5 border-b border-gray-100 dark:border-gray-800 font-semibold">{title}</div>}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-12 px-4">
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-200 dark:bg-gray-800 rounded", className)} />;
}
