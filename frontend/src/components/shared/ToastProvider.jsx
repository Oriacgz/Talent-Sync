/**
 * ToastProvider — wraps the app and provides the toast API via context.
 * Now delegates to react-hot-toast for rendering. The <Toaster> is mounted here
 * at the root so it works on both authenticated and unauthenticated pages.
 */
import { useCallback, useMemo } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { ToastContext } from './toastContext'

export function ToastProvider({ children }) {
  const success = useCallback((message) => toast.success(message), [])
  const error = useCallback((message) => toast.error(message), [])
  const info = useCallback((message) => toast(message, {
    icon: 'ℹ',
    style: { borderLeft: '3px solid var(--accent-cyan)' },
  }), [])

  const api = useMemo(() => ({ success, error, info }), [success, error, info])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
          success: {
            duration: 5000,
            iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-card)' },
          },
          error: {
            duration: 8000,
            iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg-card)' },
          },
        }}
      />
    </ToastContext.Provider>
  )
}
