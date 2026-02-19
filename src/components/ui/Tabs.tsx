import React from 'react'
import { cn } from './cn'

export function Tabs({
  value,
  onChange,
  items,
}: {
  value: string
  onChange: (v: string) => void
  items: Array<{ value: string; label: string }>
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-white/6 border border-white/10 p-1">
      {items.map((it) => {
        const active = it.value === value
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={cn(
              'h-9 px-3 rounded-lg text-sm transition',
              active ? 'bg-white/10 border border-white/10' : 'hover:bg-white/8'
            )}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
