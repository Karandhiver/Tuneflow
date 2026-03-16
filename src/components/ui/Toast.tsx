'use client'
import { create } from 'zustand'
import { useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastStore {
  toasts: Toast[]
  add: (message: string, type?: ToastType) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (msg: string) => useToastStore.getState().add(msg, 'success'),
  error: (msg: string) => useToastStore.getState().add(msg, 'error'),
  info: (msg: string) => useToastStore.getState().add(msg, 'info'),
}

const icons = { success: CheckCircle, error: AlertCircle, info: Info }
const colors = {
  success: 'text-green-400',
  error: 'text-apple-red',
  info: 'text-blue-400',
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[300] flex flex-col items-center gap-2 pointer-events-none"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
    >
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className="glass rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl pointer-events-auto animate-fade-in max-w-xs mx-4"
          >
            <Icon size={18} className={colors[t.type]} />
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)}>
              <X size={14} className="text-apple-text-secondary" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
