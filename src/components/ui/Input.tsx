import React from 'react'
import { cn } from './cn'

type Props = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl bg-white/5 border border-white/10 px-3 text-sm outline-none',
        'focus:border-white/20 focus:bg-white/7',
        className
      )}
      {...props}
    />
  )
}
