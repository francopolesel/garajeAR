import React, { createContext, useContext, useState, useCallback } from "react";

interface Toast { id: number; message: string; type?: "success" | "error" | "info" }
interface ToastCtx { toast: (message: string, type?: Toast["type"]) => void }
const Ctx = createContext<ToastCtx>(null!);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm ${t.type === "success" ? "bg-green-600" : t.type === "error" ? "bg-red-600" : "bg-gray-800"}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useToast() { return useContext(Ctx); }
