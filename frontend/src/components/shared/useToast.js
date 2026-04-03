/**
 * useToast — thin wrapper around react-hot-toast.
 * Provides: toast.success(), toast.error(), toast.info()
 * The <Toaster /> component is mounted in AppLayout.jsx.
 */
import toast from 'react-hot-toast'

export function useToast() {
  return {
    success: (msg) => toast.success(msg),
    error: (msg) => toast.error(msg),
    info: (msg) => toast(msg, {
      icon: 'ℹ',
      style: { borderLeft: '3px solid var(--accent-cyan)' },
    }),
  }
}
