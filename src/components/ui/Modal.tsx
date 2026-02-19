import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { cn } from './cn'

export function Modal({
  open,
  onClose,
  title,
  children,
  widthClass = 'w-[520px]',
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  widthClass?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={cn('relative glass-strong rounded-2xl border border-white/12 shadow-soft max-h-[85vh] overflow-hidden', widthClass)}>
        {title && (
          <div className="px-5 py-4 border-b border-white/10">
            <div className="text-sm font-semibold">{title}</div>
          </div>
        )}
        <div className="p-5 overflow-auto max-h-[calc(85vh-64px)]">{children}</div>
      </div>
    </div>,
    document.body
  )
}
