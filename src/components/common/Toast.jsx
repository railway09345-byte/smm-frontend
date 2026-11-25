import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, X, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3200) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-surface border border-border text-text shadow-lg animate-in fade-in slide-in-from-bottom-2"
          >
            {toast.type === 'success' && <Check className="w-4 h-4 shrink-0 text-success" />}
            {toast.type === 'error' && <X className="w-4 h-4 shrink-0 text-error" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0 text-warning" />}
            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0 text-info" />}
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: (msg) => console.log('Toast:', msg) };
  }
  return context;
}
