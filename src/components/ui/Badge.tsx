import React from 'react'
import { cn } from './cn'

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'good' | 'warn' }) {
  const cls =
    tone === 'good'
      ? 'bg-emerald-500/12 border-emerald-400/20 text-emerald-200'
      : tone === 'warn'
        ? 'bg-amber-500/12 border-amber-400/20 text-amber-200'
        : 'bg-white/8 border-white/12 text-white/80'

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs', cls)}>
      {children}
    </span>
  )
}
