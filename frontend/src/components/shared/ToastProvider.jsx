import { useCallback, useMemo, useState } from "react";
import { ToastContext } from "./toastContext";

function buildToast(message, tone) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    tone,
  };
}

function toneClasses(tone) {
  if (tone === "error") return "border-[var(--border)] bg-[#fff8d7] text-ink";
  if (tone === "success") return "border-[var(--border)] bg-[#e8fbff] text-ink";
  return "border-[var(--border)] bg-[var(--bg)] text-ink";
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((message, tone = "info") => {
    const toast = buildToast(message, tone);
    setToasts((prev) => [...prev, toast]);
    window.setTimeout(() => remove(toast.id), 3200);
  }, [remove]);

  const api = useMemo(() => ({
    info: (message) => push(message, "info"),
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[320px] max-w-[90vw] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-[4px] border-2 px-3 py-2 text-sm shadow-[4px_4px_0_var(--border)] ${toneClasses(toast.tone)}`}
            role="status"
          >
            <div className="flex items-start justify-between gap-2">
              <p>{toast.message}</p>
              <button
                type="button"
                className="text-xs opacity-70 hover:opacity-100"
                onClick={() => remove(toast.id)}
                aria-label="Dismiss notification"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
