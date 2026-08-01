import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, CircleAlert, Info, X, XCircle } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export type ToastTone = 'success' | 'info' | 'warning' | 'error'

export type ToastInput = {
  title: string
  message?: string
  tone?: ToastTone
  duration?: number
}

type ToastItem = ToastInput & { id: number }

type ToastContextValue = {
  pushToast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toastIcons = {
  success: CheckCircle2,
  info: Info,
  warning: CircleAlert,
  error: XCircle,
} satisfies Record<ToastTone, typeof CheckCircle2>

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((input: ToastInput) => {
    const id = nextId.current++
    const item: ToastItem = { tone: 'success', duration: 2600, ...input, id }
    setToasts((current) => [...current.slice(-3), item])
    window.setTimeout(() => dismissToast(id), item.duration)
  }, [dismissToast])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = toastIcons[toast.tone ?? 'success']
            return (
              <motion.div
                className={'toast-card toast-' + (toast.tone ?? 'success')}
                key={toast.id}
                initial={{ opacity: 0, y: 18, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              >
                <span className="toast-icon"><Icon size={16} /></span>
                <span className="toast-copy"><strong>{toast.title}</strong>{toast.message && <small>{toast.message}</small>}</span>
                <button type="button" className="toast-close" aria-label="关闭提醒" onClick={() => dismissToast(toast.id)}><X size={14} /></button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
