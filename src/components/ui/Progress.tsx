import React from 'react'

export function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 w-full rounded-full bg-white/8 overflow-hidden">
      <div className="h-full bg-white/20" style={{ width: `${v}%` }} />
    </div>
  )
}
