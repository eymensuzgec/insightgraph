import React from 'react'
import { cn } from './cn'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: Props) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
  const sizes = size === 'sm' ? 'h-9 px-3 text-sm' : 'h-10 px-4 text-sm'
  const styles =
    variant === 'primary'
      ? 'bg-white/10 hover:bg-white/14 border border-white/12 shadow-glow'
      : variant === 'danger'
        ? 'bg-red-500/15 hover:bg-red-500/20 border border-red-400/20'
        : 'bg-transparent hover:bg-white/8 border border-white/10'

  return (
    <button className={cn(base, sizes, styles, className)} {...props} />
  )
}
